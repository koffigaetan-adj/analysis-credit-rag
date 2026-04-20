import os
from database import SessionLocal, UserBackoffice, engine, Base
from auth import pwd_context
import uuid

def seed_backoffice_user():
    # S'assure que la table user_backoffice existe
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        email = "admin@kais-analytics.com"
        existing = db.query(UserBackoffice).filter(UserBackoffice.email == email).first()
        if existing:
            print(f"[INFO] L'utilisateur backoffice '{email}' existe déjà.")
        else:
            print(f"[START] Création de l'utilisateur backoffice '{email}'...")
            new_admin = UserBackoffice(
                id=str(uuid.uuid4()),
                email=email,
                name="Système Admin",
                password_hash=pwd_context.hash("KaisAdmin2026!"),
                role="SYSTEM_ADMIN",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print("[OK] Utilisateur backoffice créé avec succès !")
            print("====================================")
            print(f"Email : {email}")
            print("Password : KaisAdmin2026!")
            print("====================================")
    except Exception as e:
        print(f"[ERREUR] lors du seed : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_backoffice_user()
