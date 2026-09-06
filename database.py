import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Keep local development compatibility with fallback if not configured
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./test.db"

# Normalise mysql:// scheme for SQLAlchemy if pymysql is used or mysqlconnector
if DATABASE_URL.startswith("mysql://"):
    try:
        import pymysql  # noqa: F401
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
    except ImportError:
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+mysqlconnector://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connection resilience options
engine_kwargs = {
    "pool_pre_ping": True,
}

if "sqlite" in DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # MySQL / Postgres connection recycling (recycles before server wait_timeout)
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()