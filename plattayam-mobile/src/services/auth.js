import { apiRequest } from './api';

export function loginRequest(email_id, password) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ email_id, password }),
  });
}
