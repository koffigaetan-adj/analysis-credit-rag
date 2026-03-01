import os
import uuid
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, JSON, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

# --- GESTION DES CHEMINS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "..", "database")
os.makedirs(DB_DIR, exist_ok=True)

DB_PATH = os.path.join(DB_DIR, "credit_app.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# --- CONFIGURATION SQLALCHEMY ---
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
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
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="ANALYST") # SUPER_ADMIN, ADMIN, ANALYST
    is_active = Column(Boolean, default=True)
    is_first_login = Column(Boolean, default=True)
    organization_id = Column(Integer, nullable=True)
    avatar_url = Column(String, nullable=True)
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