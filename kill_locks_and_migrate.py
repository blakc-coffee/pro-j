from sqlalchemy import text, inspect
from database import engine
from model import Base

def fix():
    print("=== KILLING HANGING MYSQL THREADS & APPLYING MIGRATION ===")
    with engine.connect() as conn:
        current_id = conn.execute(text("SELECT CONNECTION_ID()")).scalar()
        print(f"Current migration connection ID: {current_id}")

        processes = conn.execute(text("SHOW PROCESSLIST")).fetchall()
        for p in processes:
            pid = p[0]
            user = p[1]
            db = p[3]
            command = p[4]
            info = p[7]
            if pid != current_id and user == 'root' and db == 'plattayam':
                print(f"Killing process {pid} ({command}, info: {info})...")
                try:
                    conn.execute(text(f"KILL {pid}"))
                except Exception as e:
                    print(f"Error killing {pid}: {e}")

        conn.commit()

    print("\nHanging locks cleared. Now applying schema changes...")
    with engine.connect() as conn:
        # Check image_url
        res = conn.execute(text("SHOW COLUMNS FROM lost_found_items LIKE 'image_url'")).fetchall()
        if not res:
            print("Executing: ALTER TABLE lost_found_items ADD COLUMN image_url TEXT NULL")
            conn.execute(text("ALTER TABLE lost_found_items ADD COLUMN image_url TEXT NULL"))
            conn.commit()
            print("✔ Added image_url column.")
        else:
            print("✔ image_url already exists.")

        # Check lost_found_messages table
        res_msg = conn.execute(text("SHOW TABLES LIKE 'lost_found_messages'")).fetchall()
        if not res_msg:
            print("Creating lost_found_messages table...")
            Base.metadata.tables["lost_found_messages"].create(bind=conn)
            conn.commit()
            print("✔ Created lost_found_messages table.")
        else:
            print("✔ lost_found_messages table already exists.")

    print("\n--- FINAL INSPECTION ---")
    insp = inspect(engine)
    print("Database:", engine.url.database)
    print("Tables:", insp.get_table_names())
    cols = [(c['name'], str(c['type']), c['nullable']) for c in insp.get_columns('lost_found_items')]
    print("lost_found_items columns:", cols)

if __name__ == "__main__":
    fix()
