import { apiRequest } from './api';

export function listRides(loc) {
  const query = loc ? `?loc=${encodeURIComponent(loc)}` : '';
  return apiRequest(`/cab-queries${query}`);
}

export function getRide(cabId) {
  return apiRequest(`/cab-queries/${cabId}`);
}

export function createRide(payload) {
  return apiRequest('/cab-queries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listMyRides() {
  return apiRequest('/users/me/cab-queries');
}

export function listMyRequests() {
  return apiRequest('/users/me/cab-requests');
}

export function listRideRequests(cabId) {
  return apiRequest(`/cab-queries/${cabId}/requests`);
}

export function createJoinRequest(cabId) {
  return apiRequest(`/cab-queries/${cabId}/request`, {
    method: 'POST',
  });
}

export function updateRequestStatus(requestId, status) {
  return apiRequest(`/cab-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
