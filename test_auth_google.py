import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
from database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from model import Users
import os
import jwt
from security import JWT_SECRET, ALGORITHM

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Add an existing user for testing
    user = Users(
        email_id="existing@example.com",
        name="Existing User",
        google_sub="existing_sub_123",
        roll_no="2020BCS001",
        gender="M",
        phone_no="1234567890"
    )
    user2 = Users(
        email_id="existing_email_only@example.com",
        name="Existing Email User",
        roll_no="2020BCS002",
        gender="F",
        phone_no="0987654321"
    )
    db.add(user)
    db.add(user2)
    db.commit()
    db.close()
    
    # Mock GOOGLE_CLIENT_ID
    os.environ["GOOGLE_CLIENT_ID"] = "test_client_id"
    os.environ["JWT_SECRET"] = JWT_SECRET or "test_secret"
    yield
    if "GOOGLE_CLIENT_ID" in os.environ:
        del os.environ["GOOGLE_CLIENT_ID"]

@patch("main.id_token.verify_oauth2_token")
def test_valid_google_token_new_user(mock_verify):
    mock_verify.return_value = {
        "sub": "new_sub_456",
        "email": "newuser@example.com",
        "email_verified": True,
        "name": "New User"
    }
    
    response = client.post("/auth/google", json={"id_token": "valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["email_id"] == "newuser@example.com"
    assert data["name"] == "New User"
    assert data["onboarding_required"] is True

    # Verify roll_no parsing
    db = TestingSessionLocal()
    user = db.query(Users).filter(Users.email_id == "newuser@example.com").first()
    assert user.roll_no == "newuser"
    db.close()

@patch("main.id_token.verify_oauth2_token")
def test_valid_google_token_existing_sub(mock_verify):
    mock_verify.return_value = {
        "sub": "existing_sub_123",
        "email": "existing@example.com",
        "email_verified": True,
        "name": "Existing User"
    }
    
    response = client.post("/auth/google", json={"id_token": "valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["email_id"] == "existing@example.com"
    assert data["onboarding_required"] is False

@patch("main.id_token.verify_oauth2_token")
def test_valid_google_token_existing_email_only(mock_verify):
    mock_verify.return_value = {
        "sub": "new_sub_for_existing_email",
        "email": "existing_email_only@example.com",
        "email_verified": True,
        "name": "Existing Email User"
    }
    
    response = client.post("/auth/google", json={"id_token": "valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["email_id"] == "existing_email_only@example.com"
    assert data["onboarding_required"] is False
    
    # Verify the sub was updated in DB
    db = TestingSessionLocal()
    user = db.query(Users).filter(Users.email_id == "existing_email_only@example.com").first()
    assert user.google_sub == "new_sub_for_existing_email"
    db.close()

@patch("main.id_token.verify_oauth2_token")
def test_invalid_google_token(mock_verify):
    mock_verify.side_effect = ValueError("Invalid token")
    
    response = client.post("/auth/google", json={"id_token": "invalid_token"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Google token"

@patch("main.id_token.verify_oauth2_token")
def test_unverified_google_email(mock_verify):
    mock_verify.return_value = {
        "sub": "some_sub",
        "email": "unverified@example.com",
        "email_verified": False,
        "name": "Unverified User"
    }
    
    response = client.post("/auth/google", json={"id_token": "valid_token_but_unverified"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Email not verified by Google"

