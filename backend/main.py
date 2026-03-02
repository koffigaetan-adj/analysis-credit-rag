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
from groq import Groq
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import plotly.graph_objects as go
import scoring_engine
from fastapi import HTTPException
from auth import router as auth_router, get_current_user

# --- 1. CONFIGURATION ---
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

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)

# Utilisation du modèle Llama 3 puissant et rapide pour l'extraction et l'analyse
MODEL_NAME = "llama-3.3-70b-versatile"

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

def build_extraction_prompt(client_info: dict, extracted_text: str) -> str:
    return f"""
    EXTRACTION DE DONNEES NUMERIQUES UNIQUEMENT.
    Document de : {client_info.get('fullName')} | TYPE : {client_info.get('clientType')}
    TEXTE BRUT : {extracted_text[0:40000]}
    
    Trouve ou estime les montants suivants en euros (uniquement des nombres ou 0 si introuvable).
    FORMAT JSON OBLIGATOIRE :
    {{
        "revenue": 150000,
        "net_income": 20000,
        "equity": 50000,
        "total_debt": 10000,
        "cash_flow": 5000,
        "working_capital": 2000
    }}
    """

def build_interpretation_prompt(client_info: dict, extracted_text: str, score_data: dict, fin_data: dict) -> str:
    return f"""
    RÔLE : Analyste Crédit Senior.
    DOSSIER : {client_info.get('fullName')} | MONTANT : {client_info.get('amount')}€
    
    Voici les résultats EXACTS calculés par notre moteur de risque (ne les modifie pas) :
    - Score : {score_data['score']}/100
    - Décision technique : {score_data['decision']}
    - Chiffre d'affaires : {fin_data.get('revenue', 0)}
    - Résultat Net : {fin_data.get('net_income', 0)}
    - Dettes : {fin_data.get('total_debt', 0)}
    - Facteurs de risque identifiés : {score_data.get('technical_risks', [])}
    - Facteurs positifs identifiés : {score_data.get('technical_opportunities', [])}
    
    CONTEXTE TEXTUEL BRUT : {extracted_text[0:20000]}
    
    MISSION : Rédige l'avis motivé (Risques, Opportunités, Synthèse narrative détaillée) qui justifie ce score et cette décision. Ne réinvente pas de chiffres.
    FORMAT JSON OBLIGATOIRE EN SORTIE :
    {{
        "risks": ["risque 1", "risque 2", ...],
        "opportunities": ["opportunité 1", ...],
        "summary": "Synthèse très détaillée et professionnelle des finances et du projet."
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
    full_extracted_text_parts = []
    
    for file in files:
        file_bytes = await file.read()
        mime_type = "application/pdf" if file.filename and file.filename.lower().endswith('.pdf') else "image/jpeg"
        if mime_type == "application/pdf":
            text = extract_text_from_pdf(file_bytes)
            full_extracted_text_parts.append(f"\n-- {file.filename} --\n{text}\n")
        # Groq doesn't natively support image vision for Llama 3 like Gemini 1.5,
        # so we focus purely on textual extraction from PDFs.

    full_extracted_text = "".join(full_extracted_text_parts)

    prompt = build_extraction_prompt({
        "fullName": fullName, 
        "amount": amount, 
        "clientType": clientType, 
        "projectType": projectType
    }, full_extracted_text)
    
    try:
        # PHASE 1: Extraction with Groq
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        json_text = response.choices[0].message.content
        extracted_data = json.loads(json_text)
        
        # PHASE 2: Deterministic Scoring
        scoring_result = scoring_engine.analyze_financials(extracted_data, {
            "clientType": clientType,
            "amount": amount
        })
        
        fin_data = scoring_result["raw_numbers"]
        score_data = scoring_result["scoring"]
        ratios_data = scoring_result["ratios"]
            
        # PHASE 3: Interpretation with Groq
        interpretation_prompt = build_interpretation_prompt({
            "fullName": fullName, 
            "amount": amount, 
            "clientType": clientType, 
            "projectType": projectType
        }, full_extracted_text, score_data, fin_data)
        
        interpretation_response = client.chat.completions.create(
            messages=[{"role": "user", "content": interpretation_prompt}],
            model=MODEL_NAME,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        final_json_text = interpretation_response.choices[0].message.content
        final_ia_data = json.loads(final_json_text)
        
        # Assemblage Final pour le Frontend
        final_response = {
            "score": score_data["score"],
            "decision": score_data["decision"],
            "payment_reliability": score_data.get("payment_reliability", "Moyen"),
            "account_trend": score_data.get("account_trend", "Stable"),
            "financials": {**fin_data, **ratios_data},
            "risks": list(set(score_data.get("technical_risks", []) + final_ia_data.get("risks", []))),
            "opportunities": list(set(score_data.get("technical_opportunities", []) + final_ia_data.get("opportunities", []))),
            "summary": final_ia_data.get("summary", ""),
            "ia_summary": final_ia_data.get("summary", "")
        }
        
        return final_response

    except Exception as e:
        return {"score": 0, "summary": f"Erreur avec Groq: {str(e)}", "decision": "Erreur"}

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
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME,
            temperature=0.3
        )
        return {"response": response.choices[0].message.content}
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