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

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True) # Null for SUPER_ADMIN general notifications
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String) # ACCOUNT_REQUEST, WELCOME, INFO
    is_read = Column(Boolean, default=False)
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

# Création des tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()