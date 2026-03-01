import sqlite3, os
DB_PATH = os.path.join(os.path.dirname(os.path.abspath('.')), 'database', 'credit_app.db')
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("UPDATE users SET role = 'SUPER_ADMIN'")
conn.commit()
conn.close()
print("Tous les utilisateurs sont désormais SUPER_ADMIN")
