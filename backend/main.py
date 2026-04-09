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
import rag_engine
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
            connection.execute(text("ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;"))
            connection.commit()
            print("Migration 'rejection_reason' vérifiée/appliquée.")
        except Exception as e:
            print(f"Note sur la migration : {e}")

@app.on_event("startup")
def on_startup():
    print("=== STARTUP Kais Analytics ===")
    run_migrations()
    if os.getenv("ENABLE_SEED", "false").lower() == "true":
        print("Execution du seed automatique...")
        seed_super_admin()

    # Diagnostic des variables d'environnement RAG
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    hf_key = os.getenv("HF_API_KEY", "")

    print(f"[RAG] SUPABASE_URL  : {'OK defini' if supabase_url else 'MANQUANT'}")
    print(f"[RAG] SUPABASE_KEY  : {'OK defini' if supabase_key else 'MANQUANT'}")
    print(f"[RAG] HF_API_KEY    : {'OK defini' if hf_key else 'MANQUANT'}")

    policy_file = os.path.join(os.path.dirname(__file__), "politique_credit_banque.txt")
    print(f"[RAG] Fichier politique : {'TROUVE -> ' + policy_file if os.path.exists(policy_file) else 'INTROUVABLE -> ' + policy_file}")

    if not os.path.exists(policy_file):
        print("[RAG] Indexation ignoree : fichier politique absent du workspace.")
    elif not supabase_url or not supabase_key or not hf_key:
        print("[RAG] Indexation ignoree : variables d'environnement manquantes.")
    else:
        print("[RAG] Lancement de l'indexation dans Supabase pgvector...")
        try:
            rag_engine.process_bank_rules(policy_file)
            print("[RAG] Politique de credit indexee avec succes.")
        except Exception as e:
            import traceback
            print(f"[RAG] ERREUR lors de l'indexation : {e}")
            traceback.print_exc()

    print("=== STARTUP termine ===")


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
    session_id: typing.Optional[str] = None

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
        REGLE ABSOLUE N°1 — JSON STRICT : Les valeurs des champs numeriques DOIVENT etre des nombres uniquement. JAMAIS d'expressions mathematiques, JAMAIS de calculs, JAMAIS de formules dans le JSON.
        MAUVAIS (INTERDIT) : "revenus_annuels": 2500 * 12 + 500     ← ceci provoque une erreur critique
        BON (OBLIGATOIRE) : "revenus_annuels": 30500                 ← tu calcules d'abord dans ta tete, puis tu mets le resultat
        Si tu dois multiplier, additionner ou soustraire des valeurs, fais-le AVANT d'ecrire le JSON et n'ecris QUE le resultat final.
        REGLE ABSOLUE N°2 — TYPES : Pour les champs numeriques : uniquement float ou int. Pour les champs texte : uniquement string.
        IMPORTANT: Renvoyer UNIQUEMENT des nombres entiers ou décimaux (floats) pour les champs numériques, sans texte ni symbole monétaire ni calcul. Pour les champs texte, utiliser une chaîne de caractères. Les calculs arithmétiques comme "2500 * 3" sont INTERDITS (fais le calcul toi-même).
        
        CHAMPS OBLIGATOIRES :
        - revenus_annuels : Ensemble des salaires nets, primes ou pensions sur un an. (Si mensuel, MULTIPLIER par 12).
        - charges_annuelles : Loyer annuel, charges locatives, pensions alimentaires versées (hors crédits en cours).
        - mensualites_credits : Total MENSUEL de tous les crédits en cours (consommation, auto, immo). DOIT être un montant MENSUEL.
        - epargne_estimee : Total de l'épargne ou placements disponibles (livrets, PEL, assurance vie...).
        - apport_personnel : Montant disponible comme apport pour le projet (épargne dédiée, aide familiale). Si non mentionné, mettre 0.
        - nb_personnes_charge : Nombre de personnes à charge (enfants, personnes dépendantes). Si non mentionné, mettre 0.
        - situation_professionnelle : Type de contrat ou statut. Valeurs possibles : "CDI", "CDD", "Intérim", "Indépendant", "Gérant", "Fonctionnaire", "Retraité", "Sans emploi", "Inconnu".
        
        Trouve également le nom exact figurant sur le document.
        FORMAT JSON OBLIGATOIRE :
        {{
            "extracted_name": "Nom Exact Trouvé",
            "revenus_annuels": 36000,
            "charges_annuelles": 8400,
            "mensualites_credits": 500,
            "epargne_estimee": 15000,
            "apport_personnel": 10000,
            "nb_personnes_charge": 2,
            "situation_professionnelle": "CDI"
        }}
        """
    else:
        return f"""
        EXTRACTION DE DONNEES NUMERIQUES UNIQUEMENT POUR UNE ENTREPRISE.
        Document de : {client_info.get('fullName')} | TYPE : {client_info.get('clientType')}
        TEXTE BRUT : {extracted_text[0:40000]}
        
        Trouve ou estime les montants suivants en euros pour le dernier exercice (N) et l'exercice précédent (N-1).
        REGLE ABSOLUE N°1 — JSON STRICT : Les valeurs numeriques DOIVENT etre des nombres uniquement. JAMAIS d'expressions mathematiques dans le JSON.
        MAUVAIS (INTERDIT) : "revenue": 450000 + 50000     ← ceci provoque une erreur critique
        BON (OBLIGATOIRE)  : "revenue": 500000             ← tu calcules d'abord dans ta tete, puis tu mets le resultat final
        REGLE ABSOLUE N°2 — TYPES : Pour les champs numeriques : uniquement float ou int. Pour les champs texte : uniquement string.
        IMPORTANT: Renvoyer UNIQUEMENT des nombres entiers ou décimaux (floats) pour les champs numériques. Les formules ou opérations arithmétiques sont INTERDITES.
        
        CHAMPS OBLIGATOIRES :
        - revenue : Chiffre d'affaires HT de l'exercice N.
        - revenue_n_minus_1 : Chiffre d'affaires HT de l'exercice N-1.
        - ebitda : EBITDA (Excédent Brut d'Exploitation / EBE) de l'exercice N. Si non indiqué, estimer à partir du résultat d'exploitation.
        - ebitda_n_minus_1 : EBITDA de l'exercice N-1.
        - net_income : Résultat net de l'exercice N.
        - net_income_n_minus_1 : Résultat net de l'exercice N-1.
        - equity : Capitaux propres (fonds propres) totaux.
        - total_debt : Total des dettes financières (court terme + long terme).
        - cash_flow : Cash flow d'exploitation (capacité d'autofinancement / CAF). Si non indiqué, estimer à partir du résultat net + amortissements.
        - working_capital : Besoin en fonds de roulement (BFR). Si non indiqué, mettre 0.
        - anciennete_annees : Nombre d'années depuis la création de l'entreprise. Si inconnu, mettre 0.
        - secteur_activite : Secteur d'activité principal (ex: "BTP", "Commerce de détail", "Restauration", "Tech/IT", "Industrie", "Services"). Mettre "Inconnu" si non identifié.
        - garanties_proposees : Garanties mentionnées dans le document (ex: "Hypothèque", "Caution personnelle du gérant", "Nantissement"). Mettre "Aucune" si non mentionné.
        
        Trouve également le nom exact (Entreprise ou Dirigeant) figurant sur le document.
        FORMAT JSON OBLIGATOIRE :
        {{
            "extracted_name": "Nom Exact Trouvé",
            "revenue": 500000,
            "revenue_n_minus_1": 450000,
            "ebitda": 60000,
            "ebitda_n_minus_1": 50000,
            "net_income": 30000,
            "net_income_n_minus_1": 25000,
            "equity": 100000,
            "total_debt": 80000,
            "cash_flow": 45000,
            "working_capital": 15000,
            "anciennete_annees": 7,
            "secteur_activite": "Commerce de détail",
            "garanties_proposees": "Hypotheque"
        }}
        """


def build_interpretation_prompt(client_info: dict, extracted_text: str, score_data: dict, fin_data: dict, ratios_data: dict) -> str:
    # ── RAG multi-angles : requêtes ciblées selon le contexte du dossier ───
    amount_float = 0.0
    try:
        amount_float = float(str(client_info.get('amount', 0)).replace(" ", "").replace(",", "."))
    except (ValueError, TypeError):
        pass

    secteur = fin_data.get("secteur_activite", "Inconnu") if fin_data else "Inconnu"
    current_score = score_data.get("score", 0)

    bank_rules_context = ""
    try:
        bank_rules_context = rag_engine.retrieve_rules_for_analysis(
            client_type=client_info.get('clientType', 'entreprise'),
            amount=amount_float,
            secteur=secteur,
            score=current_score,
            ratios=ratios_data,
        )
    except Exception as e:
        print(f"Avertissement RAG multi-angles : {e}")

    rag_section = ""
    if bank_rules_context:
        rag_section = f"""
    ══ POLITIQUE DE CRÉDIT INTERNE — RÈGLES DE LA BANQUE (via base documentaire RAG) ══
    Les règles suivantes sont extraites de la politique de crédit officielle de Kaïs Bank.
    Elles sont organisées par thème (critères client, secteur, garanties, décision).
    Tu DOIS les appliquer et citer explicitement chaque règle violée ou respectée.
    {bank_rules_context}
    """

    common_prompt = f"""
    RÔLE : Analyste crédit expérimenté dans une banque.
    Tu dois évaluer la solidité financière et le niveau de risque d'un dossier de financement.
    
    DOSSIER : {client_info.get('fullName')} | MONTANT DEMANDÉ : {client_info.get('amount')}€ | TYPE : {client_info.get('clientType')} | PROJET : {client_info.get('projectType')}
    
    Voici les résultats EXACTS calculés par notre moteur de risque déterministe (NE LES MODIFIE PAS, utilise-les comme base) :
    - Score de risque : {score_data['score']}/100
    - Décision technique : {score_data['decision']}
    - Fiabilité de paiement : {score_data.get('payment_reliability', 'N/A')}
    - Tendance du compte : {score_data.get('account_trend', 'N/A')}
    - Facteurs de risque identifiés : {score_data.get('technical_risks', [])}
    - Facteurs positifs identifiés : {score_data.get('technical_opportunities', [])}
    {rag_section}
    CONTEXTE TEXTUEL BRUT EXTRAIT DU DOCUMENT (patrimoine, garanties, historique, commentaires) :
    {extracted_text[0:12000]}
    
    Ta mission :
    1. Analyse toutes les informations disponibles (revenus, charges, dettes, ratios, patrimoine, garanties, ancienneté, secteur, projet financé, montant demandé, apport).
    2. Vérifie la conformité du dossier avec les règles internes de la politique de crédit de la banque (citées ci-dessus).
    3. Vérifie la cohérence globale entre la capacité de remboursement réelle et le montant demandé.
    4. Signale clairement tout élément disproportionné, irréaliste ou manquant (ex: absence d'apport, dossier incomplet).
    5. Ne valide JAMAIS un projet si les ratios sont tendus ou si le dossier est non conforme aux règles internes.
    6. Propose des ajustements réalistes (montant plus faible, apport à constituer, garanties à apporter).
    7. Conclus avec : niveau de risque global (faible/modéré/élevé/très élevé), recommandation claire et 2-3 pistes d'amélioration concrètes.
    8. Sois détaillé et professionnel dans tes explications.
    
    FORMAT JSON OBLIGATOIRE EN SORTIE :
    {{
        "risks": ["Point bloquant ou fragilité 1", "Risque 2", ...],
        "opportunities": ["Point fort 1", "Ajustement ou condition proposée", ...],
        "summary": "1-2 paragraphes d'analyse argumentée et nuancée.\\n\\nSynthèse :\\nNiveau de risque : ...\\nDécision : ...\\nRecommandations : ..."
    }}
    """

    is_particulier = (client_info.get('clientType', '').lower() == 'particulier')

    if is_particulier:
        mensualites_annuelles = ratios_data.get('mensualites_annuelles', fin_data.get('mensualites_credits', 0) * 12)
        return f"""{common_prompt}
        
        ══ DONNÉES PARTICULIER ══
        Situation professionnelle     : {fin_data.get('situation_professionnelle', 'Inconnu')}
        Revenus Annuels nets          : {fin_data.get('revenus_annuels', 0):,.0f} €
        Charges Annuelles fixes       : {fin_data.get('charges_annuelles', 0):,.0f} € (loyer, pensions...)
        Mensualités crédits (mensuel) : {fin_data.get('mensualites_credits', 0):,.0f} €/mois → {mensualites_annuelles:,.0f} €/an
        Total charges annuelles       : {ratios_data.get('total_charges_annuelles', 0):,.0f} €
        Personnes à charge            : {fin_data.get('nb_personnes_charge', 0)}
        Épargne estimée               : {fin_data.get('epargne_estimee', 0):,.0f} €
        Apport personnel              : {fin_data.get('apport_personnel', 0):,.0f} €
        
        ══ RATIOS CALCULÉS ══
        Taux d'endettement            : {ratios_data.get('taux_endettement_personnel_percent', 0)} % (norme bancaire ≤ 35%)
        Reste à vivre annuel brut     : {ratios_data.get('reste_a_vivre_annuel', 0):,.0f} €
        Reste à vivre ajusté          : {ratios_data.get('reste_a_vivre_annuel_ajuste', 0):,.0f} € (après personnes à charge)
        Capacité remboursement dispo  : {ratios_data.get('capacite_remboursement_mensuelle', 0):,.0f} €/mois
        """
    else:
        return f"""{common_prompt}
        
        ══ DONNÉES ENTREPRISE ══
        Secteur d'activité            : {fin_data.get('secteur_activite', 'Inconnu')}
        Ancienneté                    : {fin_data.get('anciennete_annees', 0)} an(s)
        Garanties proposées           : {fin_data.get('garanties_proposees', 'Aucune')}
        
        Chiffre d'affaires N          : {fin_data.get('revenue', 0):,.0f} €
        Chiffre d'affaires N-1        : {fin_data.get('revenue_n_minus_1', 0):,.0f} €
        EBITDA N                      : {fin_data.get('ebitda', 0):,.0f} €
        EBITDA N-1                    : {fin_data.get('ebitda_n_minus_1', 0):,.0f} €
        Résultat Net N                : {fin_data.get('net_income', 0):,.0f} €
        Capitaux Propres              : {fin_data.get('equity', 0):,.0f} €
        Dettes Totales                : {fin_data.get('total_debt', 0):,.0f} €
        Cash Flow                     : {fin_data.get('cash_flow', 0):,.0f} €
        
        ══ RATIOS CALCULÉS ══
        Marge Nette                   : {ratios_data.get('net_margin_percent', 0)} %
        Marge EBITDA                  : {ratios_data.get('ebitda_margin_percent', 0)} %
        Croissance CA (N vs N-1)      : {ratios_data.get('croissance_ca_percent', 0)} %
        Croissance EBITDA             : {ratios_data.get('croissance_ebitda_percent', 0)} %
        Endettement / Fonds Propres   : {ratios_data.get('debt_to_equity_percent', 0)} %
        Levier EBITDA (Dettes/EBITDA) : {ratios_data.get('levier_ebitda', 0)}x  (sain si < 3x)
        DSCR (Cash Flow / Annuités)   : {ratios_data.get('dscr', 0)}  (sain si > 1.2)
        Fonds propres négatifs        : {'OUI — Risque critique' if ratios_data.get('equity_is_negative') else 'Non'}
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
    apport_personnel: typing.Optional[str] = Form(None),
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

    full_extracted_text = "".join(full_extracted_text_parts)

    prompt = build_extraction_prompt({
        "fullName": fullName, 
        "amount": amount, 
        "clientType": clientType, 
        "projectType": projectType
    }, full_extracted_text)
    
    try:
        # PHASE 1: Extraction avec Groq
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        json_text = response.choices[0].message.content
        extracted_data = json.loads(json_text)

        # Si l'apport a été saisi manuellement, il prend le dessus sur l'extraction LLM
        if apport_personnel is not None:
            try:
                extracted_data["apport_personnel"] = float(str(apport_personnel).replace(" ", "").replace(",", "."))
            except (ValueError, TypeError):
                extracted_data["apport_personnel"] = 0.0
        
        # PHASE 2: Scoring déterministe
        scoring_result = scoring_engine.analyze_financials(extracted_data, {
            "clientType": clientType,
            "amount": amount
        })
        
        fin_data = scoring_result["raw_numbers"]
        score_data = scoring_result["scoring"]
        ratios_data = scoring_result["ratios"]
            
        # PHASE 3: Interprétation IA avec Groq
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
        
        # Assemblage final pour le Frontend
        final_response = {
            "score": score_data["score"],
            "decision": score_data["decision"],
            "extracted_name": extracted_data.get("extracted_name", fullName),
            "payment_reliability": score_data.get("payment_reliability", "Moyen"),
            "account_trend": score_data.get("account_trend", "Stable"),
            "financials": {
                **fin_data, 
                **ratios_data,
                "explainability": score_data.get("explainability", []),
                "default_probability": score_data.get("default_probability", 5.0),
                "weak_signals": score_data.get("weak_signals", [])
            },
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
    apps = db.query(database.Application).filter(database.Application.user_id == current_user.id).order_by(database.Application.created_at.desc()).all()

    results = []
    for a in apps:
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
            "ia_summary": a.ia_summary,
            "summary": a.ia_summary,
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

class ChatRequest(BaseModel):
    message: str
    client_type: str
    context: str

@app.post("/chat/")
async def analyze_chat_endpoint(request: ChatRequest, current_user: database.User = Depends(get_current_user)):
    try:
        context_data = json.loads(request.context)
        
        # RAG Lookup
        rag_context = ""
        try:
            rag_docs = rag_engine.retrieve_relevant_rules(request.message, k=3)
            if rag_docs:
                rag_context = "\n".join([d.page_content for d in rag_docs])
        except Exception as e:
            print(f"Erreur RAG chat: {e}")
            
        rag_instruction = ""
        if rag_context:
            rag_instruction = f"\n\nPOLITIQUE DE CRÉDIT (RAG) :\n{rag_context}\n"

        system_prompt = (
            "Tu es l'assistant IA de la plateforme Kaïs Analytics.\n"
            "Tu dois répondre aux questions de l'utilisateur concernant l'analyse financière en cours, la politique de crédit de la banque, la comptabilité et les mathématiques.\n"
            "Utilise les données du contexte fourni (résultats de l'analyse, score, informations client) ET la politique de crédit si pertinente pour répondre de manière précise et professionnelle.\n"
            "Tu es autorisé à faire des calculs mathématiques et à répondre à des questions de comptabilité.\n"
            "CONGÉ / FIN DE SESSION : Si l'utilisateur dit qu'il a terminé, bonne journée, à bientôt, c'est bon pour aujourd'hui, merci au revoir, etc. — réponds simplement de façon naturelle et chaleureuse en 1 courte phrase.\n"
            "HORS DOMAINE : Si la question n'est VRAIMENT pas liée à la finance, l'analyse, la politique de crédit, la comptabilité ou les mathématiques, rappelle poliment ton rôle. Mais sois indulgent sur les fautes de frappe du genre 'POLIQTE'. Essaye de comprendre l'intention de l'utilisateur.\n"
            "Sois détaillé le plus possible dans tes explications."
            f"{rag_instruction}"
        )
        
        user_prompt = (
            f"CONTEXTE DE L'ANALYSE :\n{json.dumps(context_data, indent=2, ensure_ascii=False)}\n\n"
            f"QUESTION DE L'UTILISATEUR :\n{request.message}"
        )
        
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=MODEL_NAME,
            temperature=0.3
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/finance/")
async def finance_chat_endpoint(request: GlobalChatRequest, db: Session = Depends(database.get_db), current_user: database.User = Depends(get_current_user)):
    try:
        session_id = request.session_id
        session_record = None
        
        if session_id:
            session_record = db.query(database.ChatSession).filter(database.ChatSession.id == session_id, database.ChatSession.user_id == current_user.id).first()
        
        if not session_record:
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

        current_messages = session_record.messages if isinstance(session_record.messages, list) else json.loads(session_record.messages or "[]")
        user_msg = {"role": "user", "content": request.message}
        current_messages.append(user_msg)
        
        history_context = ""
        recent_messages = current_messages[-10:-1]
        for msg in recent_messages:
            history_context += f"{'Utilisateur' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}\n"
            
        system_prompt = (
            f"Tu es l'assistant IA de la plateforme Kaïs Analytics. Tu t'adresses à {request.userName}.\n"
            "DOMAINE : Tu réponds UNIQUEMENT aux questions liées à la banque, la finance, le crédit, l'analyse de risque financier, la comptabilité et les mathématiques.\n"
            "STYLE : Sois professionnel, direct et précis. Ne commence PAS tes réponses par une formule de salutation (Bonjour, Salut, etc.) — la conversation est déjà engagée. Ne termine PAS tes réponses par des formules comme \"N'hésitez pas\", \"Est-ce que je peux vous aider autrement ?\", \"Y a-t-il autre chose ?\" etc. Réponds simplement à la question, c'est tout.\n"
            "CONGÉ / FIN DE SESSION : Si l'utilisateur dit qu'il a terminé, bonne journée, à bientôt, c'est bon pour aujourd'hui, merci au revoir, etc. — réponds simplement de façon naturelle et chaleureuse en 1 courte phrase (ex: 'Bonne continuation !', 'À bientôt.', 'Avec plaisir.'). Ne dis JAMAIS 'conversation terminée' ou 'session clôturée'. Tu restes disponible sans le souligner.\n"
            "HORS DOMAINE : Si la question n'est pas liée aux domaines autorisés, réponds uniquement : \"Je suis spécialisé en finance et crédit. Comment puis-je vous aider ?\"\n"
            "CALCULS : Tu peux et dois effectuer des calculs mathématiques si demandé.\n"
            "LANGUE : Réponds dans la langue utilisée par l'utilisateur.\n"
            "HISTORIQUE de la conversation :\n"
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
        
        current_messages.append({"role": "assistant", "content": ai_response})
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
    target_admin_email = os.getenv("FROM_EMAIL", "gaetan.eyes@gmail.com")
    
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
        html_content += f"<p><em>Une pièce jointe a été fournie : {attachment_name}</em></p>"
    html_content += "</body></html>"
    
    send_email_sync(target_admin_email, f"Contact Kaïs Analytics : {subject}", html_content)

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

@app.post("/admin/index-policy/")
def admin_index_policy(current_user: database.User = Depends(get_current_user)):
    """
    Endpoint admin pour re-indexer manuellement la politique de crédit dans ChromaDB.
    Utile après une mise à jour du fichier politique_credit_banque.txt.
    """
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Accès réservé au super administrateur.")
    policy_file = os.path.join(os.path.dirname(__file__), "politique_credit_banque.txt")
    if not os.path.exists(policy_file):
        raise HTTPException(status_code=404, detail="Fichier de politique de crédit introuvable.")
    try:
        rag_engine.process_bank_rules(policy_file)
        return {"message": "Politique de crédit re-indexée avec succès dans ChromaDB."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'indexation : {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)