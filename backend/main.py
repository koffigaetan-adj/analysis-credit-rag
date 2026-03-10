import os
import json
import typing
import io
import database 
from fastapi import FastAPI, UploadFile, File, Form, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pypdf import PdfReader
from groq import Groq
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from seed import seed_super_admin
import scoring_engine
from fastapi import HTTPException
from auth import router as auth_router, get_current_user
from email_service import send_email_sync

# --- 1. CONFIGURATION ---
load_dotenv()
app = FastAPI()

def run_migrations():
    """Vérifie et ajoute les colonnes manquantes si nécessaire (pour Supabase/Postgres)"""
    from sqlalchemy import create_engine, text
    from database import SQLALCHEMY_DATABASE_URL
    print("Vérification des migrations de base de données...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as connection:
        try:
            # Tenter d'ajouter la colonne rejection_reason si elle manque
            connection.execute(text("ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;"))
            connection.commit()
            print("Migration 'rejection_reason' vérifiée/appliquée.")
        except Exception as e:
            print(f"Note sur la migration : {e}")

@app.on_event("startup")
def on_startup():
    print("Exécution du startup...")
    run_migrations()
    
    # Le seed ne s'exécute que si ENABLE_SEED est à 'true' (par défaut non pour éviter les conflits)
    if os.getenv("ENABLE_SEED", "false").lower() == "true":
        print("Exécution du seed automatique...")
        seed_super_admin()

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

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

class GlobalChatRequest(BaseModel):
    message: str
    userName: str
    session_id: typing.Optional[str] = None # Pour rattacher le message à la bonne session

class ChatSessionCreate(BaseModel):
    title: typing.Optional[str] = "Nouvelle discussion"

class ChatSessionUpdate(BaseModel):
    title: str

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
    is_particulier = (client_info.get('clientType', '').lower() == 'particulier')
    
    if is_particulier:
        return f"""
        EXTRACTION DE DONNEES NUMERIQUES UNIQUEMENT POUR UN PARTICULIER.
        Document de : {client_info.get('fullName')} | TYPE : {client_info.get('clientType')}
        TEXTE BRUT : {extracted_text[0:40000]}
        
        Trouve ou estime les montants ANNUELS suivants en euros.
        IMPORTANT: Renvoyer UNIQUEMENT des nombres entiers ou décimaux (floats) sans aucun texte ni symbole monétaire ni calcul (ex: 7766.2, 0). Les calculs arithmétiques comme "2500 * 3" sont INTERDITS, tu dois faire les mathématiques toi-même et envoyer le résultat final sous forme de type de donnée `Number` valide en JSON.
        - revenus_annuels : Ensemble des salaires nets, primes ou pensions sur un an. (Si c'est mensuel, multiplie par 12).
        - charges_annuelles : Loyer annuel, charges locatives, pensions versées (hors crédits).
        - mensualites_credits : Le total mensuel des crédits en cours identifiés. 
        - epargne_estimee : Le total de l'épargne ou placements disponibles (livrets, assurance vie...).
        Trouve également le nom exact figurant sur le document.
        FORMAT JSON OBLIGATOIRE :
        {{
            "extracted_name": "Nom Exact Trouvé",
            "revenus_annuels": 36000,
            "charges_annuelles": 8400,
            "mensualites_credits": 500,
            "epargne_estimee": 15000
        }}
        """
    else:
        return f"""
        EXTRACTION DE DONNEES NUMERIQUES UNIQUEMENT.
        Document de : {client_info.get('fullName')} | TYPE : {client_info.get('clientType')}
        TEXTE BRUT : {extracted_text[0:40000]}
        
        Trouve ou estime les montants suivants en euros pour le dernier exercice (N) et l'exercice précédent (N-1).
        IMPORTANT: Renvoyer UNIQUEMENT des nombres entiers ou décimaux (floats) sans aucun texte ni symbole monétaire ni calcul (ex: 150000.5, 0). Les formules ou opérations arithmétiques sont INTERDITES, calcule la valeur toi-même si besoin et envoie le résultat final brut.
        Trouve également le nom exact (Personne ou Entreprise) figurant sur le document.
        FORMAT JSON OBLIGATOIRE :
        {{
            "extracted_name": "Nom Exact Trouvé",
            "revenue": 150000,
            "revenue_n_minus_1": 140000,
            "ebitda": 25000,
            "ebitda_n_minus_1": 20000,
            "net_income": 20000,
            "net_income_n_minus_1": 15000,
            "equity": 50000,
            "total_debt": 10000,
            "cash_flow": 5000,
            "working_capital": 2000
        }}
        """

def build_interpretation_prompt(client_info: dict, extracted_text: str, score_data: dict, fin_data: dict, ratios_data: dict) -> str:
    common_prompt = f"""
    RÔLE : Analyste crédit expérimenté dans une banque.
    Tu dois évaluer la solidité financière et le niveau de risque d’un dossier de financement.
    
    DOSSIER : {client_info.get('fullName')} | MONTANT DEMANDÉ : {client_info.get('amount')}€
    
    Voici les résultats EXACTS calculés par notre moteur de risque (ne les modifie pas) :
    - Score : {score_data['score']}/100
    - Décision technique de base : {score_data['decision']}
    - Facteurs de risque identifiés : {score_data.get('technical_risks', [])}
    - Facteurs positifs identifiés : {score_data.get('technical_opportunities', [])}
    
    CONTEXTE TEXTUEL BRUT EXTRAIT (Peut inclure patrimoine, garanties, historique) : 
    {extracted_text[0:15000]}
    
    Ta mission :
    1. Analyse les informations fournies (revenus, charges, dettes, patrimoine, historique, projet financé, montant demandé, etc.).
    2. Vérifie la cohérence globale entre le niveau de revenus ou CA, la capacité de remboursement, le montant demandé et l'apport.
    3. Signale clairement tout élément disproportionné ou irréaliste (ex: montant demandé énorme par rapport au CA/revenu).
    4. Ne donne JAMAIS une conclusion "parfaitement favorable" ou ne valide pas un projet si les ratios sont tendus, si c'est irréaliste ou surdimensionné.
    5. Propose des ajustements réalistes (montant plus faible, apport) ou conditions à respecter.
    6. Conclus avec un niveau de risque (faible/modéré/élevé), une recommandation claire (favorable, sous conditions, défavorable), et 2 ou 3 pistes d'amélioration concrètes.
    
    FORMAT JSON OBLIGATOIRE EN SORTIE :
    {{
        "risks": ["Liste claire des points bloquants ou fragilités", "Risque 2", ...],
        "opportunities": ["Points forts du dossier", "Ajustements proposés", ...],
        "summary": "1-2 paragraphes d'analyse argumentée et nuancée.\\n\\nSynthèse :\\nNiveau de risque : ...\\nDécision : ...\\nRecommandations : ..."
    }}
    """
    
    is_particulier = (client_info.get('clientType', '').lower() == 'particulier')
    
    if is_particulier:
        return f"""{common_prompt}
        
        DONNÉES PARTICULIER CALCULEES :
        - Revenus Annuels : {fin_data.get('revenus_annuels', 0)} €
        - Charges Annuelles : {fin_data.get('charges_annuelles', 0)} €
        - Mensualités Crédits en cours : {fin_data.get('mensualites_credits', 0)} € / mois
        - Taux d'endettement calculé : {ratios_data.get('taux_endettement_personnel_percent', 0)} %
        - Reste à vivre annuel : {ratios_data.get('reste_a_vivre_annuel', 0)} €
        """
    else:
        return f"""{common_prompt}
        
        DONNÉES ENTREPRISE CALCULEES :
        - Chiffre d'affaires : {fin_data.get('revenue', 0)} €
        - Résultat Net : {fin_data.get('net_income', 0)} €
        - Dettes Totales : {fin_data.get('total_debt', 0)} €
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
        }, full_extracted_text, score_data, fin_data, ratios_data)
        
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
            "extracted_name": extracted_data.get("extracted_name", fullName),
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

@app.get("/chat/sessions/")
def get_chat_sessions(db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    sessions = db.query(database.ChatSession).filter(database.ChatSession.user_id == current_user.id).order_by(database.ChatSession.updated_at.desc()).all()
    return [{
        "id": s.id,
        "title": s.title,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "messages": s.messages if isinstance(s.messages, list) else json.loads(s.messages or "[]")
    } for s in sessions]

@app.post("/chat/sessions/")
def create_chat_session(req: ChatSessionCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    new_session = database.ChatSession(
        user_id=current_user.id,
        title=req.title,
        messages=[]
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"id": new_session.id, "title": new_session.title, "messages": []}

@app.delete("/chat/sessions/{session_id}")
def delete_chat_session(session_id: str, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    session_record = db.query(database.ChatSession).filter(database.ChatSession.id == session_id, database.ChatSession.user_id == current_user.id).first()
    if not session_record:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    db.delete(session_record)
    db.commit()
    return {"message": "Session supprimée."}

@app.put("/chat/sessions/{session_id}")
def update_chat_session(session_id: str, req: ChatSessionUpdate, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    session_record = db.query(database.ChatSession).filter(database.ChatSession.id == session_id, database.ChatSession.user_id == current_user.id).first()
    if not session_record:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    session_record.title = req.title
    db.commit()
    return {"message": "Session mise à jour.", "title": req.title}

@app.get("/chat/sessions/{session_id}")
def get_chat_session(session_id: str, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    session_record = db.query(database.ChatSession).filter(
        database.ChatSession.id == session_id,
        database.ChatSession.user_id == current_user.id
    ).first()
    if not session_record:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    return {
        "id": session_record.id,
        "title": session_record.title,
        "created_at": session_record.created_at,
        "updated_at": session_record.updated_at,
        "messages": session_record.messages if isinstance(session_record.messages, list) else json.loads(session_record.messages or "[]")
    }

@app.post("/chat/finance/")
async def finance_chat_endpoint(request: GlobalChatRequest, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    try:
        session_id = request.session_id
        session_record = None
        
        # Trouver ou créer une session
        if session_id:
            session_record = db.query(database.ChatSession).filter(database.ChatSession.id == session_id, database.ChatSession.user_id == current_user.id).first()
        
        if not session_record:
            # Créer une nouvelle session si non fournie ou introuvable
            title = request.message[:30] + "..." if len(request.message) > 30 else request.message
            session_record = database.ChatSession(
                user_id=current_user.id,
                title=title,
                messages=[]
            )
            db.add(session_record)
            db.commit()
            db.refresh(session_record)
            session_id = session_record.id

        # Mettre à jour les messages avec la question de l'utilisateur
        current_messages = session_record.messages if isinstance(session_record.messages, list) else json.loads(session_record.messages or "[]")
        user_msg = {"role": "user", "content": request.message}
        current_messages.append(user_msg)
        
        # Construire l'historique pour le prompt (limite aux 10 derniers)
        history_context = ""
        recent_messages = current_messages[-10:-1] # exclure le dernier message qu'on vient d'ajouter
        for msg in recent_messages:
            history_context += f"{'Utilisateur' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}\n"
            
        system_prompt = (
            f"Tu es l'assistant IA de la plateforme Kaïs Analytics. Tu t'adresses à {request.userName}.\n"
            "RÈGLE STRICTE : Tu dois UNIQUEMENT répondre aux questions liées à la banque, "
            "à la finance, au crédit, ou à l'analyse de risque financier. \n"
            "RÈGLE 2 : Si la question est une salutation basique, réponds poliment en saluant la personne par son prénom et en lui demandant comment tu peux l'aider avec ses finances.\n"
            "RÈGLE 3 : Si la question n'a rien à voir avec les domaines autorisés (banque, finance, crédit, analyse), "
            "tu DOIS REFUSER de répondre avec ce message exact ou une variante très proche : "
            "'Désolé, je suis paramétré pour répondre uniquement aux questions relevant du domaine financier, bancaire ou du crédit. "
            "Comment puis-je vous aider sur ces sujets ?'\n"
            "RÈGLE 4 : Sois professionnel, concis, et précis.\n"
            "Voici les messages précédents de la conversation pour le contexte (optionnel):\n"
            f"{history_context}"
        )
        
        prompt = f"Utilisateur ({request.userName}): {request.message}"
        
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            model=MODEL_NAME,
            temperature=0.3
        )
        
        ai_response = response.choices[0].message.content
        from sqlalchemy.orm.attributes import flag_modified
        
        # Enregistrer la réponse de l'IA
        current_messages.append({"role": "assistant", "content": ai_response})
        
        # Forcer SQLAlchemy à détecter le changement du JSON
        session_record.messages = list(current_messages)
        flag_modified(session_record, "messages")
        
        db.commit()

        return {"response": ai_response, "session_id": session_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"response": f"Erreur Chat Finance: {str(e)}"}

@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    app_record = db.query(database.Application).filter(database.Application.id == app_id).first()
    if not app_record: raise HTTPException(status_code=404, detail="Non trouvé")
    
    if current_user.role != "SUPER_ADMIN" and app_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")
        
    # Notification de suppression
    delete_notif = database.Notification(
        user_id=current_user.id,
        title="Analyse supprimée",
        message=f"L'analyse de {app_record.full_name} a été supprimée.",
        type="INFO"
    )
    db.add(delete_notif)

    db.delete(app_record)
    db.commit()
    return {"message": "Supprimé"}

def send_contact_email(email: str, subject: str, message: str, attachment_name: typing.Optional[str] = None):
    # Envoi d'un vrai email via le service SMTP configuré
    target_admin_email = os.getenv("FROM_EMAIL", "gaetan.eyes@gmail.com") # ou une autre adresse fixe gérant le support
    
    html_content = f"""
    <html>
      <body>
        <h3>Nouveau message de contact depuis l'application Kaïs Analytics</h3>
        <p><strong>De :</strong> {email}</p>
        <p><strong>Sujet :</strong> {subject}</p>
        <p><strong>Message :</strong></p>
        <p>{message.replace(chr(10), '<br>')}</p>
    """
    if attachment_name:
        html_content += f"<p><em>Une pièce jointe a été fournie : {attachment_name} (Stockage local non implémenté)</em></p>"
    
    html_content += "</body></html>"
    
    # En production, envoyer à target_admin_email
    send_email_sync(target_admin_email, f"Contact Kaïs Analytics : {subject}", html_content)

    # Email de confirmation (Auto-reply) pour l'utilisateur
    auto_reply_html = f"""
    <html>
      <body>
        <h3>Bonjour,</h3>
        <p>Nous vous confirmons la bonne réception de votre message depuis le centre d'aide de Kaïs Analytics :</p>
        <p><em>"{subject}"</em></p>
        <br>
        <p>L'équipe support va analyser votre demande et reviendra vers vous très bientôt.</p>
        <br>
        <p>Cordialement,</p>
        <p>L'équipe Kaïs Analytics</p>
      </body>
    </html>
    """
    send_email_sync(email, "Accusé de réception - Kaïs Analytics", auto_reply_html)

@app.post("/contact/")
async def handle_contact(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    subject: str = Form(...),
    message: str = Form(...),
    file: typing.Optional[UploadFile] = File(None),
    current_user: database.User = Depends(get_current_user)
):
    attachment_name = None
    if file:
        attachment_name = file.filename
        # In a real app, save the file to disk/S3 or attach its bytes directly to the email
        # file_bytes = await file.read()
    
    background_tasks.add_task(send_contact_email, email, subject, message, attachment_name)
    return {"message": "Demande envoyée avec succès."}

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
        
        # Notification d'enregistrement
        save_notif = database.Notification(
            user_id=current_user.id,
            title="Analyse enregistrée",
            message=f"L'analyse de {req.fullName} a été sauvegardée avec succès.",
            type="INFO"
        )
        db.add(save_notif)
        
        db.commit()
        db.refresh(new_app)
        return {"id": new_app.id, "message": "Enregistré avec succès"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def send_report_email(email: str, subject: str, message: bytes, attachment_name: str):
    try:
        from email.mime.application import MIMEApplication
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.image import MIMEImage
        import smtplib
        import os

        # Verify SMTP Config
        if not os.getenv("SMTP_SERVER") or not os.getenv("SMTP_USERNAME") or not os.getenv("SMTP_PASSWORD"):
            print("⚠️ [EMAIL SIMULATION] Configuration SMTP manquante.")
            print(f"Rapport PDF '{attachment_name}' serait envoyé à {email}")
            return True

        msg = MIMEMultipart("related")
        msg['Subject'] = subject
        msg['From'] = f"{os.getenv('FROM_NAME', 'Kaïs Analytics')} <{os.getenv('REPLY_TO', 'no-reply@kaisanalytics.com')}>"
        msg['Reply-To'] = os.getenv('REPLY_TO', 'no-reply@kaisanalytics.com')
        msg['To'] = email

        template_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="cid:logomail" alt="Kaïs Analytics" style="max-height: 60px;">
                    </div>
                    <div style="background-color: white; padding: 20px; border-radius: 8px;">
                        <h3>Votre Rapport d'Analyse</h3>
                        <p>Veuillez trouver en pièce jointe le rapport d'analyse généré par Kaïs Analytics.</p>
                    </div>
                    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #64748b;">
                        <p>Veuillez ne pas répondre à cet email. Ce message a été généré automatiquement par Kaïs Analytics.</p>
                    </div>
                </div>
            </body>
        </html>
        """

        part = MIMEText(template_html, 'html')
        msg.attach(part)
        
        logo_path = os.path.join(os.path.dirname(__file__), "images", "logomail.png")
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as f:
                img_data = f.read()
            image = MIMEImage(img_data, name=os.path.basename(logo_path))
            image.add_header('Content-ID', '<logomail>')
            image.add_header('Content-Disposition', 'inline', filename='logomail.png')
            msg.attach(image)

        pdf_attachment = MIMEApplication(message, _subtype="pdf")
        pdf_attachment.add_header('Content-Disposition', 'attachment', filename=attachment_name)
        msg.attach(pdf_attachment)

        server = smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT", 587)))
        server.starttls()
        server.login(os.getenv("SMTP_USERNAME"), os.getenv("SMTP_PASSWORD"))
        from_email_addr = os.getenv("FROM_EMAIL") or os.getenv("SMTP_USERNAME") or "no-reply@kaisanalytics.com"
        server.sendmail(from_email_addr, email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Erreur d'envoi du rapport: {str(e)}")
        return False

@app.post("/send-report/")
async def send_report_route(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    current_user: database.User = Depends(get_current_user)
):
    try:
        file_bytes = await file.read()
        background_tasks.add_task(send_report_email, email, subject, file_bytes, file.filename)
        return {"message": "Rapport envoyé avec succès."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)