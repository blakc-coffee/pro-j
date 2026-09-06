import sys
sys.path.insert(0, 'c:/Users/dharu/anything/pro-j')
import requests
from security import create_access_token
from database import SessionLocal
from model import Users, CabQuery, CabRequests

BASE_URL = "http://127.0.0.1:8000"

db = SessionLocal()
u1 = db.query(Users).filter(Users.user_id == 1).first()
u2 = db.query(Users).filter(Users.user_id == 2).first()
if not u2:
    u2 = db.query(Users).filter(Users.user_id != 1).first()

token_u1 = create_access_token({"sub": str(u1.user_id)})
token_u2 = create_access_token({"sub": str(u2.user_id)})
headers_u1 = {"Authorization": f"Bearer {token_u1}", "Content-Type": "application/json"}
headers_u2 = {"Authorization": f"Bearer {token_u2}", "Content-Type": "application/json"}

print(f"=== TESTING CAB FIXES (User 1: {u1.name} (id={u1.user_id}), User 2: {u2.name} (id={u2.user_id})) ===")

# -------------------------------------------------------------
# Test A: Issue 3 - POST /cab-queries
# -------------------------------------------------------------
print("\n--- Test A: Issue 3 - POST ride with frontend payload (date, time, seats_avbl, price, notes) ---")
payload_frontend = {
    "from_loc": "Campus Gate 1",
    "to_loc": "Kottayam Railway Station",
    "date": "2026-04-10",
    "time": "15:45:00",
    "seats_avbl": 3,
    "price": 120.0,
    "notes": "Luggage in trunk"
}
r = requests.post(f"{BASE_URL}/cab-queries", json=payload_frontend, headers=headers_u1)
assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
ride_a = r.json()
print("[OK] Successfully posted ride with frontend payload. Cab ID:", ride_a["cab_id"])
print("  Response:", ride_a)
assert ride_a["travel_date"] == "2026-04-10"
assert ride_a["dep_time"] == "15:45:00"
assert ride_a["user_name"] == u1.name
assert ride_a["creator_name"] == u1.name

print("\n--- Test A2: Issue 3 - POST ride with standard schema (travel_date, dep_time) ---")
payload_standard = {
    "from_loc": "Library Block",
    "to_loc": "Cochin Airport",
    "travel_date": "2026-04-12",
    "dep_time": "08:00:00",
    "seats_avbl": 4
}
r = requests.post(f"{BASE_URL}/cab-queries", json=payload_standard, headers=headers_u1)
assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
ride_a2 = r.json()
print("[OK] Successfully posted ride with standard schema. Cab ID:", ride_a2["cab_id"])

print("\n--- Test A3: Issue 3 - POST ride with location > 50 chars (validation returns 422, no 500, no silent truncation) ---")
payload_long = {
    "from_loc": "Very Long Location That Exceeds Fifty Characters In Length Easily",
    "to_loc": "Another Very Long Destination Address Exceeding Fifty Characters",
    "travel_date": "2026-04-15",
    "dep_time": "12:00:00",
    "seats_avbl": 2
}
r = requests.post(f"{BASE_URL}/cab-queries", json=payload_long, headers=headers_u1)
assert r.status_code == 422, f"Expected 422, got {r.status_code}: {r.text}"
print("[OK] Long location correctly rejected with 422:", r.json())
assert "cannot exceed 50 characters" in r.text

# -------------------------------------------------------------
# Test B: Issue 2 - Owner Name in Ride Listings & Details
# -------------------------------------------------------------
print("\n--- Test B: Issue 2 - Ride Listings show user_name & creator_name ---")
r = requests.get(f"{BASE_URL}/cab-queries")
assert r.status_code == 200
rides_list = r.json()
assert len(rides_list) > 0
print(f"[OK] Fetched {len(rides_list)} rides from GET /cab-queries")
# Verify our newly created ride has user_name & creator_name populated
target = next((item for item in rides_list if item["cab_id"] == ride_a["cab_id"]), None)
assert target is not None, "Created ride not found in listing"
print(f"  Ride {target['cab_id']}: user_name='{target.get('user_name')}', creator_name='{target.get('creator_name')}'")
assert target.get("user_name") == u1.name
assert target.get("creator_name") == u1.name

print("\n--- Test B2: Issue 2 - Single Ride Details shows user_name & creator_name ---")
r = requests.get(f"{BASE_URL}/cab-queries/{ride_a['cab_id']}")
assert r.status_code == 200
ride_details = r.json()
print(f"[OK] Single ride details: user_name='{ride_details.get('user_name')}', creator_name='{ride_details.get('creator_name')}'")
assert ride_details.get("user_name") == u1.name

print("\n--- Test B3: Issue 2 - View Contact endpoint (/users/{user_id}) works ---")
r = requests.get(f"{BASE_URL}/users/{u1.user_id}", headers=headers_u2)
assert r.status_code == 200
contact = r.json()
print(f"[OK] User profile retrieved: name='{contact.get('name')}', roll_no='{contact.get('roll_no')}', email='{contact.get('email_id')}'")
assert contact.get("name") == u1.name

# -------------------------------------------------------------
# Test C: Issue 1 - Cancelling/Deleting Rides
# -------------------------------------------------------------
print("\n--- Test C1: Issue 1 - Cancel ride with NO requests ---")
r_c1 = requests.post(f"{BASE_URL}/cab-queries", json=payload_standard, headers=headers_u1)
assert r_c1.status_code == 200
ride_c1 = r_c1.json()
r = requests.delete(f"{BASE_URL}/cab-queries/{ride_c1['cab_id']}", headers=headers_u1)
assert r.status_code == 204, f"Expected 204, got {r.status_code}: {r.text}"
r_check = requests.get(f"{BASE_URL}/cab-queries/{ride_c1['cab_id']}")
assert r_check.status_code == 404
print("[OK] Ride with no requests cancelled successfully (204). Verified 404.")

print("\n--- Test C2: Issue 1 - Cancel ride with PENDING request ---")
# User 2 requests User 1's ride_a2
r_req = requests.post(f"{BASE_URL}/cab-queries/{ride_a2['cab_id']}/request", headers=headers_u2)
assert r_req.status_code == 200
req_data = r_req.json()
print(f"  User 2 requested ride {ride_a2['cab_id']}: Request ID {req_data['req_id']}, status {req_data['status']}")
# Now User 1 cancels ride_a2 (must delete cab_requests first and not 500)
r_del = requests.delete(f"{BASE_URL}/cab-queries/{ride_a2['cab_id']}", headers=headers_u1)
assert r_del.status_code == 204, f"Expected 204, got {r_del.status_code}: {r_del.text}"
r_check = requests.get(f"{BASE_URL}/cab-queries/{ride_a2['cab_id']}")
assert r_check.status_code == 404
print("[OK] Ride with pending request cancelled successfully (204). Verified 404.")

print("\n--- Test C3: Issue 1 - Cancel ride with ACCEPTED request ---")
# User 2 requests User 1's ride_a
r_req = requests.post(f"{BASE_URL}/cab-queries/{ride_a['cab_id']}/request", headers=headers_u2)
assert r_req.status_code == 200
req_data = r_req.json()
req_id = req_data['req_id']
# User 1 accepts the request
r_accept = requests.patch(f"{BASE_URL}/cab-requests/{req_id}", json={"status": "Accepted"}, headers=headers_u1)
assert r_accept.status_code == 200
assert r_accept.json()["status"] == "Accepted"
print(f"  User 1 accepted request {req_id}")
# Now User 1 cancels ride_a with accepted request
r_del = requests.delete(f"{BASE_URL}/cab-queries/{ride_a['cab_id']}", headers=headers_u1)
assert r_del.status_code == 204, f"Expected 204, got {r_del.status_code}: {r_del.text}"
r_check = requests.get(f"{BASE_URL}/cab-queries/{ride_a['cab_id']}")
assert r_check.status_code == 404
print("[OK] Ride with accepted request cancelled successfully (204). Verified 404.")

print("\n--- Test C4: Issue 1 - Unauthorized deletion returns 403 ---")
# Create a new ride owned by User 1
r_new = requests.post(f"{BASE_URL}/cab-queries", json=payload_standard, headers=headers_u1)
ride_new = r_new.json()
# User 2 attempts to delete User 1's ride
r_unauth = requests.delete(f"{BASE_URL}/cab-queries/{ride_new['cab_id']}", headers=headers_u2)
assert r_unauth.status_code == 403, f"Expected 403, got {r_unauth.status_code}"
print("[OK] Unauthorized delete correctly returned 403 Forbidden.")
# Clean up
requests.delete(f"{BASE_URL}/cab-queries/{ride_new['cab_id']}", headers=headers_u1)

print("\n=== ALL TESTS FOR ALL 3 ISSUES PASSED COMPLETELY! ===")
