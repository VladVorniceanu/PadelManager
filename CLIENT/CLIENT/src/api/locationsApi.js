import { httpClient } from './httpClient';

// GET /api/locations
export async function fetchLocations() {
  const res = await httpClient.get('/locations');
  // suportă ambele forme: {data:[...]} sau direct [...]
  return res.data?.data ?? res.data;
}

// GET /api/locations/:id
export async function fetchLocationById(id) {
  const res = await httpClient.get(`/locations/${id}`);
  return res.data?.data ?? res.data;
}

// POST /api/locations
export async function createLocation(payload) {
  const res = await httpClient.post('/locations', payload);
  return res.data?.data ?? res.data;
}

// PUT /api/locations/:id
export async function updateLocation(id, payload) {
  const res = await httpClient.put(`/locations/${id}`, payload);
  return res.data?.data ?? res.data;
}

// DELETE /api/locations/:id
export async function deleteLocation(id) {
  const res = await httpClient.delete(`/locations/${id}`);
  return res.data?.data ?? res.data;
}