import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "credit_app.db")

def upgrade():
    db_path = os.path.abspath(DB_PATH)
    print(f"Applying migration to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN sexe VARCHAR DEFAULT 'M';")
        conn.commit()
        print("Migration réussie: colonne 'sexe' ajoutée.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Colonne 'sexe' existe déjà.")
        else:
            print("Erreur:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    upgrade()
