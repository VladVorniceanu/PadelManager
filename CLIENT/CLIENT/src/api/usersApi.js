import { httpClient } from './httpClient';

function unwrap(res) {
  // suportă atât { data: ... } cât și response direct
  return res?.data?.data ?? res?.data ?? res;
}

export async function fetchUsers() {
  const res = await httpClient.get('/users');
  return unwrap(res); // => array users
}

export async function setUserRole(userId, role) {
  const res = await httpClient.patch(`/users/${userId}/role`, { role });
  return unwrap(res);
}

export async function updateUserProfile(userId, profileData) {
  const res = await httpClient.patch(`/users/${userId}`, profileData);
  return unwrap(res);
}

export async function searchUsers(q, limit = 10) {
  const res = await httpClient.get('/users/search', { params: { q, limit } });
  return res?.data ?? [];
}