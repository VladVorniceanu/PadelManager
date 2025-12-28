import { httpClient } from './httpClient';

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

export async function fetchLocations() {
  const res = await httpClient.get('/locations');
  return unwrap(res); // => array locations
}

export async function fetchLocation(id) {
  const res = await httpClient.get(`/locations/${id}`);
  return unwrap(res); // => location
}

export async function createLocation(payload) {
  const res = await httpClient.post('/locations', payload);
  return unwrap(res); // => created location (server uneori nu wrap-uie)
}

export async function updateLocation(id, payload) {
  const res = await httpClient.put(`/locations/${id}`, payload);
  return unwrap(res); // => updated location
}

export async function deleteLocation(id) {
  const res = await httpClient.delete(`/locations/${id}`);
  return unwrap(res);
}

// Courts
export async function addCourt(locationId, payload) {
  const res = await httpClient.post(`/locations/${locationId}/courts`, payload);
  return unwrap(res); // => updated location
}

export async function updateCourt(locationId, courtId, payload) {
  const res = await httpClient.put(`/locations/${locationId}/courts/${courtId}`, payload);
  return unwrap(res); // => updated location
}

export async function deleteCourt(locationId, courtId) {
  const res = await httpClient.delete(`/locations/${locationId}/courts/${courtId}`);
  return unwrap(res); // => updated location
}