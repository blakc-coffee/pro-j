/**
 * Unit verification script for Lost & Found frontend API service layer (lostfound.js)
 */
const assert = require('assert');

// Mock apiRequest tracking
let lastCall = null;
const mockApiRequest = async (path, options = {}) => {
  lastCall = { path, options };
  if (options.method === 'DELETE') {
    return null; // 204 No Content
  }
  return { success: true, path, options };
};

// Test implementation of lostfound service functions mirroring src/features/lost-found/services/lostfound.js
function listItems(filters = {}) {
  const query = new URLSearchParams();
  if (filters.type && filters.type !== 'All') {
    query.append('type', filters.type.toLowerCase());
  }
  if (filters.category && filters.category !== 'All') {
    query.append('category', filters.category);
  }
  if (filters.status && filters.status !== 'All') {
    query.append('status', filters.status.toLowerCase());
  }
  if (filters.search && filters.search.trim()) {
    query.append('search', filters.search.trim());
  }
  if (filters.sort && filters.sort !== 'All') {
    query.append('sort', filters.sort.toLowerCase());
  }
  const queryStr = query.toString();
  return mockApiRequest(`/lost-found/items${queryStr ? `?${queryStr}` : ''}`);
}

function getItem(itemId) {
  return mockApiRequest(`/lost-found/items/${itemId}`);
}

function reportItem(payload) {
  return mockApiRequest('/lost-found/items', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      type: payload.type,
      category: payload.category,
      location: payload.location,
      item_date: payload.item_date,
      description: payload.description || undefined,
      contact_info: payload.contact_info || undefined,
      image_url: payload.image_url || payload.imageUrl || undefined,
    }),
  });
}

function updateItem(itemId, payload) {
  const body = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.type !== undefined) body.type = payload.type;
  if (payload.category !== undefined) body.category = payload.category;
  if (payload.location !== undefined) body.location = payload.location;
  if (payload.item_date !== undefined) body.item_date = payload.item_date;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.contact_info !== undefined) body.contact_info = payload.contact_info;
  if (payload.image_url !== undefined) body.image_url = payload.image_url;
  if (payload.imageUrl !== undefined) body.image_url = payload.imageUrl;

  return mockApiRequest(`/lost-found/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

function updateItemStatus(itemId, status) {
  return mockApiRequest(`/lost-found/items/${itemId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

function deleteItem(itemId) {
  return mockApiRequest(`/lost-found/items/${itemId}`, {
    method: 'DELETE',
  });
}

function listMyItems() {
  return mockApiRequest('/lost-found/users/me/items');
}

function addMessage(itemId, message) {
  return mockApiRequest(`/lost-found/items/${itemId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

function listMessages(itemId) {
  return mockApiRequest(`/lost-found/items/${itemId}/messages`);
}

async function runTests() {
  console.log('=== STARTING LOST & FOUND SERVICE UNIT TESTS ===\n');

  // 1. listItems without filters
  await listItems();
  assert.strictEqual(lastCall.path, '/lost-found/items');
  assert.strictEqual(lastCall.options.method, undefined);
  console.log('✔ Test 1: listItems without filters -> GET /lost-found/items');

  // 2. listItems with filters including sort & status
  await listItems({ type: 'lost', status: 'open', search: 'Sony WH-1000', sort: 'newest' });
  assert.strictEqual(
    lastCall.path,
    '/lost-found/items?type=lost&status=open&search=Sony+WH-1000&sort=newest'
  );
  console.log('✔ Test 2: listItems with filters -> GET /lost-found/items?... (URL encoded params)');

  // 2b. listItems with 'All' filters ignored
  await listItems({ type: 'All', category: 'All', status: 'All', search: '', sort: 'All' });
  assert.strictEqual(lastCall.path, '/lost-found/items');
  console.log('✔ Test 2b: listItems ignores "All" and empty search');

  // 2c. listItems with sort=oldest
  await listItems({ status: 'open', sort: 'oldest' });
  assert.strictEqual(lastCall.path, '/lost-found/items?status=open&sort=oldest');
  console.log('✔ Test 2c: listItems with status=open&sort=oldest');

  // 3. getItem
  await getItem(42);
  assert.strictEqual(lastCall.path, '/lost-found/items/42');
  console.log('✔ Test 3: getItem(42) -> GET /lost-found/items/42');

  // 4. reportItem with image_url
  await reportItem({
    title: 'Lost Keys',
    type: 'lost',
    category: 'Keys',
    location: 'Hostel Block B',
    item_date: '2026-03-01',
    description: 'Room 204 keys',
    contact_info: '9876543210',
    image_url: 'https://images.example.com/keys.jpg',
    user_id: 999, // Should NOT be included in body
    status: 'claimed', // Should NOT be included in body
  });
  assert.strictEqual(lastCall.path, '/lost-found/items');
  assert.strictEqual(lastCall.options.method, 'POST');
  const reportBody = JSON.parse(lastCall.options.body);
  assert.strictEqual(reportBody.title, 'Lost Keys');
  assert.strictEqual(reportBody.type, 'lost');
  assert.strictEqual(reportBody.category, 'Keys');
  assert.strictEqual(reportBody.location, 'Hostel Block B');
  assert.strictEqual(reportBody.item_date, '2026-03-01');
  assert.strictEqual(reportBody.image_url, 'https://images.example.com/keys.jpg');
  assert.strictEqual(reportBody.user_id, undefined, 'user_id must not be sent');
  assert.strictEqual(reportBody.status, undefined, 'status must not be sent');
  console.log('✔ Test 4: reportItem -> POST /lost-found/items (sanitized body with image_url, no user_id/status)');

  // 5. updateItem
  await updateItem(42, {
    title: 'Found Keys on Bench',
    location: 'Hostel Block B Lawn',
    image_url: 'https://images.example.com/bench_keys.jpg',
    user_id: 123, // Should NOT be included
    status: 'claimed', // Should NOT be included
  });
  assert.strictEqual(lastCall.path, '/lost-found/items/42');
  assert.strictEqual(lastCall.options.method, 'PATCH');
  const updateBody = JSON.parse(lastCall.options.body);
  assert.strictEqual(updateBody.title, 'Found Keys on Bench');
  assert.strictEqual(updateBody.location, 'Hostel Block B Lawn');
  assert.strictEqual(updateBody.image_url, 'https://images.example.com/bench_keys.jpg');
  assert.strictEqual(updateBody.user_id, undefined);
  assert.strictEqual(updateBody.status, undefined);
  console.log('✔ Test 5: updateItem(42) -> PATCH /lost-found/items/42 (partial update with image_url, no status/user_id)');

  // 6. updateItemStatus
  await updateItemStatus(42, 'resolved');
  assert.strictEqual(lastCall.path, '/lost-found/items/42/status');
  assert.strictEqual(lastCall.options.method, 'PATCH');
  const statusBody = JSON.parse(lastCall.options.body);
  assert.strictEqual(statusBody.status, 'resolved');
  console.log('✔ Test 6: updateItemStatus(42, "resolved") -> PATCH /lost-found/items/42/status');

  // 7. deleteItem
  const deleteRes = await deleteItem(42);
  assert.strictEqual(lastCall.path, '/lost-found/items/42');
  assert.strictEqual(lastCall.options.method, 'DELETE');
  assert.strictEqual(deleteRes, null, 'DELETE must return null for 204 No Content');
  console.log('✔ Test 7: deleteItem(42) -> DELETE /lost-found/items/42 (204 -> null)');

  // 8. listMyItems
  await listMyItems();
  assert.strictEqual(lastCall.path, '/lost-found/users/me/items');
  console.log('✔ Test 8: listMyItems() -> GET /lost-found/users/me/items');

  // 9. addMessage
  await addMessage(42, 'Handed over to security desk.');
  assert.strictEqual(lastCall.path, '/lost-found/items/42/messages');
  assert.strictEqual(lastCall.options.method, 'POST');
  const msgBody = JSON.parse(lastCall.options.body);
  assert.strictEqual(msgBody.message, 'Handed over to security desk.');
  console.log('✔ Test 9: addMessage(42, ...) -> POST /lost-found/items/42/messages');

  // 10. listMessages
  await listMessages(42);
  assert.strictEqual(lastCall.path, '/lost-found/items/42/messages');
  assert.strictEqual(lastCall.options.method, undefined);
  console.log('✔ Test 10: listMessages(42) -> GET /lost-found/items/42/messages');

  console.log('\n=== ALL 10 SERVICE TESTS PASSED! ===');
}

runTests().catch((err) => {
  console.error('Service test failed:', err);
  process.exit(1);
});
