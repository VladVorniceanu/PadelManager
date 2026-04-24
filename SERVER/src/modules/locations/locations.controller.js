import { validateLocationPayload } from './locations.model.js';
import * as service from './locations.service.js';
import { asyncHandler } from '../../core/http.js';
import { NotFoundError, ValidationError } from '../../core/errors.js';

export const listLocationsHandler = asyncHandler(async (req, res) => {
  const locations = await service.listLocations();
  res.json(locations);
});

export const getLocationHandler = asyncHandler(async (req, res) => {
  const location = await service.getLocationById(req.params.id);
  if (!location) throw new NotFoundError('Location not found');
  res.json(location);
});

export const createLocationHandler = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    courts: Array.isArray(req.body?.courts) ? req.body.courts : [],
  };

  const check = validateLocationPayload(payload);
  if (!check.ok) throw new ValidationError(check.errors);

  const created = await service.createLocation(payload);
  res.status(201).json(created);
});

export const updateLocationHandler = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if ('courts' in payload && !Array.isArray(payload.courts)) payload.courts = [];

  const check = validateLocationPayload(payload, { partial: true });
  if (!check.ok) throw new ValidationError(check.errors);

  const updated = await service.updateLocation(req.params.id, payload);
  res.status(200).json(updated);
});

export const deleteLocationHandler = asyncHandler(async (req, res) => {
  await service.deleteLocation(req.params.id);
  res.status(204).end();
});

/**
 * Courts
 */
export const addCourtHandler = asyncHandler(async (req, res) => {
  const location = await service.addCourt(req.params.id, req.body);
  res.json(location);
});

export const updateCourtHandler = asyncHandler(async (req, res) => {
  const location = await service.updateCourt(req.params.id, req.params.courtId, req.body);
  res.json(location);
});

export const deleteCourtHandler = asyncHandler(async (req, res) => {
  const location = await service.deleteCourt(req.params.id, req.params.courtId);
  res.json(location);
});
