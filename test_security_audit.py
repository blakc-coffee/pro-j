import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
from main import app
from model import Users, CabQuery, CabRequests
from security import create_access_token

# Setup shared in-memory DB for tests
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
def setup_security_data():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = TestingSessionLocal()
    u1 = Users(user_id=1, email_id="driver@univ.edu", name="Driver Dave", roll_no="D001", is_active=True)
    u2 = Users(user_id=2, email_id="rider1@univ.edu", name="Rider Rachel", roll_no="R001", is_active=True)
    u3 = Users(user_id=3, email_id="rider2@univ.edu", name="Rider Ron", roll_no="R002", is_active=True)
    u4 = Users(user_id=4, email_id="banned@univ.edu", name="Banned Bob", roll_no="B001", is_active=False)
    db.add_all([u1, u2, u3, u4])
    db.commit()
    db.close()
    yield

client = TestClient(app)

token_u1 = create_access_token({"sub": "1"})
token_u2 = create_access_token({"sub": "2"})
token_u3 = create_access_token({"sub": "3"})
token_u4 = create_access_token({"sub": "4"})

h_u1 = {"Authorization": f"Bearer {token_u1}"}
h_u2 = {"Authorization": f"Bearer {token_u2}"}
h_u3 = {"Authorization": f"Bearer {token_u3}"}
h_u4 = {"Authorization": f"Bearer {token_u4}"}

def test_unauthenticated_access_blocked():
    """Unauthenticated requests must be rejected with 401."""
    assert client.get("/cab-queries/1/requests").status_code == 401
    assert client.post("/cab-queries/1/request").status_code == 401
    assert client.patch("/cab-requests/1", json={"status": "Accepted"}).status_code == 401
    assert client.delete("/cab-requests/1").status_code == 401
    assert client.patch("/cab-queries/1", json={"seats_avbl": 2}).status_code == 401
    assert client.delete("/cab-queries/1").status_code == 401
    assert client.get("/notifications").status_code == 401

def test_inactive_user_forbidden():
    """Users with is_active=False must be rejected with 403."""
    res = client.get("/users/me/cab-queries", headers=h_u4)
    assert res.status_code == 403
    assert "Inactive" in res.json()["detail"]

def test_input_validation_and_bounds():
    """Pydantic schemas should reject out-of-bounds inputs with 422."""
    # Location too short (<2 chars)
    res = client.post("/cab-queries", json={
        "travel_date": "2026-10-01",
        "from_loc": "A",
        "to_loc": "Campus",
        "dep_time": "12:00:00",
        "seats_avbl": 3
    }, headers=h_u1)
    assert res.status_code == 422

    # Seats too high (>10)
    res = client.post("/cab-queries", json={
        "travel_date": "2026-10-01",
        "from_loc": "Airport",
        "to_loc": "Campus",
        "dep_time": "12:00:00",
        "seats_avbl": 50
    }, headers=h_u1)
    assert res.status_code == 422

    # Query pagination limit out of bounds
    res = client.get("/cab-queries?limit=0")
    assert res.status_code == 422

    res = client.get("/cab-queries?limit=200")
    assert res.status_code == 422

def test_bola_ride_management():
    """Users cannot edit or delete another user's ride."""
    # User 1 posts a ride
    res = client.post("/cab-queries", json={
        "travel_date": "2026-10-10",
        "from_loc": "Airport",
        "to_loc": "Campus",
        "dep_time": "14:00:00",
        "seats_avbl": 2
    }, headers=h_u1)
    assert res.status_code == 200
    ride_id = res.json()["cab_id"]

    # User 2 attempts to edit User 1's ride
    res_edit = client.patch(f"/cab-queries/{ride_id}", json={"from_loc": "Hijacked"}, headers=h_u2)
    assert res_edit.status_code == 403

    # User 2 attempts to delete User 1's ride
    res_del = client.delete(f"/cab-queries/{ride_id}", headers=h_u2)
    assert res_del.status_code == 403

def test_driver_cannot_join_own_ride():
    """Driver cannot book a seat on their own ride."""
    res = client.post("/cab-queries", json={
        "travel_date": "2026-10-12",
        "from_loc": "Hostel",
        "to_loc": "Airport",
        "dep_time": "08:00:00",
        "seats_avbl": 1
    }, headers=h_u1)
    ride_id = res.json()["cab_id"]

    res_self = client.post(f"/cab-queries/{ride_id}/request", headers=h_u1)
    assert res_self.status_code == 403

def test_seat_leak_and_concurrency_lifecycle():
    """
    Verify complete seat lifecycle:
    1. Ride created with 1 seat.
    2. User 2 requests -> Driver accepts -> seats_avbl becomes 0, ride status becomes 'full'.
    3. User 3 requests -> Driver tries to accept -> 409 Conflict ('No seats Available').
    4. User 2 cancels request -> seats_avbl restored to 1, ride status reopens to 'open'.
    5. Driver accepts User 3 -> seats_avbl becomes 0.
    6. User 3 deletes their request -> seats_avbl restored to 1, ride status reopens to 'open'.
    """
    # 1. Driver posts ride with 1 seat
    res = client.post("/cab-queries", json={
        "travel_date": "2026-10-15",
        "from_loc": "City Center",
        "to_loc": "Campus",
        "dep_time": "18:00:00",
        "seats_avbl": 1
    }, headers=h_u1)
    assert res.status_code == 200
    ride_id = res.json()["cab_id"]

    # 2. User 2 requests ride
    res_req2 = client.post(f"/cab-queries/{ride_id}/request", headers=h_u2)
    assert res_req2.status_code == 200
    req2_id = res_req2.json()["req_id"]

    # User 3 requests ride
    res_req3 = client.post(f"/cab-queries/{ride_id}/request", headers=h_u3)
    assert res_req3.status_code == 200
    req3_id = res_req3.json()["req_id"]

    # Driver accepts User 2
    res_acc2 = client.patch(f"/cab-requests/{req2_id}", json={"status": "Accepted"}, headers=h_u1)
    assert res_acc2.status_code == 200

    # Verify ride is now full
    ride_data = client.get(f"/cab-queries/{ride_id}").json()
    assert ride_data["seats_avbl"] == 0
    assert ride_data["status"] == "full"

    # Driver attempts to accept User 3 when full -> 409 Conflict
    res_acc3_fail = client.patch(f"/cab-requests/{req3_id}", json={"status": "Accepted"}, headers=h_u1)
    assert res_acc3_fail.status_code == 409

    # 4. User 2 cancels request -> SEAT LEAK CHECK
    res_cancel2 = client.patch(f"/cab-requests/{req2_id}", json={"status": "Cancelled"}, headers=h_u2)
    assert res_cancel2.status_code == 200

    # Verify seat was restored!
    ride_data_restored = client.get(f"/cab-queries/{ride_id}").json()
    assert ride_data_restored["seats_avbl"] == 1
    assert ride_data_restored["status"] == "open"

    # 5. Now Driver can accept User 3
    res_acc3 = client.patch(f"/cab-requests/{req3_id}", json={"status": "Accepted"}, headers=h_u1)
    assert res_acc3.status_code == 200

    ride_data_full_again = client.get(f"/cab-queries/{ride_id}").json()
    assert ride_data_full_again["seats_avbl"] == 0
    assert ride_data_full_again["status"] == "full"

    # 6. User 3 deletes their accepted request -> SEAT LEAK CHECK ON DELETE
    res_del3 = client.delete(f"/cab-requests/{req3_id}", headers=h_u3)
    assert res_del3.status_code == 204

    # Verify seat was restored again!
    ride_data_restored_again = client.get(f"/cab-queries/{ride_id}").json()
    assert ride_data_restored_again["seats_avbl"] == 1
    assert ride_data_restored_again["status"] == "open"
