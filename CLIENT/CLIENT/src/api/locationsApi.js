import { httpClient } from './httpClient';

export async function fetchLocations() {
  const res = await httpClient.get('/locations');
  return res.data?.data ?? [];
}

export async function fetchLocationById(id) {
  const res = await httpClient.get(`/locations/${id}`);
  return res.data?.data;
}

export async function createLocation(payload) {
  const res = await httpClient.post('/locations', payload);
  return res.data?.data;
}

export async function updateLocation(id, payload) {
  const res = await httpClient.put(`/locations/${id}`, payload);
  return res.data?.data;
}

export async function deleteLocation(id) {
  await httpClient.delete(`/locations/${id}`);
}

export async function addCourt(locationId, payload) {
  const res = await httpClient.post(`/locations/${locationId}/courts`, payload);
  return res.data?.data; // updated location
}

export async function updateCourt(locationId, courtId, payload) {
  const res = await httpClient.put(`/locations/${locationId}/courts/${courtId}`, payload);
  return res.data?.data; // updated location
}

export async function deleteCourt(locationId, courtId) {
  const res = await httpClient.delete(`/locations/${locationId}/courts/${courtId}`);
  return res.data?.data; // updated location
}