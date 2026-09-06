import { apiRequest } from '../../../services/api';

export function listTeams(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.filter && params.filter !== 'All') {
    query.append('filter', params.filter);
  }
  const queryStr = query.toString();
  const path = `/hackfind/teams${queryStr ? `?${queryStr}` : ''}`;
  return apiRequest(path);
}

export function getTeam(teamId) {
  return apiRequest(`/hackfind/teams/${teamId}`);
}

export function createTeam(teamData) {
  return apiRequest('/hackfind/teams', {
    method: 'POST',
    body: JSON.stringify(teamData),
  });
}

export function deleteTeam(teamId) {
  return apiRequest(`/hackfind/teams/${teamId}`, {
    method: 'DELETE',
  });
}

export function listPeople(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.filter && params.filter !== 'All') {
    query.append('filter', params.filter);
  }
  const queryStr = query.toString();
  const path = `/hackfind/people${queryStr ? `?${queryStr}` : ''}`;
  return apiRequest(path);
}

export function getPerson(personId) {
  return apiRequest(`/hackfind/people/${personId}`);
}

export function getMyProfile() {
  return apiRequest('/hackfind/users/me/profile');
}

export function createProfileCard(profileData) {
  return apiRequest('/hackfind/people', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
}

export function updateProfileCard(personId, profileData) {
  const path = personId ? `/hackfind/people/${personId}` : '/hackfind/people';
  return apiRequest(path, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

export function listMyTeams() {
  return apiRequest('/hackfind/users/me/teams');
}

export function applyToTeam(teamId, payload) {
  return apiRequest(`/hackfind/teams/${teamId}/requests`, {
    method: 'POST',
    body: JSON.stringify({
      role: payload.role,
      skills: payload.skills,
      notes: payload.notes,
    }),
  });
}

export function listTeamRequests(teamId) {
  return apiRequest(`/hackfind/teams/${teamId}/requests`);
}

export function respondToTeamRequest(teamId, reqId, status) {
  const actualTeamId = typeof teamId === 'object' && teamId !== null ? (teamId.id || teamId.team_id || teamId.teamId) : teamId;
  const actualReqId = typeof reqId === 'object' && reqId !== null ? (reqId.id || reqId.req_id || reqId.requestId) : reqId;
  const normalizedAction = String(status || 'accepted').toLowerCase();

  return apiRequest(`/hackfind/teams/${actualTeamId}/requests/${actualReqId}/respond`, {
    method: 'POST',
    body: JSON.stringify({
      action: normalizedAction,
      status: normalizedAction,
    }),
  });
}

export function removeTeamMember(teamId, memberId) {
  return apiRequest(`/hackfind/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  });
}

export function leaveTeam(teamId) {
  return apiRequest(`/hackfind/teams/${teamId}/leave`, {
    method: 'POST',
  });
}

export function inviteCandidateToTeam(teamId, payload) {
  return apiRequest(`/hackfind/teams/${teamId}/invites`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: payload.userId || payload.user_id,
      role: payload.role,
      notes: payload.notes,
    }),
  });
}
