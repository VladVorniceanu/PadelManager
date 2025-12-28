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