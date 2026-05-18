import os
import uuid
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, JSON, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

# --- GESTION DES CHEMINS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Modification ici : On reste dans le dossier BASE_DIR pour éviter l'erreur de permission
DB_DIR = os.path.join(BASE_DIR, "database")
os.makedirs(DB_DIR, exist_ok=True)

DB_PATH = os.path.join(DB_DIR, "credit_app.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = DATABASE_URL

# --- CONFIGURATION SQLALCHEMY ---
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODÈLE DE DONNÉES MIS À JOUR ---
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True) # ID de l'utilisateur qui a créé l'analyse
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Client
    full_name = Column(String, index=True)
    client_type = Column(String)
    project_type = Column(String)
    sector = Column(String, nullable=True)
    amount = Column(Float)
    
    # Contact
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    siren = Column(String, nullable=True)
    
    # IA & ANALYSE (AJOUTS ICI)
    score = Column(Integer)
    decision = Column(String, nullable=True) # ✅ Stocke "Favorable", "Vigilance", etc.
    ia_summary = Column(Text)
    financial_data = Column(JSON, nullable=True) # ✅ Stocke Revenus, Charges, Endettement en JSON
    risks = Column(JSON)
    opportunities = Column(JSON)
    
    # Chat
    chat_history = Column(JSON, default=[])

class Establishment(Base):
    __tablename__ = "establishments"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    address = Column(String, nullable=True)
    status = Column(String, default="active") # active, inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    primary_color = Column(String, nullable=True, default="#E73919")  # Couleur thème par établissement


class UserBackoffice(Base):
    __tablename__ = "user_backoffice"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="SYSTEM_ADMIN") # SYSTEM_ADMIN, SUPPORT
    is_active = Column(Boolean, default=True)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    establishment = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="ANALYST") # SUPER_ADMIN, ADMIN, ANALYST
    sexe = Column(String, default="M") # M ou F
    poste = Column(String, default="Data Analyst")
    is_active = Column(Boolean, default=True)
    is_first_login = Column(Boolean, default=True)
    organization_id = Column(Integer, nullable=True)
    avatar_url = Column(String, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String, nullable=True)
    # --- Préférences de notifications ---
    notif_email_login     = Column(Boolean, default=True)   # Alerte email à chaque connexion
    notif_email_analysis  = Column(Boolean, default=True)   # Email lors de la sauvegarde d'une analyse
    notif_email_password  = Column(Boolean, default=True)   # Email lors d'un changement de MDP
    notif_email_report    = Column(Boolean, default=True)   # Email lors de l'envoi d'un rapport PDF
    notif_inapp           = Column(Boolean, default=True)   # Notifications in-app (cloche)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AccountRequest(Base):
    __tablename__ = "account_requests"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    sexe = Column(String, default="M")
    email = Column(String, unique=True, index=True, nullable=False)
    poste = Column(String, default="Data Analyst")
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CommunicationHistory(Base):
    __tablename__ = "communication_history"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    target = Column(String) # "ALL" or specific email
    delivery_method = Column(String) # "IN_APP", "EMAIL", "BOTH"
    sender_name = Column(String, nullable=True)
    # Stats
    total_sent = Column(Integer, default=0)
    email_delivered = Column(Integer, default=0)
    email_failed = Column(Integer, default=0)
    email_opened = Column(JSON, default=list) # Liste d'emails ayant ouvert
    in_app_opened = Column(JSON, default=list) # Liste des user_ids ayant cliqué
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True) # Null for SUPER_ADMIN general notifications
    target_email = Column(String, nullable=True) # To track specific target email if any
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String) # ACCOUNT_REQUEST, WELCOME, INFO
    sender_name = Column(String, nullable=True) # Admin who sent it
    is_read = Column(Boolean, default=False)
    communication_id = Column(Integer, nullable=True) # Link to CommunicationHistory
    created_at = Column(DateTime, default=datetime.utcnow)

class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False) # Lié à l'utilisateur
    title = Column(String, default="Nouvelle discussion")
    messages = Column(JSON, default=list) # Liste de dicts: [{"role": "user", "content": "..."}]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, nullable=False, index=True)       # DEBUG, INFO, WARNING, ERROR, CRITICAL
    logger_name = Column(String, nullable=True)              # Nom du logger (ex: "uvicorn", "root", "main")
    message = Column(Text, nullable=False)                   # Message du log
    source = Column(String, nullable=True)                   # Fichier:ligne source
    traceback = Column(Text, nullable=True)                  # Traceback complet si exception
    method = Column(String, nullable=True)                   # Méthode HTTP si applicable (GET, POST...)
    path = Column(String, nullable=True)                     # Endpoint/path si applicable
    status_code = Column(Integer, nullable=True)             # Code HTTP si applicable
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

# Création des tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()