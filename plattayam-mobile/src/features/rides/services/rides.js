import { apiRequest } from '../../../services/api';

export function listRides() {
  return apiRequest('/rides');
}

export function getRide(cabId) {
  return apiRequest(`/rides/${cabId}`);
}

export function postRide(payload) {
  return apiRequest('/rides', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function cancelRide(cabId) {
  return apiRequest(`/rides/${cabId}`, {
    method: 'DELETE',
  });
}

export function sendRideRequest(cabId, seatsRequested = 1) {
  return apiRequest(`/rides/${cabId}/requests`, {
    method: 'POST',
    body: JSON.stringify({ seats_requested: seatsRequested }),
  });
}

export function listMyRides() {
  return apiRequest('/rides/user/me');
}

export function listMyRequests() {
  return apiRequest('/rides/requests/me');
}

export function deleteRideRequest(cabId) {
  return apiRequest(`/rides/${cabId}/requests`, {
    method: 'DELETE',
  });
}

export function listRideRequests(cabId) {
  return apiRequest(`/rides/${cabId}/requests`);
}

export function respondToRideRequest(cabId, requesterId, action) {
  return apiRequest(`/rides/${cabId}/requests/${requesterId}`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export function getUserProfile(userId) {
  return apiRequest(`/users/${userId}`);
}

export function updateUserProfile(payload) {
  return apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
