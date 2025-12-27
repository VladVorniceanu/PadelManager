import { validateLocationPayload } from './locations.model.js';
import * as service from './locations.service.js';

export async function listLocationsHandler(req, res) {
  const locations = await service.listLocations();
  res.json({ data: locations });
}

export async function getLocationHandler(req, res) {
  const location = await service.getLocationById(req.params.id);
  if (!location) return res.status(404).json({ message: 'Location not found' });
  res.json({ data: location });
}

export async function createLocationHandler(req, res) {
  // courts devine opțional, default []
  const payload = {
    ...req.body,
    courts: Array.isArray(req.body?.courts) ? req.body.courts : [],
  };

  const check = validateLocationPayload(payload);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const created = await service.createLocation(payload);
  return res.status(201).json({ data: created });
}

export async function updateLocationHandler(req, res) {
  // la update: NU forțăm courts; dacă nu vine, nu-l suprascriem
  const payload = { ...req.body };
  if ('courts' in payload && !Array.isArray(payload.courts)) payload.courts = [];

  const check = validateLocationPayload(payload, { partial: true }); // vezi pasul 2 mai jos
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const updated = await service.updateLocation(req.params.id, payload);
  return res.status(200).json({ data: updated });
}

export async function deleteLocationHandler(req, res) {
  await service.deleteLocation(req.params.id);
  res.status(204).end();
}

/**
 * Courts
 */
export async function addCourtHandler(req, res) {
  const location = await service.addCourt(req.params.id, req.body);
  res.json({ data: location });
}

export async function updateCourtHandler(req, res) {
  const location = await service.updateCourt(req.params.id, req.params.courtId, req.body);
  res.json({ data: location });
}

export async function deleteCourtHandler(req, res) {
  const location = await service.deleteCourt(req.params.id, req.params.courtId);
  res.json({ data: location });
}