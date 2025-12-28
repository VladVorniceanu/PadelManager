import { httpClient } from './httpClient';

export async function fetchMyStats() {
  const res = await httpClient.get('/stats/me');
  return res.data.data;
}