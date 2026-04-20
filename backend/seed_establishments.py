import os
from database import SessionLocal, Establishment, engine, Base
import uuid

def seed_establishments():
    # S'assure que les tables sont bien créées
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Vérifie si "Kof company" existe déjà
        existing = db.query(Establishment).filter(Establishment.name == 'Kof company').first()
        if existing:
            print("[INFO] 'Kof company' est deja enregistre dans la base de donnees.")
        else:
            print("[START] Creation de l'etablissement par defaut 'Kof company'...")
            new_est = Establishment(
                id=str(uuid.uuid4()),
                name="Kof company",
                address="Abidjan, Cote d'Ivoire",
                status="active"
            )
            db.add(new_est)
            db.commit()
            print("[OK] 'Kof company' a ete cree avec succes !")
    except Exception as e:
        print(f"[ERREUR] lors du seed : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_establishments()
