import * as locationsService from './locations.service.js';

export async function listLocationsHandler(req, res, next) {
  try {
    const list = await locationsService.listLocations();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function getLocationHandler(req, res, next) {
  try {
    const loc = await locationsService.getLocation(req.params.id);
    if (!loc) return res.status(404).json({ message: 'Location not found' });
    res.json(loc);
  } catch (err) {
    next(err);
  }
}

export async function createLocationHandler(req, res, next) {
  try {
    const loc = await locationsService.createLocation(req.body);
    res.status(201).json(loc);
  } catch (err) {
    next(err);
  }
}

export async function updateLocationHandler(req, res, next) {
  try {
    const loc = await locationsService.updateLocation(req.params.id, req.body);
    res.json(loc);
  } catch (err) {
    next(err);
  }
}

export async function deleteLocationHandler(req, res, next) {
  try {
    const result = await locationsService.deleteLocation(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}