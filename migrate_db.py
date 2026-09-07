"""
Database migration script for Plattayam MySQL database.
Safely and idempotently updates tables to match current models:
1. Adds `image_url TEXT NULL` to `lost_found_items` if not already present.
2. Ensures all tables from `model.py` (e.g. `lost_found_messages`) are created if missing.
3. Preserves all existing data, rows, and columns.
"""
from sqlalchemy import inspect, text
from database import engine
from model import Base

def run_migration():
    print("=== STARTING DATABASE SCHEMA MIGRATION ===")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"Connected database: {engine.url.database}")
    print(f"Existing tables: {existing_tables}")

    # 1. Create any missing tables (such as lost_found_messages)
    print("\nEnsuring all model tables exist...")
    Base.metadata.create_all(engine)
    inspector = inspect(engine)
    updated_tables = inspector.get_table_names()
    print(f"Tables after create_all: {updated_tables}")

    # 2. Check lost_found_items columns and add image_url if missing
    if "lost_found_items" in updated_tables:
        columns = [c["name"] for c in inspector.get_columns("lost_found_items")]
        print(f"\nCurrent lost_found_items columns: {columns}")

        if "image_url" not in columns:
            print("Adding column 'image_url' (LONGTEXT NULL) to 'lost_found_items'...")
            with engine.begin() as conn:
                col_type = "LONGTEXT NULL" if engine.dialect.name == "mysql" else "TEXT"
                conn.execute(text(f"ALTER TABLE lost_found_items ADD COLUMN image_url {col_type};"))
            print("[OK] Column 'image_url' added successfully.")
        else:
            print("[OK] Column 'image_url' already exists.")

        # Ensure image_url is LONGTEXT in MySQL to support high-resolution base64 data URLs
        if engine.dialect.name == "mysql":
            for col in inspector.get_columns("lost_found_items"):
                if col["name"] == "image_url":
                    type_str = str(col["type"]).upper()
                    print(f"Current image_url column type: {type_str}")
                    if "LONGTEXT" not in type_str:
                        print("Modifying 'image_url' to LONGTEXT NULL for large image data URL support...")
                        with engine.begin() as conn:
                            conn.execute(text("ALTER TABLE lost_found_items MODIFY COLUMN image_url LONGTEXT NULL;"))
                        print("[OK] Column 'image_url' modified to LONGTEXT NULL.")

    # 3. Check hackfind_profiles hackathon column and ensure it is nullable
    if "hackfind_profiles" in updated_tables and engine.dialect.name == "mysql":
        for col in inspector.get_columns("hackfind_profiles"):
            if col["name"] == "hackathon":
                if not col["nullable"]:
                    print("Modifying 'hackathon' to VARCHAR(100) NULL in 'hackfind_profiles'...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE hackfind_profiles MODIFY COLUMN hackathon VARCHAR(100) NULL;"))
                    print("[OK] Column 'hackathon' modified to nullable.")
                else:
                    print("[OK] Column 'hackathon' is already nullable.")

    # 4. Check hackfind_team_requests type column
    if "hackfind_team_requests" in updated_tables:
        req_cols = [c["name"] for c in inspector.get_columns("hackfind_team_requests")]
        if "type" not in req_cols:
            print("Adding column 'type' (VARCHAR(20) DEFAULT 'request') to 'hackfind_team_requests'...")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE hackfind_team_requests ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'request';"))
            print("[OK] Column 'type' added to 'hackfind_team_requests'.")
        else:
            print("[OK] Column 'type' already exists in 'hackfind_team_requests'.")

    # 5. Final verification of tables
    final_inspector = inspect(engine)
    final_cols = final_inspector.get_columns("lost_found_items")
    print(f"\nFinal lost_found_items columns and types:")
    for c in final_cols:
        print(f"  - {c['name']}: {c['type']} (nullable={c['nullable']})")

    # Check lost_found_messages columns
    if "lost_found_messages" in final_inspector.get_table_names():
        msg_cols = final_inspector.get_columns("lost_found_messages")
        print(f"\nFinal lost_found_messages columns and types:")
        for c in msg_cols:
            print(f"  - {c['name']}: {c['type']} (nullable={c['nullable']})")

    print("\n=== DATABASE MIGRATION COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_migration()
