import os
from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def migrate():
    print(f"Connecting to database...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as connection:
        print("Adding column 'rejection_reason' to 'account_requests' table...")
        try:
            # SQL standard for adding a column
            connection.execute(text("ALTER TABLE account_requests ADD COLUMN rejection_reason TEXT;"))
            connection.commit()
            print("Successfully added 'rejection_reason' column.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column 'rejection_reason' already exists.")
            else:
                print(f"Error during migration: {e}")
                raise e

if __name__ == "__main__":
    migrate()
