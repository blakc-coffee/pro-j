from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv
load_dotenv()
api_key=os.getenv("DATABASE_URL")
engine = create_engine(api_key)
SessionLocal = sessionmaker(bind=engine)

Base=declarative_base()


def get_db():
    db=SessionLocal()
    yield db
    db.close()