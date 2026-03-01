import uuid
from database import SessionLocal, User
from auth import get_password_hash

def seed_super_admin():
    db = SessionLocal()
    
    # Vérifie si le compte existe déjà
    existing_admin = db.query(User).filter(User.email == "gaetan.eyes@gmail.com").first()
    if existing_admin:
        print("L'administrateur existe déjà.")
        db.close()
        return

    admin_user = User(
        id=str(uuid.uuid4()),
        full_name="Koffi Gaetan",
        email="gaetan.eyes@gmail.com",
        password_hash=get_password_hash("Fluxia2026!"),
        role="SUPER_ADMIN",
        is_first_login=True,
        organization_id=None
    )

    db.add(admin_user)
    db.commit()
    print("Super Administrateur 'Koffi Gaetan' créé avec succès !")
    db.close()

if __name__ == "__main__":
    seed_super_admin()
