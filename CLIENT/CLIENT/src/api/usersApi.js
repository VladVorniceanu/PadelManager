import { httpClient } from './httpClient';

export async function fetchUsers() {
  const response = await httpClient.get('/users');
  return response.data.data;
}

export async function setUserRole(userId, role) {
  const response = await httpClient.patch(`/users/${userId}/role`, { role });
  return response.data.data;
}