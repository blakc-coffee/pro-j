import sys
from sqlalchemy import text, inspect
from database import engine
from model import Base

def apply():
    print("Connecting to database:", engine.url.database)
    with engine.connect() as conn:
        # 1. Add image_url to lost_found_items if not present
        res = conn.execute(text("SHOW COLUMNS FROM lost_found_items LIKE 'image_url'")).fetchall()
        if not res:
            print("Executing ALTER TABLE lost_found_items ADD COLUMN image_url TEXT NULL...")
            conn.execute(text("ALTER TABLE lost_found_items ADD COLUMN image_url TEXT NULL"))
            conn.commit()
            print("✔ image_url column added successfully!")
        else:
            print("✔ image_url column already exists.")

        # 2. Check lost_found_messages table
        res_msg = conn.execute(text("SHOW TABLES LIKE 'lost_found_messages'")).fetchall()
        if not res_msg:
            print("Creating lost_found_messages table...")
            Base.metadata.tables["lost_found_messages"].create(bind=conn)
            conn.commit()
            print("✔ lost_found_messages table created successfully!")
        else:
            print("✔ lost_found_messages table already exists.")

    # 3. Print final verification inspection
    insp = inspect(engine)
    print("\n--- DATABASE VERIFICATION ---")
    print("Database:", engine.url.database)
    print("Tables:", insp.get_table_names())
    cols = [(c['name'], str(c['type']), c['nullable']) for c in insp.get_columns('lost_found_items')]
    print("lost_found_items columns:", cols)

if __name__ == "__main__":
    apply()
