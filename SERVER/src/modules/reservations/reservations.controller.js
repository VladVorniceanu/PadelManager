import * as service from './reservations.service.js';
import { validateCreateReservationPayload } from './reservations.model.js';

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function canDeleteReservation(req, reservation) {
  if (!reservation) return false;
  if (isAdmin(req)) return true;
  return reservation.createdBy === req.user?.uid;
}

export async function listReservationsHandler(req, res) {
  const uid = req.user.uid;
  const items = isAdmin(req)
    ? await service.listAllReservationsAdmin()
    : await service.listReservationsForUser(uid);

  res.json({ data: items });
}

export async function createReservationHandler(req, res) {
  const check = validateCreateReservationPayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  try {
    const created = await service.createReservationWithMatch({ uid: req.user.uid, payload: req.body });
    res.status(201).json({ data: created });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || 'Failed to create reservation' });
  }
}

export async function deleteReservationHandler(req, res) {
  const reservation = await service.getReservationById(req.params.id);
  if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
  if (!canDeleteReservation(req, reservation)) return res.status(403).json({ message: 'Forbidden' });

  await service.deleteReservationAndMatch(reservation);
  res.status(204).end();
}

export async function getCourtAvailabilityHandler(req, res) {
  const courtId = String(req.query.courtId || '');
  const date = String(req.query.date || '');
  const duration = Number(req.query.duration || 60);
  const tzOffset = Number(req.query.tzOffset ?? 0); // minutes (Date.getTimezoneOffset())

  if (!courtId) 
    return res.status(400).json({ message: 'courtId is required' });
  if (!date || !/^\d{4}-\d{2}-_toggle\1$/.test(date.replace('-', '-'))) {
    // keep it strict without overcomplicating
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) 
    return res.status(400).json({ message: 'date must be YYYY-MM-DD' });
  if (![60, 90, 120].includes(duration)) 
    return res.status(400).json({ message: 'duration must be 60/90/120' });
  if (!Number.isFinite(tzOffset)) return res.status(400).json({ message: 'tzOffset must be number' });

  try {
    const out = await service.getCourtAvailability({
      courtId,
      date,
      durationMinutes: duration,
      tzOffsetMinutes: tzOffset,
      openHourLocal: 8,
      closeHourLocal: 0,
      slotStepMinutes: 30,
    });

    return res.json(out);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e?.message || 'Failed to compute availability' });
  }
}