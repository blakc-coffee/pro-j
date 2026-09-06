import { apiRequest } from '../../../services/api';

export function listRides() {
  return apiRequest('/cab-queries');
}

export function getRide(cabId) {
  return apiRequest(`/cab-queries/${cabId}`);
}

export function postRide(payload) {
  return apiRequest('/cab-queries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function cancelRide(cabId) {
  return apiRequest(`/cab-queries/${cabId}`, {
    method: 'DELETE',
  });
}

export function sendRideRequest(cabId, seatsRequested = 1) {
  return apiRequest(`/cab-queries/${cabId}/request`, {
    method: 'POST',
    body: JSON.stringify({ seats_requested: seatsRequested }),
  });
}

export function listMyRides() {
  return apiRequest('/users/me/cab-queries');
}

export function listMyRequests() {
  return apiRequest('/users/me/cab-requests');
}

export function deleteRideRequest(requestId) {
  return apiRequest(`/cab-requests/${requestId}`, {
    method: 'DELETE',
  });
}

export function listRideRequests(cabId) {
  return apiRequest(`/cab-queries/${cabId}/requests`);
}

export function respondToRideRequest(cabId, requesterId, action) {
  return apiRequest(`/cab-requests/${requesterId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: action === 'accept' ? 'Accepted' : 'Rejected' }),
  });
}

export function getUserProfile(userId) {
  return apiRequest(`/users/${userId}`);
}

export function updateUserProfile(payload) {
  return apiRequest('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
