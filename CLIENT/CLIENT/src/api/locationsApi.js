import { httpClient } from './httpClient.js';

export async function fetchLocations() {
  const { data } = await httpClient.get('/locations');
  return data;
}

export async function fetchLocation(id) {
  const { data } = await httpClient.get(`/locations/${id}`);
  return data;
}

export async function createLocation(payload) {
  const { data } = await httpClient.post('/locations', payload);
  return data;
}

export async function updateLocation(id, payload) {
  const { data } = await httpClient.put(`/locations/${id}`, payload);
  return data;
}

export async function deleteLocation(id) {
  await httpClient.delete(`/locations/${id}`);
}