import * as service from './reservations.service.js';
import { validateCreateReservationPayload } from './reservations.model.js';

export async function listReservationsHandler(req, res) {
  const uid = req.user.uid;
  const items = await service.listReservationsForUser(uid);
  // ✅ API responses are "direct" across the project
  res.json(items);
}

export async function createReservationHandler(req, res) {
  const check = validateCreateReservationPayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  try {
    const created = await service.createReservationWithMatch({ uid: req.user.uid, payload: req.body });
    res.status(201).json(created);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || 'Failed to create reservation' });
  }
}

export async function getCourtAvailabilityHandler(req, res) {
  try {
    const { courtId, date } = req.query;

    const durationMinutes = req.query.durationMinutes ?? req.query.duration;

    const result = await service.getCourtAvailability({
      courtId,
      date,
      durationMinutes,
    });

    return res.json(result);
  } catch (err) {
    const status = Number(err?.status) || 500;
    return res.status(status).json({ message: err?.message || 'Server error' });
  }
}