import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from model import Users
from security import create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    u1 = Users(
        user_id=1,
        roll_no="2023110001",
        email_id="user1@example.com",
        name="Nishad Hubert Sathis Kumar",
        full_name="Nishad Hubert Sathis Kumar",
        phone_no="9876543210",
        is_active=True,
    )
    u2 = Users(
        user_id=2,
        roll_no="2023110005",
        email_id="user2@example.com",
        name="Dharun Karthikeyan S",
        full_name="2023110005 DHARUN KARTHIKEYAN S",
        phone_no="9123456780",
        is_active=True,
    )
    db.add(u1)
    db.add(u2)
    db.commit()
    db.close()
    yield
    app.dependency_overrides.clear()

def auth_headers(user_id: int):
    token = create_access_token({"sub": str(user_id), "v": 1})
    return {"Authorization": f"Bearer {token}"}

def test_choose_display_name_subsets():
    headers = auth_headers(1)

    res = client.patch("/users/me", json={"name": "Nishad Sathis"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Nishad Sathis"

    res = client.patch("/users/me", json={"name": "Sathis Kumar"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Sathis Kumar"

    res = client.patch("/users/me", json={"name": "Nishad"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Nishad"

def test_cannot_use_foreign_name():
    headers = auth_headers(1)
    res = client.patch("/users/me", json={"name": "Alexander Great"}, headers=headers)
    assert res.status_code == 400
    assert "not part of your registered legal name" in res.json()["detail"]

def test_initial_cannot_be_primary_or_sole_name():
    headers = auth_headers(2)

    res = client.patch("/users/me", json={"name": "S"}, headers=headers)
    assert res.status_code == 400
    assert "An initial cannot be your sole display name" in res.json()["detail"]

    res = client.patch("/users/me", json={"name": "Dharun S"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Dharun S"

    res = client.patch("/users/me", json={"name": "Karthikeyan"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Karthikeyan"

def test_empty_name_rejected():
    headers = auth_headers(1)
    res = client.patch("/users/me", json={"name": "   "}, headers=headers)
    assert res.status_code == 400
