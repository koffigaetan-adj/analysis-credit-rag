import os
import json
import typing
import io
import database 
from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pypdf import PdfReader
import google.generativeai as genai
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import plotly.graph_objects as go
from fastapi import HTTPException
from auth import router as auth_router, get_current_user

# --- 1. CONFIGURATION & ROTATION ---
load_dotenv()
app = FastAPI()

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/avatars", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

API_KEYS = os.getenv("GOOGLE_API_KEYS", os.getenv("GOOGLE_API_KEY", "")).split(",")
current_key_index = 0

def configure_genai():
    global current_key_index
    key = API_KEYS[current_key_index].strip()
    genai.configure(api_key=key)
    print(f"Gemini configuré avec la clé n°{current_key_index + 1}")

configure_genai()

generation_config = {
    "temperature": 0.1,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

# Utilisation du modèle 2.0 Flash (la dernière version stable/exp)
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash", 
    generation_config=generation_config,
)

# --- 2. MODÈLES DE DONNÉES ---
class ChatRequest(BaseModel):
    message: str
    context: str 
    client_type: str
    application_id: typing.Optional[int] = None

# --- 3. UTILITAIRES ---
def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_content))
        text_parts = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted: text_parts.append(str(extracted))
        return "\n".join(text_parts) + "\n" if text_parts else ""
    except: return ""

def build_hybrid_prompt(client_info: dict, extracted_text: str) -> str:
    is_company = client_info.get('clientType') == 'entreprise'
    credit_type = client_info.get('projectType', '')
    amount = client_info.get('amount')
    name = client_info.get('fullName')

    return f"""
    RÔLE : Expert en Analyse de Risque Financier.
    DOSSIER : {name} | TYPE : {client_info.get('clientType')} | MONTANT : {amount}€
    
    DATA : {extracted_text[0:30000]}

    MISSION : Analyse les documents et génère un rapport JSON complet.
    REMPLIS BIEN TOUS LES CHAMPS : 'risks', 'opportunities' et 'summary'.

    FORMAT JSON OBLIGATOIRE :
    {{
        "score": number,
        "decision": "Favorable" | "Défavorable" | "Vigilance",
        "payment_reliability": "Excellent" | "Bon" | "Moyen" | "Risqué",
        "account_trend": "En hausse" | "Stable" | "En baisse",
        "financials": {{ ... }},
        "risks": ["string"],
        "opportunities": ["string"],
        "summary": "Synthèse détaillée de l'analyse ici"
    }}
    """

# --- 4. ROUTES API ---

@app.post("/analyze_dashboard/")
async def analyze_dashboard(
    fullName: str = Form(...),
    amount: str = Form(...),
    clientType: str = Form(...),
    projectType: str = Form(...),
    email: typing.Optional[str] = Form(None),
    phone: typing.Optional[str] = Form(None),
    files: typing.List[UploadFile] = File(...),
    db: Session = Depends(database.get_db)
):
    global current_key_index
    full_extracted_text_parts = []
    gemini_vision_files = [] 
    
    for file in files:
        file_bytes = await file.read()
        mime_type = "application/pdf" if file.filename and file.filename.lower().endswith('.pdf') else "image/jpeg"
        if mime_type == "application/pdf":
            text = extract_text_from_pdf(file_bytes)
            full_extracted_text_parts.append(f"\n-- {file.filename} --\n{text}\n")
        gemini_vision_files.append({"mime_type": mime_type, "data": file_bytes})

    full_extracted_text = "".join(full_extracted_text_parts)

    prompt = build_hybrid_prompt({
        "fullName": fullName, 
        "amount": amount, 
        "clientType": clientType, 
        "projectType": projectType
    }, full_extracted_text)
    
    attempts = 0
    while attempts < len(API_KEYS):
        try:
            response = model.generate_content([prompt] + gemini_vision_files)
            json_text = response.text.replace('```json', '').replace('```', '').strip()
            result_json = json.loads(json_text)
            
            fin = result_json.get("financials", {})

            # Ajout des données pour le Frontend immédiat (sans sauvegarde automatique)
            result_json["ia_summary"] = result_json.get("summary")
            
            return result_json

        except Exception as e:
            if "429" in str(e) and attempts < len(API_KEYS) - 1:
                current_key_index = (current_key_index + 1) % len(API_KEYS)
                configure_genai()
                attempts += 1
            else:
                return {"score": 0, "summary": f"Erreur : {str(e)}", "decision": "Erreur"}

@app.get("/history/")
def get_history(db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    # Tout le monde ne voit que ses propres dossiers, même les super admins
    apps = db.query(database.Application).filter(database.Application.user_id == current_user.id).order_by(database.Application.created_at.desc()).all()

    results = []
    for a in apps:
        # On force la conversion du JSON stocké en String vers un objet Python
        def safe_json(data):
            if isinstance(data, (list, dict)): return data
            try: return json.loads(data or "{}")
            except: return {}

        def safe_list(data):
            if isinstance(data, list): return data
            try: return json.loads(data or "[]")
            except: return []

        results.append({
            "id": a.id,
            "full_name": a.full_name,
            "client_type": a.client_type,
            "project_type": a.project_type,
            "amount": a.amount,
            "score": a.score,
            "decision": a.decision,
            "ia_summary": a.ia_summary,   # Pour le backend/db
            "summary": a.ia_summary,      # Pour le composant React (important !)
            "risks": safe_list(a.risks),
            "opportunities": safe_list(a.opportunities),
            "financials": safe_json(a.financial_data),
            "created_at": a.created_at
        })
    return results

@app.post("/chat/")
async def chat_endpoint(request: ChatRequest):
    try:
        prompt = f"Contexte : {request.context}\nQuestion : {request.message}\nRéponds de manière pro et courte."
        chat_model = genai.GenerativeModel("gemini-2.0-flash")
        response = chat_model.generate_content(prompt)
        return {"response": response.text}
    except Exception as e:
        return {"response": f"Erreur Chat: {str(e)}"}

@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    app_record = db.query(database.Application).filter(database.Application.id == app_id).first()
    if not app_record: raise HTTPException(status_code=404, detail="Non trouvé")
    
    if current_user.role != "SUPER_ADMIN" and app_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")
        
    db.delete(app_record)
    db.commit()
    return {"message": "Supprimé"}

class SaveAppRequest(BaseModel):
    fullName: str
    clientType: str
    projectType: str
    amount: float
    email: typing.Optional[str] = None
    phone: typing.Optional[str] = None
    score: int
    decision: str
    summary: str
    financials: dict
    risks: list
    opportunities: list

@app.post("/applications/")
def save_application(req: SaveAppRequest, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    try:
        new_app = database.Application(
            user_id=current_user.id,
            full_name=req.fullName,
            client_type=req.clientType,
            project_type=req.projectType,
            amount=req.amount,
            email=req.email,
            phone=req.phone,
            score=req.score,
            decision=req.decision,
            ia_summary=req.summary,
            financial_data=json.dumps(req.financials),
            risks=req.risks,
            opportunities=req.opportunities,
            chat_history=[]
        )
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        return {"id": new_app.id, "message": "Enregistré avec succès"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)