import urllib.request
import urllib.error
import json
from security import create_access_token
from database import SessionLocal
from model import Users

BASE_URL = "http://127.0.0.1:8000"

def request_json(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "LiveAuditClient"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    body_bytes = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=body_bytes, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.getcode()
            content = resp.read().decode('utf-8')
            res_data = json.loads(content) if content else None
            return status, res_data
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        try:
            res_data = json.loads(content)
        except:
            res_data = content
        return e.code, res_data

def run_live_audit():
    print("=== STARTING FULL LIVE HTTP AUDIT ===")
    
    # 1. Test Base & Read Endpoints
    print("\n--- 1. Testing Core Endpoints ---")
    s_root, d_root = request_json("GET", "/")
    print(f"GET / -> Status: {s_root}, Response: {d_root}")
    assert s_root == 200, f"Expected 200 for /, got {s_root}"

    s_cabs, d_cabs = request_json("GET", "/cab-queries")
    print(f"GET /cab-queries -> Status: {s_cabs}, Found {len(d_cabs) if isinstance(d_cabs, list) else 0} rides")
    assert s_cabs == 200, f"Expected 200 for /cab-queries, got {s_cabs}"

    s_lf, d_lf = request_json("GET", "/lost-found/items")
    print(f"GET /lost-found/items -> Status: {s_lf}, Found {len(d_lf) if isinstance(d_lf, list) else 0} items")
    assert s_lf == 200, f"Expected 200 for /lost-found/items, got {s_lf}"

    s_lf_sort, d_lf_sort = request_json("GET", "/lost-found/items?status=open&sort=newest")
    print(f"GET /lost-found/items?status=open&sort=newest -> Status: {s_lf_sort}, Found {len(d_lf_sort) if isinstance(d_lf_sort, list) else 0} items")
    assert s_lf_sort == 200, f"Expected 200 for /lost-found/items with query, got {s_lf_sort}"

    # 2. Get a test user from DB and create JWT
    db = SessionLocal()
    user = db.query(Users).first()
    if not user:
        user = Users(name="Test Auditor", email_id="auditor@iiitkottayam.ac.in", roll_no="2023110099")
        db.add(user)
        db.commit()
        db.refresh(user)
    user_id = user.user_id
    db.close()
    
    token = create_access_token({"sub": str(user_id)})
    print(f"\n--- 2. Authenticated CRUD Test for User {user_id} ---")

    # 3. Create Item with Image URL
    item_payload = {
        "title": "Live Test Silver MacBook",
        "type": "lost",
        "category": "Electronics",
        "location": "Library 3rd Floor",
        "item_date": "2026-03-01",
        "description": "Silver 14-inch laptop with stickers",
        "contact_info": "auditor@iiitkottayam.ac.in",
        "image_url": "https://example.com/laptop.jpg"
    }
    s_create, d_create = request_json("POST", "/lost-found/items", item_payload, token)
    print(f"POST /lost-found/items -> Status: {s_create}, Created Item ID: {d_create.get('id') if isinstance(d_create, dict) else d_create}")
    assert s_create == 200
    created_id = d_create["id"]
    assert d_create["image_url"] == "https://example.com/laptop.jpg"

    # 4. Get Created Item
    s_get, d_get = request_json("GET", f"/lost-found/items/{created_id}")
    print(f"GET /lost-found/items/{created_id} -> Status: {s_get}, Title: {d_get.get('title')}, image_url: {d_get.get('image_url')}")
    assert s_get == 200
    assert d_get["title"] == "Live Test Silver MacBook"

    # 5. Update Item
    s_patch, d_patch = request_json("PATCH", f"/lost-found/items/{created_id}", {"location": "Library 2nd Floor Lawn", "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="}, token)
    print(f"PATCH /lost-found/items/{created_id} -> Status: {s_patch}, New Location: {d_patch.get('location')}")
    assert s_patch == 200
    assert d_patch["location"] == "Library 2nd Floor Lawn"
    assert d_patch["image_url"].startswith("data:image/png")

    # 6. Post Contextual Message
    s_msg, d_msg = request_json("POST", f"/lost-found/items/{created_id}/messages", {"message": "I saw this near the security guard desk."}, token)
    print(f"POST /lost-found/items/{created_id}/messages -> Status: {s_msg}, Message: {d_msg.get('message')}")
    assert s_msg == 200

    # 7. List Messages
    s_list_msg, d_list_msg = request_json("GET", f"/lost-found/items/{created_id}/messages")
    print(f"GET /lost-found/items/{created_id}/messages -> Status: {s_list_msg}, Messages count: {len(d_list_msg)}")
    assert s_list_msg == 200
    assert len(d_list_msg) >= 1

    # 8. Update Status
    s_stat, d_stat = request_json("PATCH", f"/lost-found/items/{created_id}/status", {"status": "claimed"}, token)
    print(f"PATCH /lost-found/items/{created_id}/status -> Status: {s_stat}, New Status: {d_stat.get('status')}")
    assert s_stat == 200
    assert d_stat["status"] == "claimed"

    # 9. List User's Items (My Items)
    s_my, d_my = request_json("GET", "/lost-found/users/me/items", token=token)
    print(f"GET /lost-found/users/me/items -> Status: {s_my}, My Items count: {len(d_my)}")
    assert s_my == 200
    assert any(i["id"] == created_id for i in d_my)

    # 10. Delete Item
    s_del, d_del = request_json("DELETE", f"/lost-found/items/{created_id}", token=token)
    print(f"DELETE /lost-found/items/{created_id} -> Status: {s_del}")
    assert s_del == 204

    # 11. Verify Deleted
    s_get_del, d_get_del = request_json("GET", f"/lost-found/items/{created_id}")
    print(f"GET /lost-found/items/{created_id} after DELETE -> Status: {s_get_del} (Expected 404)")
    assert s_get_del == 404

    print("\n=== ALL REAL LIVE HTTP TESTS COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_live_audit()
