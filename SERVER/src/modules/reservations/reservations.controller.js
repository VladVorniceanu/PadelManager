import * as service from './reservations.service.js';
import { validateCreateReservationPayload } from './reservations.model.js';
import { asyncHandler } from '../../core/http.js';
import { ValidationError } from '../../core/errors.js';

export const listReservationsHandler = asyncHandler(async (req, res) => {
  const uid = req.user.uid;
  const items = await service.listReservationsForUser(uid);
  res.json(items);
});

export const createReservationHandler = asyncHandler(async (req, res) => {
  const check = validateCreateReservationPayload(req.body);
  if (!check.ok) throw new ValidationError(check.errors);

  const created = await service.createReservationWithMatch({ uid: req.user.uid, payload: req.body });
  res.status(201).json(created);
});

export const getCourtAvailabilityHandler = asyncHandler(async (req, res) => {
  const { courtId, date } = req.query;
  const durationMinutes = req.query.durationMinutes ?? req.query.duration;

  const result = await service.getCourtAvailability({ courtId, date, durationMinutes });
  res.json(result);
});
