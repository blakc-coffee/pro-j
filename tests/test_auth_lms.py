import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import get_db, Base
from model import Users
from security import hash_password, verify_password

engine = create_engine(
    "sqlite:///:memory:",
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

@pytest.fixture(autouse=True)
def setup_test_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield

client = TestClient(app)

class MockResponse:
    def __init__(self, text, status_code=200):
        self.text = text
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.exceptions.HTTPError(f"Error {self.status_code}")

def test_password_hashing_and_verification():
    """Verify PBKDF2 password hashing and constant-time verification."""
    raw = "MySecurePass123!"
    p_hash = hash_password(raw)
    assert p_hash.startswith("pbkdf2:sha256:100000$")
    assert verify_password(raw, p_hash) is True
    assert verify_password("WrongPassword", p_hash) is False
    assert verify_password("", p_hash) is False
    assert verify_password(raw, None) is False

def test_health_check():
    """Verify /health endpoint returns 200 and checks DB connectivity."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["database"] == "connected"

def test_fast_login_with_cached_hash():
    """
    Verify that returning users with cached password hashes log in instantly
    without any external requests to the campus LMS server.
    """
    db = TestingSessionLocal()
    user = Users(
        roll_no="20239999",
        email_id="student@univ.edu",
        name="Fast Student",
        password_hash=hash_password("mypassword"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.close()

    with patch("main.std_requests.Session") as mock_session_cls:
        res = client.post("/auth/login", json={"email_id": "20239999", "password": "mypassword"})
        assert res.status_code == 200
        data = res.json()
        assert data["roll_no"] == "20239999"
        assert data["name"] == "Fast Student"
        assert "access_token" in data
        # Crucial: std_requests.Session must NOT have been called!
        mock_session_cls.assert_not_called()

@patch("main.std_requests.Session")
def test_successful_lms_login(mock_session_cls):
    mock_session = MagicMock()
    mock_session_cls.return_value = mock_session
    
    # Mock GET /login/index.php and /my/
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

@patch("main.std_requests.Session")
def test_batch_2024_degrade_theme_login(mock_session_cls):
    """Verify Batch 2024 Degrade theme extracts name and strips roll number prefix."""
    mock_session = MagicMock()
    mock_session_cls.return_value = mock_session

    degrade_html = '''
    <div class="user-menu-wrapper">
        <span class="user-name">2024BCS0042 ADITYA SHARMA</span>
        <img src="pic.jpg" class="userpicture" alt="2024BCS0042 ADITYA SHARMA" />
    </div>
    <a href="mailto:2024bcs0042@iiitkottayam.ac.in">Email</a>
    '''
    mock_session.get.side_effect = [
        MockResponse('<input type="hidden" name="logintoken" value="fake_token">'),
        MockResponse(degrade_html)
    ]
    mock_session.post.return_value = MockResponse('Dashboard <a href="logout.php">Logout</a>')

    response = client.post("/auth/login", json={"email_id": "2024BCS0042", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "ADITYA SHARMA"
    assert data["full_name"] == "2024BCS0042 ADITYA SHARMA"
    assert data["roll_no"] == "2024BCS0042"
    mock_session.get.assert_any_call("https://lmsug24.iiitkottayam.ac.in/login/index.php", timeout=10)

@patch("main.std_requests.Session")
def test_batch_2026_academi_theme_login(mock_session_cls):
    """Verify Batch 2026 Academi theme extracts name from logininfo anchor."""
    mock_session = MagicMock()
    mock_session_cls.return_value = mock_session

    academi_html = '''
    <div class="logininfo">
        You are logged in as <a href="https://lmsug26.iiitkottayam.ac.in/user/profile.php?id=12" title="View profile">2026BCS0011 ROHAN VERMA</a> (<a href="logout.php">Log out</a>)
    </div>
    '''
    mock_session.get.side_effect = [
        MockResponse('<input type="hidden" name="logintoken" value="fake_token">'),
        MockResponse(academi_html)
    ]
    mock_session.post.return_value = MockResponse('Dashboard <a href="logout.php">Logout</a>')

    response = client.post("/auth/login", json={"email_id": "2026BCS0011", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "ROHAN VERMA"
    assert data["full_name"] == "2026BCS0011 ROHAN VERMA"
    assert data["roll_no"] == "2026BCS0011"
    mock_session.get.assert_any_call("https://lmsug26.iiitkottayam.ac.in/login/index.php", timeout=10)

@patch("main.std_requests.Session")
def test_stale_roll_number_name_auto_repair(mock_session_cls):
    """
    Verify that an existing user whose name was previously stuck as their roll number
    is automatically re-scraped from Moodle and repaired with their human name in DB.
    """
    db = TestingSessionLocal()
    # User was previously saved with name == roll_no due to the old failed scraper
    user = Users(
        roll_no="2024bcs0099",
        email_id="2024bcs0099@iiitkottayam.ac.in",
        name="2024bcs0099",
        full_name="2024bcs0099",
        password_hash=hash_password("mypassword"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.close()

    mock_session = MagicMock()
    mock_session_cls.return_value = mock_session

    profile_html = '''
    <div class="user-menu-wrapper">
        <span class="user-name">2024BCS0099 KAVYA NAIR</span>
    </div>
    <a href="mailto:2024bcs0099@iiitkottayam.ac.in">email</a>
    '''
    mock_session.get.side_effect = [
        MockResponse('<input type="hidden" name="logintoken" value="fake_token">'),
        MockResponse(profile_html)
    ]
    mock_session.post.return_value = MockResponse('Dashboard')

    # Logging in with the cached password triggers auto-repair instead of blind fast-path
    response = client.post("/auth/login", json={"email_id": "2024bcs0099", "password": "mypassword"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "KAVYA NAIR"
    assert data["full_name"] == "2024BCS0099 KAVYA NAIR"

    # Verify database was updated
    verify_db = TestingSessionLocal()
    updated_user = verify_db.query(Users).filter(Users.roll_no == "2024bcs0099").first()
    assert updated_user.name == "KAVYA NAIR"
    assert updated_user.full_name == "2024BCS0099 KAVYA NAIR"
    verify_db.close()

