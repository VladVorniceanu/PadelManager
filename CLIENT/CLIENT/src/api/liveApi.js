import { httpClient } from './httpClient';

export async function getLive(matchId) {
  const { data } = await httpClient.get(`/live/${matchId}`);
  return data.data;
}

export async function upsertLive(payload) {
  // payload: { matchId, state }
  const { data } = await httpClient.put('/live', payload);
  return data;
}