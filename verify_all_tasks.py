import sys
sys.path.insert(0, 'c:/Users/dharu/anything/pro-j')
import requests
from security import create_access_token
from database import SessionLocal
from model import CabQuery, CabRequests, LostFoundItem

BASE_URL = 'http://127.0.0.1:8000'
token_u1 = create_access_token({'sub': '1'})
token_u2 = create_access_token({'sub': '2'})
headers_u1 = {'Authorization': f'Bearer {token_u1}', 'Content-Type': 'application/json'}
headers_u2 = {'Authorization': f'Bearer {token_u2}', 'Content-Type': 'application/json'}

print('=== 1. VERIFYING CAB SAMPLE DATA CLEANUP ===')
db = SessionLocal()
rides = db.query(CabQuery).all()
print(f'Total cab rides in DB: {len(rides)}')
real_ids = {8, 9, 10, 11, 12, 61}
curr_ids = {r.cab_id for r in rides}
print('Current Cab IDs in DB:', sorted(list(curr_ids)))
assert curr_ids == real_ids, f'Mismatch: expected {real_ids}, got {curr_ids}'
print('[OK] Only real rides remain! Zero sample rides.')

# Check orphaned requests
reqs = db.query(CabRequests).all()
print(f'Total cab requests in DB: {len(reqs)}')
for q in reqs:
    assert q.cab_id in real_ids, f'Orphaned request: {q.req_id} -> cab_id {q.cab_id}'
print('[OK] Zero orphaned cab requests in DB!')

print('\n=== 2. VERIFYING NEWEST-FIRST RIDE ORDERING ===')
# Current top ride:
r_list = requests.get(f'{BASE_URL}/cab-queries').json()
print('Current first ride cab_id:', r_list[0]['cab_id'])
assert r_list[0]['cab_id'] == 61

# Post Ride A
payload_a = {
    'from_loc': 'Campus Test A',
    'to_loc': 'Railway Station',
    'travel_date': '2026-04-20',
    'dep_time': '10:00:00',
    'seats_avbl': 2
}
resp_a = requests.post(f'{BASE_URL}/cab-queries', json=payload_a, headers=headers_u1).json()
cab_a_id = resp_a['cab_id']
print(f'Posted Ride A: cab_id={cab_a_id}')

# Verify Ride A appears at top
list_after_a = requests.get(f'{BASE_URL}/cab-queries').json()
assert list_after_a[0]['cab_id'] == cab_a_id, f"Ride A not at top: {list_after_a[0]['cab_id']}"
print('[OK] Ride A appears at the top of the feed!')

# Post Ride B
payload_b = {
    'from_loc': 'Campus Test B',
    'to_loc': 'Airport',
    'travel_date': '2026-04-21',
    'dep_time': '11:00:00',
    'seats_avbl': 3
}
resp_b = requests.post(f'{BASE_URL}/cab-queries', json=payload_b, headers=headers_u1).json()
cab_b_id = resp_b['cab_id']
print(f'Posted Ride B: cab_id={cab_b_id}')

# Verify Ride B is above Ride A
list_after_b = requests.get(f'{BASE_URL}/cab-queries').json()
assert list_after_b[0]['cab_id'] == cab_b_id, f"Ride B not at top: {list_after_b[0]['cab_id']}"
assert list_after_b[1]['cab_id'] == cab_a_id, f"Ride A not second: {list_after_b[1]['cab_id']}"
print('[OK] Ride B moves above Ride A! Newest-first ordering confirmed.')

# Cancel ride test with pending request on Ride B
req_res = requests.post(f'{BASE_URL}/cab-queries/{cab_b_id}/request', headers=headers_u2)
assert req_res.status_code == 200, f'Failed to request ride: {req_res.text}'
del_b = requests.delete(f'{BASE_URL}/cab-queries/{cab_b_id}', headers=headers_u1)
assert del_b.status_code == 204
del_a = requests.delete(f'{BASE_URL}/cab-queries/{cab_a_id}', headers=headers_u1)
assert del_a.status_code == 204
print('[OK] Cancel ride with request works cleanly. Cleaned up Rides A and B.')

print('\n=== 3. VERIFYING LOST & FOUND FIXES ===')
# Test normal item
lf_payload_normal = {
    'title': 'Blue Umbrella',
    'type': 'lost',
    'category': 'Other',
    'location': 'Cafeteria Table 4',
    'item_date': '2026-03-05',
    'description': 'Left umbrella during lunch',
    'contact_info': '9123456780'
}
lf_resp1 = requests.post(f'{BASE_URL}/lost-found/items', json=lf_payload_normal, headers=headers_u1)
assert lf_resp1.status_code == 200, f'Normal item post failed: {lf_resp1.status_code} {lf_resp1.text}'
item_1_id = lf_resp1.json()['id']
print(f"[OK] Posted normal item (ID={item_1_id}): {lf_resp1.json()['title']}")

# Test item with large base64 image (500KB)
lf_payload_image = {
    'title': 'Silver Watch',
    'type': 'found',
    'category': 'Electronics',
    'location': 'Badminton Court',
    'item_date': '2026-03-06',
    'description': 'Digital watch found on bench',
    'contact_info': 'contact desk',
    'image_url': 'data:image/jpeg;base64,' + ('C' * 500000)
}
lf_resp2 = requests.post(f'{BASE_URL}/lost-found/items', json=lf_payload_image, headers=headers_u1)
assert lf_resp2.status_code == 200, f'Item with image failed: {lf_resp2.status_code} {lf_resp2.text}'
item_2_id = lf_resp2.json()['id']
print(f"[OK] Posted item with 500KB base64 image (ID={item_2_id}): {lf_resp2.json()['title']}")

# Confirm item appears in listing
items_list = requests.get(f'{BASE_URL}/lost-found/items').json()
item_ids = [it['id'] for it in items_list]
assert item_1_id in item_ids, 'Normal item missing from listing'
assert item_2_id in item_ids, 'Image item missing from listing'
print(f'[OK] Both items confirmed in Lost & Found feed (Total in feed: {len(items_list)})')

# Confirm database row exists with image
check_db = SessionLocal()
db_item = check_db.query(LostFoundItem).filter(LostFoundItem.id == item_2_id).first()
assert db_item is not None
assert len(db_item.image_url) > 500000
check_db.close()
print('[OK] Database row exists with full image data intact!')

# Clean up test items
del1 = requests.delete(f'{BASE_URL}/lost-found/items/{item_1_id}', headers=headers_u1)
assert del1.status_code == 204
del2 = requests.delete(f'{BASE_URL}/lost-found/items/{item_2_id}', headers=headers_u1)
assert del2.status_code == 204
print('[OK] Cleaned up Lost & Found test items successfully.')

# Test transaction rollback on simulated error
print('\n=== 4. VERIFYING TRANSACTION ROLLBACK ON FAILURE ===')
fail_payload = {
    'title': 'Broken Item',
    'type': 'invalid_type',
    'category': 'Keys',
    'location': 'Nowhere',
    'item_date': '2026-03-06'
}
fail_resp = requests.post(f'{BASE_URL}/lost-found/items', json=fail_payload, headers=headers_u1)
assert fail_resp.status_code == 400
# Ensure subsequent query succeeds without broken transaction
check_resp = requests.get(f'{BASE_URL}/lost-found/items')
assert check_resp.status_code == 200
print('[OK] Failed request properly handled; subsequent requests execute without broken transaction.')

print('\n=== ALL TASKS AND CHECKS VERIFIED COMPLETELY! ===')
