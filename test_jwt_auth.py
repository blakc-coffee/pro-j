import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from model import Users
from security import create_access_token
from sqlalchemy.pool import StaticPool

# Setup test DB
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def setup_db():
    db = TestingSessionLocal()
    u1 = Users(user_id=1, name="Alice", email_id="alice@test", roll_no="1001")
    u2 = Users(user_id=2, name="Bob", email_id="bob@test", roll_no="1002")
    db.add_all([u1, u2])
    db.commit()
    return db

# Initialize mock db
db_session = setup_db()

token_u1 = create_access_token({"sub": "1"})
token_u2 = create_access_token({"sub": "2"})
headers_u1 = {"Authorization": f"Bearer {token_u1}"}
headers_u2 = {"Authorization": f"Bearer {token_u2}"}

def test_missing_jwt():
    res = client.get("/users/me/cab-queries")
    assert res.status_code == 401

def test_invalid_jwt():
    res = client.get("/users/me/cab-queries", headers={"Authorization": "Bearer invalid"})
    assert res.status_code == 401
    
def test_expired_jwt():
    import security
    original_expire = security.ACCESS_TOKEN_EXPIRE_MINUTES
    security.ACCESS_TOKEN_EXPIRE_MINUTES = -1
    expired_token = security.create_access_token({"sub": "1"})
    res = client.get("/users/me/cab-queries", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    security.ACCESS_TOKEN_EXPIRE_MINUTES = original_expire

def test_create_ride_ownership():
    payload = {
        "travel_date": "2026-08-30",
        "from_loc": "Campus",
        "to_loc": "City",
        "dep_time": "10:00:00",
        "seats_avbl": 3
    }
    res = client.post("/cab-queries", json=payload, headers=headers_u1)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == 1
    cab_id = data["cab_id"]
    
    res2 = client.post("/cab-queries", json=payload, headers=headers_u2)
    assert res2.status_code == 200
    cab_id2 = res2.json()["cab_id"]
    assert res2.json()["user_id"] == 2
    
    # Verify different users get different specific results
    res_me1 = client.get("/users/me/cab-queries", headers=headers_u1)
    assert len(res_me1.json()) == 1
    assert res_me1.json()[0]["cab_id"] == cab_id
    
    res_me2 = client.get("/users/me/cab-queries", headers=headers_u2)
    assert len(res_me2.json()) == 1
    assert res_me2.json()[0]["cab_id"] == cab_id2

def test_cross_user_ride_modification():
    res = client.patch("/cab-queries/1", json={"seats_avbl": 2}, headers=headers_u2)
    assert res.status_code == 403
    
    res = client.patch("/cab-queries/1", json={"seats_avbl": 2}, headers=headers_u1)
    assert res.status_code == 200

def test_create_request_and_ownership():
    res = client.post("/cab-queries/1/request", headers=headers_u2)
    assert res.status_code == 200
    req_id = res.json()["req_id"]
    assert res.json()["req_user_id"] == 2
    
    res_self = client.post("/cab-queries/1/request", headers=headers_u1)
    assert res_self.status_code == 403
    
    res_del_driver = client.delete(f"/cab-requests/{req_id}", headers=headers_u1)
    assert res_del_driver.status_code == 403
    
    res_patch_req = client.patch(f"/cab-requests/{req_id}", json={"status": "Accepted"}, headers=headers_u2)
    assert res_patch_req.status_code == 403
    
    res_patch_driver = client.patch(f"/cab-requests/{req_id}", json={"status": "Accepted"}, headers=headers_u1)
    assert res_patch_driver.status_code == 200

def test_view_requests_ownership():
    res = client.get("/cab-queries/1/requests", headers=headers_u2)
    assert res.status_code == 403
    
    res = client.get("/cab-queries/1/requests", headers=headers_u1)
    assert res.status_code == 200
    assert len(res.json()) == 1
