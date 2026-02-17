from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

# On stocke la base de données dans le dossier 'db' que tu as créé
DATABASE_URL = "sqlite:///./db/history.db"

Base = declarative_base()

# Création du moteur de base de données
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Définition de la table "analyses"
class CreditAnalysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)                     # Nom du fichier analysé
    analysis_date = Column(DateTime, default=datetime.now) # Date
    banker_query = Column(String)                 # Question du banquier
    ai_response = Column(Text)                    # Réponse de l'IA

# Cette ligne crée physiquement le fichier history.db si il n'existe pas
Base.metadata.create_all(bind=engine)