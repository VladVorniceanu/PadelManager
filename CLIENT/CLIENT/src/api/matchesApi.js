import { httpClient } from './httpClient';

export async function fetchMyMatches() {
  const res = await httpClient.get('/matches');
  return res.data;
}

export async function createMatch(payload) {
  const res = await httpClient.post('/matches', payload);
  return res.data;
}

export async function updateMatch(id, patch) {
  const res = await httpClient.patch(`/matches/${id}`, patch);
  return res.data;
}

export async function deleteMatch(id) {
  await httpClient.delete(`/matches/${id}`);
}

export async function fetchNumberOfMatchesByStatus(status) {
  const res = await httpClient.get(`/matches/count/${status}`);
  return res.data.count;
}

export async function fetchNumberOfMatches() {
  const res = await httpClient.get(`/matches/count`);
  return res.data.count;
}