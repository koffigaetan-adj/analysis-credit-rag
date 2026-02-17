import os
import json
import typing
import io
import database 
from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
import google.generativeai as genai
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import plotly.graph_objects as go 

# --- 1. CONFIGURATION & ROTATION ---
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEYS = os.getenv("GOOGLE_API_KEYS", os.getenv("GOOGLE_API_KEY", "")).split(",")
current_key_index = 0

def configure_genai():
    global current_key_index
    key = API_KEYS[current_key_index]
    genai.configure(api_key=key)
    print(f"✅ Gemini configuré avec la clé n°{current_key_index + 1}")

configure_genai()

generation_config = {
    "temperature": 0.1,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash", # Version mise à jour
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
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted: text += extracted + "\n"
        return text
    except: return ""

def build_hybrid_prompt(client_info: dict, extracted_text: str) -> str:
    is_company = client_info.get('clientType') == 'entreprise'
    credit_type = client_info.get('projectType', '')
    amount = client_info.get('amount')
    name = client_info.get('fullName')

    if is_company:
        # PROMPT CORPORATE (ENTREPRISE)
        return f"""
        RÔLE : Expert en Analyse Financière Corporate & Audit de Risque.
        DOSSIER PRO : {name}
        DEMANDE : {amount}€ (Type: {credit_type})
        
        DATA : {extracted_text[:30000]}

        MISSION : Analyse la liasse fiscale (Bilan/Compte de résultat) et les relevés pro.
        Extraire les indicateurs de performance et de solvabilité.

        FORMAT JSON OBLIGATOIRE :
        {{
            "score": number, (0-100)
            "decision": "Favorable" | "Défavorable" | "Vigilance",
            "payment_reliability": "Excellent" | "Bon" | "Moyen" | "Risqué",
            "account_trend": "En hausse" | "Stable" | "En baisse",
            "financials": {{
                "turnover": number,         // Chiffre d'Affaires
                "net_profit": number,       // Résultat Net
                "ebitda": number,           // EBE
                "equity": number,           // Capitaux Propres
                "debt_to_ebitda": number    // Ratio d'endettement (ex: 2.5)
            }},
            "risks": [string],
            "opportunities": [string],
            "summary": "Analyse pro axée sur la rentabilité et la structure financière."
        }}
        """
    else:
        # PROMPT PARTICULIER
        return f"""
        RÔLE : Analyste Crédit Particulier.
        DOSSIER : {name} - Montant: {amount}€
        
        DATA : {extracted_text[:30000]}

        MISSION : Calculer le taux d'endettement et le reste à vivre. Repérer les incidents.

        FORMAT JSON OBLIGATOIRE :
        {{
            "score": number,
            "decision": "Favorable" | "Défavorable" | "Vigilance",
            "payment_reliability": "Excellent" | "Bon" | "Moyen" | "Risqué",
            "account_trend": "En hausse" | "Stable" | "En baisse",
            "financials": {{
                "monthly_income": number,
                "monthly_expenses": number,
                "debt_ratio": number,
                "rest_to_live": number,
                "savings_capacity": number
            }},
            "risks": [string],
            "opportunities": [string],
            "summary": "Analyse de solvabilité basée sur les revenus et charges."
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
    full_extracted_text = ""
    gemini_vision_files = [] 
    
    for file in files:
        file_bytes = await file.read()
        mime_type = "application/pdf" if file.filename.lower().endswith('.pdf') else "image/jpeg"
        if mime_type == "application/pdf":
            text = extract_text_from_pdf(file_bytes)
            full_extracted_text += f"\n-- {file.filename} --\n{text}\n"
        gemini_vision_files.append({"mime_type": mime_type, "data": file_bytes})

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
            result_json = json.loads(response.text)
            fin = result_json.get("financials", {})

            # --- GÉNÉRATION GRAPHIQUE DYNAMIQUE ---
            if clientType == 'entreprise':
                # Jauge Corporate : Ratio Endettement (Debt/EBITDA)
                debt_val = fin.get("debt_to_ebitda", 0)
                fig_gauge = go.Figure(go.Indicator(
                    mode="gauge+number", value=debt_val,
                    number={'suffix': "x", 'font': {'size': 40}},
                    title={'text': "Ratio Dette / EBE", 'font': {'size': 18}},
                    gauge={
                        'axis': {'range': [0, 8]},
                        'steps': [
                            {'range': [0, 3], 'color': "#10B981"},
                            {'range': [3, 5], 'color': "#F59E0B"},
                            {'range': [5, 8], 'color': "#EF4444"}
                        ],
                        'bar': {'color': "#1e293b"}
                    }
                ))
            else:
                # Jauge Particulier : Taux d'endettement (%)
                fig_gauge = go.Figure(go.Indicator(
                    mode="gauge+number", value=fin.get("debt_ratio", 0),
                    number={'suffix': "%"},
                    title={'text': "Taux d'endettement", 'font': {'size': 18}},
                    gauge={
                        'axis': {'range': [0, 100]},
                        'steps': [
                            {'range': [0, 33], 'color': "#10B981"},
                            {'range': [33, 100], 'color': "#EF4444"}
                        ]
                    }
                ))
            
            fig_gauge.update_layout(height=300, margin=dict(l=30, r=30, t=50, b=30), paper_bgcolor="white")

            # --- SAUVEGARDE DB ---
            new_app = database.Application(
                full_name=fullName,
                client_type=clientType,
                project_type=projectType,
                amount=float(amount),
                email=email,
                phone=phone,
                score=result_json.get("score", 0),
                decision=result_json.get("decision", "Vigilance"),
                ia_summary=result_json.get("summary", ""),
                financial_data=json.dumps(fin),
                risks=result_json.get("risks", []),
                opportunities=result_json.get("opportunities", []),
                chat_history=[]
            )
            db.add(new_app)
            db.commit()
            db.refresh(new_app)

            result_json["id"] = new_app.id
            result_json["charts"] = {
                "gauge": json.loads(fig_gauge.to_json()),
                "pie": None 
            }
            return result_json

        except Exception as e:
            if "429" in str(e) and attempts < len(API_KEYS) - 1:
                current_key_index = (current_key_index + 1) % len(API_KEYS)
                configure_genai()
                attempts += 1
            else:
                return {"score": 0, "summary": f"Erreur Analyse : {str(e)}", "decision": "Défavorable"}

@app.get("/history/")
def get_history(db: Session = Depends(database.get_db)):
    apps = db.query(database.Application).order_by(database.Application.created_at.desc()).all()
    results = []
    for a in apps:
        fin = a.financial_data if isinstance(a.financial_data, dict) else json.loads(a.financial_data or "{}")
        results.append({
            "id": a.id,
            "full_name": a.full_name,
            "client_type": a.client_type,
            "project_type": a.project_type,
            "amount": a.amount,
            "score": a.score,
            "decision": a.decision,
            "financials": fin,
            "created_at": a.created_at
        })
    return results

@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(database.get_db)):
    app_record = db.query(database.Application).filter(database.Application.id == app_id).first()
    if not app_record: return {"error": "Non trouvé"}
    db.delete(app_record)
    db.commit()
    return {"message": "Supprimé"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)