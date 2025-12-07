import { httpClient } from './httpClient';

export async function fetchCurrentUserProfile() {
  const { data } = await httpClient.post('/auth/me');
  return data;
}