import pytest
from datetime import datetime, date, time
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from model import Users, CabQuery, CabRequests, Notification
from security import create_access_token

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

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_data():
    app.dependency_overrides[get_db] = override_get_db
    db = TestingSessionLocal()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    u1 = Users(user_id=1, name="Alice Driver", email_id="alice@test.com", roll_no="2021001")
    u2 = Users(user_id=2, name="Bob Rider", email_id="bob@test.com", roll_no="2021002")
    db.add_all([u1, u2])
    db.commit()
    db.close()
    yield

def test_empty_notifications():
    token = create_access_token({"sub": "1"})
    res = client.get("/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["unread_count"] == 0
    assert data["notifications"] == []

def test_cab_request_triggers_notification():
    db = TestingSessionLocal()
    ride = CabQuery(
        cab_id=10,
        user_id=1,
        travel_date=date(2026, 3, 15),
        dep_time=time(14, 30),
        from_loc="Campus Gate",
        to_loc="Kottayam Station",
        status="open",
        seats_avbl=3
    )
    db.add(ride)
    db.commit()
    db.close()

    # User 2 requests seat in User 1's ride
    token_bob = create_access_token({"sub": "2"})
    res = client.post("/cab-queries/10/request", headers={"Authorization": f"Bearer {token_bob}"})
    assert res.status_code == 200

    # User 1 should now have 1 unread notification
    token_alice = create_access_token({"sub": "1"})
    res_notif = client.get("/notifications", headers={"Authorization": f"Bearer {token_alice}"})
    assert res_notif.status_code == 200
    data = res_notif.json()
    assert data["unread_count"] == 1
    assert len(data["notifications"]) == 1
    notif = data["notifications"][0]
    assert notif["type"] == "cab_request"
    assert notif["reference_id"] == "10"
    assert "Bob Rider" in notif["message"]
    assert notif["is_read"] is False

def test_mark_single_notification_read():
    db = TestingSessionLocal()
    notif = Notification(
        id=1,
        user_id=1,
        title="Test Notice",
        message="Hello Alice",
        type="test",
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.close()

    token_alice = create_access_token({"sub": "1"})
    res = client.patch("/notifications/1/read", headers={"Authorization": f"Bearer {token_alice}"})
    assert res.status_code == 200
    assert res.json()["is_read"] is True

    # Verify unread count is now 0
    res_check = client.get("/notifications", headers={"Authorization": f"Bearer {token_alice}"})
    assert res_check.json()["unread_count"] == 0

def test_mark_all_read():
    db = TestingSessionLocal()
    n1 = Notification(id=1, user_id=1, title="N1", message="M1", type="test", is_read=False)
    n2 = Notification(id=2, user_id=1, title="N2", message="M2", type="test", is_read=False)
    db.add_all([n1, n2])
    db.commit()
    db.close()

    token_alice = create_access_token({"sub": "1"})
    res = client.post("/notifications/read-all", headers={"Authorization": f"Bearer {token_alice}"})
    assert res.status_code == 200

    res_check = client.get("/notifications", headers={"Authorization": f"Bearer {token_alice}"})
    assert res_check.json()["unread_count"] == 0

def test_user_isolation():
    db = TestingSessionLocal()
    n_alice = Notification(id=1, user_id=1, title="Alice's", message="Priv", type="test", is_read=False)
    db.add(n_alice)
    db.commit()
    db.close()

    # Bob tries to read Alice's notification
    token_bob = create_access_token({"sub": "2"})
    res_bob = client.get("/notifications", headers={"Authorization": f"Bearer {token_bob}"})
    assert res_bob.json()["unread_count"] == 0
    assert len(res_bob.json()["notifications"]) == 0

    # Bob tries to patch Alice's notification
    res_patch = client.patch("/notifications/1/read", headers={"Authorization": f"Bearer {token_bob}"})
    assert res_patch.status_code == 404
