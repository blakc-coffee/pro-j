import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import get_db, Base
from model import Users

def override_get_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

class MockResponse:
    def __init__(self, text, status_code=200):
        self.text = text
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.exceptions.HTTPError(f"Error {self.status_code}")

@patch("main.std_requests.Session")
def test_successful_lms_login(mock_session_cls):
    mock_session = MagicMock()
    mock_session_cls.return_value = mock_session
    
    # Mock GET /login/index.php
    mock_session.get.side_effect = [
        MockResponse('<input type="hidden" name="logintoken" value="fake_token">'),
        MockResponse('<span class="usertext">John Doe</span> <a href="mailto:johndoe@example.com">Email</a> <a href="/user/profile.php?id=123">Profile</a>')
    ]
    
    # Mock POST /login/index.php
    mock_session.post.return_value = MockResponse('Dashboard <a href="logout.php">Logout</a> sesskey=abc')
    
    response = client.post("/auth/login", json={"email_id": "20231234", "password": "password123"})
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["name"] == "John Doe"
    assert data["email_id"] == "johndoe@example.com"
    assert data["roll_no"] == "20231234"
    assert "user_id" in data
    
    # Verify origin
    mock_session.get.assert_any_call("https://lmsug23.iiitkottayam.ac.in/login/index.php", timeout=10)

@patch("main.std_requests.Session")
def test_invalid_credentials(mock_session_cls):
    mock_session = MagicMock()
    mock_session_cls.return_value = mock_session
    
    mock_session.get.return_value = MockResponse('<input type="hidden" name="logintoken" value="fake_token">')
    
    # Mock POST /login/index.php returning the login page with error
    mock_session.post.return_value = MockResponse('<div class="loginerrormessage">Invalid login</div> <input type="hidden" name="logintoken" value="fake_token">')
    
    response = client.post("/auth/login", json={"email_id": "20241234", "password": "wrongpassword"})
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"

@patch("main.std_requests.Session")
def test_missing_logintoken(mock_session_cls):
    mock_session = MagicMock()
    mock_session_cls.return_value = mock_session
    
    # No logintoken in HTML
    mock_session.get.return_value = MockResponse('<html>No token here</html>')
    
    response = client.post("/auth/login", json={"email_id": "20221234", "password": "password"})
    
    assert response.status_code == 500
    assert response.json()["detail"] == "Could not find logintoken"
    
def test_missing_credentials():
    response = client.post("/auth/login", json={"email_id": "", "password": ""})
    assert response.status_code == 400
