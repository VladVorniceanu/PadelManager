import { validateLocationPayload } from './locations.model.js';
import * as service from './locations.service.js';

export async function listLocationsHandler(req, res) {
  const locations = await service.listLocations();
  res.json({ data: locations });
}

export async function getLocationHandler(req, res) {
  const location = await service.getLocationById(req.params.id);
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }
  res.json({ data: location });
}

export async function createLocationHandler(req, res) {
  const check = validateLocationPayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const created = await service.createLocation(req.body);
  return res.status(201).json(created);
}

export async function updateLocationHandler(req, res) {
  const check = validateLocationPayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const updated = await service.updateLocation(req.params.id, req.body);
  return res.status(200).json(updated);
}
export async function deleteLocationHandler(req, res) {
  await deleteLocation(req.params.id);
  res.status(204).end();
}

/**
 * Courts
 */
export async function addCourtHandler(req, res) {
  const location = await addCourt(req.params.id, req.body);
  res.json({ data: location });
}

export async function updateCourtHandler(req, res) {
  const location = await updateCourt(
    req.params.id,
    req.params.courtId,
    req.body
  );
  res.json({ data: location });
}

export async function deleteCourtHandler(req, res) {
  const location = await deleteCourt(
    req.params.id,
    req.params.courtId
  );
  res.json({ data: location });
}