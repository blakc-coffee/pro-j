import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from main import app
from database import Base, get_db
from model import Users, LostFoundItem
from security import create_access_token

# Setup isolated in-memory test database
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_environment():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    
    # Create test users: u5 (User 5 - Dharun), u4 (User 4 - Rohit)
    u5 = Users(user_id=5, roll_no="2023110005", email_id="user5@iiitkottayam.ac.in", name="Dharun S")
    u4 = Users(user_id=4, roll_no="2023110004", email_id="user4@iiitkottayam.ac.in", name="Rohit Verma")
    db.add_all([u5, u4])
    db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=test_engine)

def get_auth_headers(user_id: int):
    token = create_access_token({"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}

# =====================================================================
# CREATION & AUTHENTICATION TESTS
# =====================================================================

def test_create_lost_and_found_items():
    headers_u5 = get_auth_headers(5)

    # 1. Unauthenticated creation returns 401
    unauth_res = client.post("/lost-found/items", json={
        "title": "Lost Wallet",
        "type": "lost",
        "category": "Other",
        "location": "Mess 1",
        "item_date": "2026-03-01"
    })
    assert unauth_res.status_code == 401

    # 2. Authenticated user creates 'lost' item
    lost_payload = {
        "title": "Lost Sony Headphones",
        "type": "lost",
        "category": "Electronics",
        "location": "Central Library 2nd Floor",
        "item_date": "2026-03-01",
        "description": "Black over-ear headphones in a grey case",
        "contact_info": "9876543210"
    }
    lost_res = client.post("/lost-found/items", json=lost_payload, headers=headers_u5)
    assert lost_res.status_code == 200, lost_res.text
    lost_data = lost_res.json()
    assert lost_data["title"] == "Lost Sony Headphones"
    assert lost_data["type"] == "lost"
    assert lost_data["category"] == "Electronics"
    assert lost_data["location"] == "Central Library 2nd Floor"
    assert lost_data["item_date"] == "2026-03-01"
    assert lost_data["status"] == "open"  # Initial status must always be open
    assert lost_data["user_id"] == 5      # Derived from authenticated token
    assert lost_data["user_name"] == "Dharun S"
    assert lost_data["user_roll_no"] == "2023110005"

    # 3. Authenticated user creates 'found' item
    found_payload = {
        "title": "Found Student ID Card",
        "type": "found",
        "category": "Cards & IDs",
        "location": "Academic Block Gate",
        "item_date": "2026-03-02",
        "description": "ID card belonging to CSE batch",
        "contact_info": "Security Desk"
    }
    found_res = client.post("/lost-found/items", json=found_payload, headers=headers_u5)
    assert found_res.status_code == 200, found_res.text
    found_data = found_res.json()
    assert found_data["title"] == "Found Student ID Card"
    assert found_data["type"] == "found"
    assert found_data["category"] == "Cards & IDs"
    assert found_data["status"] == "open"
    assert found_data["user_id"] == 5

# =====================================================================
# VALIDATION TESTS
# =====================================================================

def test_validation_rules():
    headers_u5 = get_auth_headers(5)

    # 1. Invalid type rejected (400)
    res_bad_type = client.post("/lost-found/items", json={
        "title": "Item",
        "type": "stolen", # invalid
        "category": "Electronics",
        "location": "Lab 1",
        "item_date": "2026-03-01"
    }, headers=headers_u5)
    assert res_bad_type.status_code == 400
    assert "Invalid type" in res_bad_type.json()["detail"]

    # 2. Invalid category rejected (400)
    res_bad_cat = client.post("/lost-found/items", json={
        "title": "Item",
        "type": "lost",
        "category": "Vehicles", # invalid category
        "location": "Parking",
        "item_date": "2026-03-01"
    }, headers=headers_u5)
    assert res_bad_cat.status_code == 400
    assert "Invalid category" in res_bad_cat.json()["detail"]

    # 3. Empty title rejected (400)
    res_bad_title = client.post("/lost-found/items", json={
        "title": "   ",
        "type": "lost",
        "category": "Keys",
        "location": "Hostel A",
        "item_date": "2026-03-01"
    }, headers=headers_u5)
    assert res_bad_title.status_code == 400

    # 4. Empty location rejected (400)
    res_bad_loc = client.post("/lost-found/items", json={
        "title": "Keys",
        "type": "lost",
        "category": "Keys",
        "location": "   ",
        "item_date": "2026-03-01"
    }, headers=headers_u5)
    assert res_bad_loc.status_code == 400

# =====================================================================
# READING & FILTERING TESTS
# =====================================================================

def test_reading_and_filtering():
    headers_u5 = get_auth_headers(5) # User 5
    headers_u4 = get_auth_headers(4) # User 4

    # Populate test items
    item1 = client.post("/lost-found/items", json={
        "title": "Blue Umbrella",
        "type": "lost",
        "category": "Clothing",
        "location": "Dining Hall",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()

    item2 = client.post("/lost-found/items", json={
        "title": "Calculus Textbook",
        "type": "found",
        "category": "Books",
        "location": "Reading Room",
        "item_date": "2026-03-02"
    }, headers=headers_u4).json()

    item3 = client.post("/lost-found/items", json={
        "title": "Room 204 Keys",
        "type": "lost",
        "category": "Keys",
        "location": "Hostel Block B",
        "item_date": "2026-03-03"
    }, headers=headers_u5).json()

    # 1. List all items
    list_all = client.get("/lost-found/items")
    assert list_all.status_code == 200
    assert len(list_all.json()) == 3

    # 2. Get single item
    get_item = client.get(f"/lost-found/items/{item1['id']}")
    assert get_item.status_code == 200
    assert get_item.json()["title"] == "Blue Umbrella"
    assert get_item.json()["user_name"] == "Dharun S"

    # 3. Nonexistent item returns 404
    get_none = client.get("/lost-found/items/99999")
    assert get_none.status_code == 404

    # 4. Type filter: lost
    res_lost = client.get("/lost-found/items?type=lost")
    assert res_lost.status_code == 200
    assert len(res_lost.json()) == 2
    assert all(i["type"] == "lost" for i in res_lost.json())

    # 5. Type filter: found
    res_found = client.get("/lost-found/items?type=found")
    assert res_found.status_code == 200
    assert len(res_found.json()) == 1
    assert res_found.json()[0]["title"] == "Calculus Textbook"

    # 6. Category filter: Books
    res_cat = client.get("/lost-found/items?category=Books")
    assert res_cat.status_code == 200
    assert len(res_cat.json()) == 1
    assert res_cat.json()[0]["category"] == "Books"

    # 7. Search filter
    res_search = client.get("/lost-found/items?search=Umbrella")
    assert res_search.status_code == 200
    assert len(res_search.json()) == 1
    assert res_search.json()[0]["title"] == "Blue Umbrella"

    # 8. My Items endpoint
    my_items_u5 = client.get("/lost-found/users/me/items", headers=headers_u5)
    assert my_items_u5.status_code == 200
    assert len(my_items_u5.json()) == 2
    assert all(i["user_id"] == 5 for i in my_items_u5.json())

    my_items_u4 = client.get("/lost-found/users/me/items", headers=headers_u4)
    assert my_items_u4.status_code == 200
    assert len(my_items_u4.json()) == 1
    assert my_items_u4.json()[0]["user_id"] == 4

# =====================================================================
# OWNERSHIP & MODIFICATION TESTS
# =====================================================================

def test_ownership_and_modification():
    headers_u5 = get_auth_headers(5) # Owner
    headers_u4 = get_auth_headers(4) # Non-owner

    item = client.post("/lost-found/items", json={
        "title": "AirPods Pro Case",
        "type": "lost",
        "category": "Electronics",
        "location": "Football Ground",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()
    item_id = item["id"]

    # 1. Non-owner cannot update item (403)
    res_patch_forbidden = client.patch(f"/lost-found/items/{item_id}", json={
        "title": "Hacked Title"
    }, headers=headers_u4)
    assert res_patch_forbidden.status_code == 403

    # 2. Owner can update item (200)
    res_patch_owner = client.patch(f"/lost-found/items/{item_id}", json={
        "title": "White AirPods Pro Case (Found near bench)",
        "location": "Football Ground East Bench"
    }, headers=headers_u5)
    assert res_patch_owner.status_code == 200
    assert res_patch_owner.json()["title"] == "White AirPods Pro Case (Found near bench)"
    assert res_patch_owner.json()["location"] == "Football Ground East Bench"

    # 3. Update with invalid category rejected (400)
    res_patch_bad = client.patch(f"/lost-found/items/{item_id}", json={
        "category": "InvalidCategory"
    }, headers=headers_u5)
    assert res_patch_bad.status_code == 400

    # 4. Non-owner cannot update status (403)
    res_status_forbidden = client.patch(f"/lost-found/items/{item_id}/status", json={
        "status": "claimed"
    }, headers=headers_u4)
    assert res_status_forbidden.status_code == 403

    # 5. Invalid status update rejected (400)
    res_status_invalid = client.patch(f"/lost-found/items/{item_id}/status", json={
        "status": "destroyed"
    }, headers=headers_u5)
    assert res_status_invalid.status_code == 400

    # 6. Owner updates status to claimed (200)
    res_status_owner = client.patch(f"/lost-found/items/{item_id}/status", json={
        "status": "claimed"
    }, headers=headers_u5)
    assert res_status_owner.status_code == 200
    assert res_status_owner.json()["status"] == "claimed"

    # Status filter check
    res_status_filter = client.get("/lost-found/items?status=claimed")
    assert res_status_filter.status_code == 200
    assert any(i["id"] == item_id for i in res_status_filter.json())

    # 7. Non-owner cannot delete item (403)
    res_del_forbidden = client.delete(f"/lost-found/items/{item_id}", headers=headers_u4)
    assert res_del_forbidden.status_code == 403

    # 8. Owner can delete item (204)
    res_del_owner = client.delete(f"/lost-found/items/{item_id}", headers=headers_u5)
    assert res_del_owner.status_code == 204

    # 9. Verify deletion (404)
    res_get_deleted = client.get(f"/lost-found/items/{item_id}")
    assert res_get_deleted.status_code == 404


# =====================================================================
# SORTING BY CREATED_AT TESTS
# =====================================================================

def test_sorting_by_created_at():
    headers_u5 = get_auth_headers(5)

    # Create 3 items with distinct item_dates that differ from creation order
    # item1: created first, item_date = 2026-03-10
    item1 = client.post("/lost-found/items", json={
        "title": "First Item",
        "type": "lost",
        "category": "Electronics",
        "location": "LH1",
        "item_date": "2026-03-10"
    }, headers=headers_u5).json()

    # item2: created second, item_date = 2026-03-01
    item2 = client.post("/lost-found/items", json={
        "title": "Second Item",
        "type": "found",
        "category": "Keys",
        "location": "LH2",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()

    # item3: created third, item_date = 2026-03-05
    item3 = client.post("/lost-found/items", json={
        "title": "Third Item",
        "type": "lost",
        "category": "Books",
        "location": "LH3",
        "item_date": "2026-03-05"
    }, headers=headers_u5).json()

    # Default sort is newest first (created_at desc) -> item3, item2, item1
    res_default = client.get("/lost-found/items")
    assert res_default.status_code == 200
    ids_default = [i["id"] for i in res_default.json()]
    assert ids_default == [item3["id"], item2["id"], item1["id"]]

    # Explicit sort=newest -> item3, item2, item1
    res_newest = client.get("/lost-found/items?sort=newest")
    assert res_newest.status_code == 200
    ids_newest = [i["id"] for i in res_newest.json()]
    assert ids_newest == [item3["id"], item2["id"], item1["id"]]

    # Explicit sort=oldest -> item1, item2, item3
    res_oldest = client.get("/lost-found/items?sort=oldest")
    assert res_oldest.status_code == 200
    ids_oldest = [i["id"] for i in res_oldest.json()]
    assert ids_oldest == [item1["id"], item2["id"], item3["id"]]

    # Invalid sort returns 400
    res_bad_sort = client.get("/lost-found/items?sort=random")
    assert res_bad_sort.status_code == 400
    assert "Invalid sort" in res_bad_sort.json()["detail"]


# =====================================================================
# OPEN FEED & NON-DESTRUCTIVE CLAIM/RESOLVE TESTS
# =====================================================================

def test_open_feed_and_non_destructive_claim_resolve():
    headers_u5 = get_auth_headers(5)

    # Create 3 items
    item1 = client.post("/lost-found/items", json={
        "title": "Lost Hydro Flask",
        "type": "lost",
        "category": "Other",
        "location": "Cafeteria",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()

    item2 = client.post("/lost-found/items", json={
        "title": "Found Casio Calculator",
        "type": "found",
        "category": "Electronics",
        "location": "Math Lab",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()

    item3 = client.post("/lost-found/items", json={
        "title": "Lost Notebook",
        "type": "lost",
        "category": "Books",
        "location": "Library",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()

    # Owner marks item1 as 'claimed' and item2 as 'resolved'
    patch1 = client.patch(f"/lost-found/items/{item1['id']}/status", json={"status": "claimed"}, headers=headers_u5)
    assert patch1.status_code == 200
    assert patch1.json()["status"] == "claimed"

    patch2 = client.patch(f"/lost-found/items/{item2['id']}/status", json={"status": "resolved"}, headers=headers_u5)
    assert patch2.status_code == 200
    assert patch2.json()["status"] == "resolved"

    # 1. Main marketplace feed querying status=open must ONLY return item3
    res_open = client.get("/lost-found/items?status=open&sort=newest")
    assert res_open.status_code == 200
    open_items = res_open.json()
    assert len(open_items) == 1
    assert open_items[0]["id"] == item3["id"]
    assert open_items[0]["title"] == "Lost Notebook"

    # 2. Claimed/resolved items are NOT deleted from the database
    get_item1 = client.get(f"/lost-found/items/{item1['id']}")
    assert get_item1.status_code == 200
    assert get_item1.json()["status"] == "claimed"

    get_item2 = client.get(f"/lost-found/items/{item2['id']}")
    assert get_item2.status_code == 200
    assert get_item2.json()["status"] == "resolved"

    # 3. Personal history endpoint (My Items) returns all 3 items
    my_items = client.get("/lost-found/users/me/items", headers=headers_u5)
    assert my_items.status_code == 200
    my_items_data = my_items.json()
    assert len(my_items_data) == 3
    statuses = {i["id"]: i["status"] for i in my_items_data}
    assert statuses[item1["id"]] == "claimed"
    assert statuses[item2["id"]] == "resolved"
    assert statuses[item3["id"]] == "open"


# =====================================================================
# IMAGE URL SUPPORT TESTS
# =====================================================================

def test_image_url_support():
    headers_u5 = get_auth_headers(5)

    # 1. Create item with image_url
    item_with_img = client.post("/lost-found/items", json={
        "title": "Lost Wallet with ID",
        "type": "lost",
        "category": "Cards & IDs",
        "location": "Admin Block",
        "item_date": "2026-03-01",
        "image_url": "https://images.example.com/wallet.jpg"
    }, headers=headers_u5).json()
    assert item_with_img["image_url"] == "https://images.example.com/wallet.jpg"

    # 2. Text-only item (no image_url)
    item_no_img = client.post("/lost-found/items", json={
        "title": "Lost Bike Key",
        "type": "lost",
        "category": "Keys",
        "location": "Cycle Stand",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()
    assert item_no_img["image_url"] is None

    # 3. Update item to add image_url
    patch_res = client.patch(f"/lost-found/items/{item_no_img['id']}", json={
        "image_url": "https://images.example.com/key.jpg"
    }, headers=headers_u5)
    assert patch_res.status_code == 200
    assert patch_res.json()["image_url"] == "https://images.example.com/key.jpg"


# =====================================================================
# CONTEXTUAL MESSAGES TESTS
# =====================================================================

def test_lostfound_messages():
    headers_u5 = get_auth_headers(5)
    headers_u4 = get_auth_headers(4)

    item = client.post("/lost-found/items", json={
        "title": "Found Blue Backpack",
        "type": "found",
        "category": "Other",
        "location": "Library 1st Floor",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()
    item_id = item["id"]

    # 1. Unauthenticated message creation returns 401
    unauth_msg = client.post(f"/lost-found/items/{item_id}/messages", json={
        "message": "Is this still there?"
    })
    assert unauth_msg.status_code == 401

    # 2. Authenticated user 4 creates message
    msg1_res = client.post(f"/lost-found/items/{item_id}/messages", json={
        "message": "Found this near the library and handed it to the guard."
    }, headers=headers_u4)
    assert msg1_res.status_code == 200
    msg1_data = msg1_res.json()
    assert msg1_data["message"] == "Found this near the library and handed it to the guard."
    assert msg1_data["user_id"] == 4
    assert msg1_data["user_name"] == "Rohit Verma"
    assert msg1_data["user_roll_no"] == "2023110004"
    assert msg1_data["item_id"] == item_id

    # 3. Authenticated user 5 (owner) replies
    msg2_res = client.post(f"/lost-found/items/{item_id}/messages", json={
        "message": "Thank you! I will collect it from the security desk."
    }, headers=headers_u5)
    assert msg2_res.status_code == 200
    msg2_data = msg2_res.json()
    assert msg2_data["message"] == "Thank you! I will collect it from the security desk."
    assert msg2_data["user_id"] == 5
    assert msg2_data["user_name"] == "Dharun S"

    # 4. List messages for item
    list_msgs = client.get(f"/lost-found/items/{item_id}/messages")
    assert list_msgs.status_code == 200
    msgs = list_msgs.json()
    assert len(msgs) == 2
    assert msgs[0]["message"] == "Found this near the library and handed it to the guard."
    assert msgs[1]["message"] == "Thank you! I will collect it from the security desk."

    # 5. Item details includes messages
    item_details = client.get(f"/lost-found/items/{item_id}")
    assert item_details.status_code == 200
    assert len(item_details.json()["messages"]) == 2

    # 6. Empty message rejected (400)
    empty_msg = client.post(f"/lost-found/items/{item_id}/messages", json={
        "message": "   "
    }, headers=headers_u4)
    assert empty_msg.status_code == 400

    # 7. Message on nonexistent item returns 404
    nonexistent_msg = client.post("/lost-found/items/99999/messages", json={
        "message": "Hello?"
    }, headers=headers_u4)
    assert nonexistent_msg.status_code == 404


# =====================================================================
# 30-DAY MARKETPLACE RULE TESTS
# =====================================================================

def test_30_day_marketplace_rule():
    from datetime import datetime, timedelta
    headers_u5 = get_auth_headers(5)

    # 1. Create a fresh item (created_at = now)
    fresh_item = client.post("/lost-found/items", json={
        "title": "Fresh Item (<30 days)",
        "type": "lost",
        "category": "Electronics",
        "location": "Hostel A",
        "item_date": "2026-03-01"
    }, headers=headers_u5).json()

    # 2. Directly insert an old item (>30 days old: 35 days ago) in test DB
    db = TestingSessionLocal()
    old_item = LostFoundItem(
        user_id=5,
        title="Old Item (35 days old)",
        type="lost",
        category="Keys",
        location="Hostel B",
        item_date=date(2026, 1, 20),
        status="open",
        created_at=datetime.utcnow() - timedelta(days=35)
    )
    db.add(old_item)
    db.commit()
    db.refresh(old_item)
    old_id = old_item.id
    db.close()

    # 3. Main feed GET /lost-found/items must ONLY return fresh_item
    feed_res = client.get("/lost-found/items")
    assert feed_res.status_code == 200
    feed_items = feed_res.json()
    feed_ids = [i["id"] for i in feed_items]
    assert fresh_item["id"] in feed_ids
    assert old_id not in feed_ids

    # 4. Old item is NOT deleted: direct lookup returns it
    direct_res = client.get(f"/lost-found/items/{old_id}")
    assert direct_res.status_code == 200
    assert direct_res.json()["title"] == "Old Item (35 days old)"

    # 5. Old item is NOT deleted: user history GET /lost-found/users/me/items includes it
    my_items_res = client.get("/lost-found/users/me/items", headers=headers_u5)
    assert my_items_res.status_code == 200
    my_ids = [i["id"] for i in my_items_res.json()]
    assert old_id in my_ids
    assert fresh_item["id"] in my_ids

