import { apiRequest } from '../../../services/api';

/**
 * List lost & found items with optional filtering, search, and sorting.
 * @param {Object} filters - Optional filter object { type, category, status, search, sort }
 * @returns {Promise<Array>} Array of ItemOut objects
 */
export function listItems(filters = {}) {
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
  return apiRequest(`/lost-found/items${queryStr ? `?${queryStr}` : ''}`);
}

/**
 * Fetch single lost & found item details by ID.
 * @param {number|string} itemId - Item ID
 * @returns {Promise<Object>} ItemOut object
 */
export function getItem(itemId) {
  return apiRequest(`/lost-found/items/${itemId}`);
}

/**
 * Report a new lost or found item.
 * @param {Object} payload - ItemCreate fields { title, type, category, location, item_date, description, contact_info, image_url }
 * @returns {Promise<Object>} Created ItemOut object
 */
export function reportItem(payload) {
  return apiRequest('/lost-found/items', {
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

/**
 * Partially update an existing item listing (owner only).
 * @param {number|string} itemId - Item ID
 * @param {Object} payload - ItemUpdate fields
 * @returns {Promise<Object>} Updated ItemOut object
 */
export function updateItem(itemId, payload) {
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

  return apiRequest(`/lost-found/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Update the status of an item (owner only).
 * @param {number|string} itemId - Item ID
 * @param {string} status - 'open' | 'claimed' | 'resolved'
 * @returns {Promise<Object>} Updated ItemOut object
 */
export function updateItemStatus(itemId, status) {
  return apiRequest(`/lost-found/items/${itemId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Delete an item listing (owner only).
 * @param {number|string} itemId - Item ID
 * @returns {Promise<null>} 204 No Content parses to null
 */
export function deleteItem(itemId) {
  return apiRequest(`/lost-found/items/${itemId}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch all items reported by the authenticated user.
 * @returns {Promise<Array>} Array of ItemOut objects
 */
export function listMyItems() {
  return apiRequest('/lost-found/users/me/items');
}

/**
 * Add a contextual message to an item.
 * @param {number|string} itemId - Item ID
 * @param {string} message - Message text
 * @returns {Promise<Object>} Created MessageOut object
 */
export function addMessage(itemId, message) {
  return apiRequest(`/lost-found/items/${itemId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * List all messages for an item.
 * @param {number|string} itemId - Item ID
 * @returns {Promise<Array>} Array of MessageOut objects
 */
export function listMessages(itemId) {
  return apiRequest(`/lost-found/items/${itemId}/messages`);
}
