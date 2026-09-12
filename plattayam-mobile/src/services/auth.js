import { apiRequest } from './api';

export function loginRequest(roll_no, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email_id: roll_no, password }),
  });
}

export function logoutRequest() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}
