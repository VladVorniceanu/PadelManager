import { httpClient } from './httpClient';

export async function fetchMyReservations() {
  const res = await httpClient.get('/reservations');
  return res.data.data;
}

export async function createReservation(payload) {
  const res = await httpClient.post('/reservations', payload);
  return res.data.data;
}

export async function deleteReservation(id) {
  await httpClient.delete(`/reservations/${id}`);
}