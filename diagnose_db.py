import json
from backend.database import SessionLocal, User, Application

def diagnose():
    db = SessionLocal()
    print("--- DIAGNOSTIQUE DES UTILISATEURS ---")
    users = db.query(User).all()
    for u in users:
        app_count = db.query(Application).filter(Application.user_id == u.id).count()
        print(f"User: {u.first_name} {u.last_name} | Email: {u.email} | ID: {u.id} | Apps: {app_count}")

    print("\n--- DIAGNOSTIQUE DES ANALYSES ---")
    apps = db.query(Application).all()
    for a in apps:
        print(f"App ID: {a.id} | Name: {a.full_name} | UserID: {a.user_id} | Created: {a.created_at}")
    
    db.close()

if __name__ == "__main__":
    diagnose()
