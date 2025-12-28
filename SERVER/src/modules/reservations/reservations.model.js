export const RESERVATIONS_COLLECTION = 'reservations';

export function mapReservation(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    createdBy: data.createdBy,
    locationId: data.locationId ?? null,
    courtId: data.courtId ?? null,
    startAt: data.startAt?.toDate?.() ?? null,
    endAt: data.endAt?.toDate?.() ?? null,
    matchId: data.matchId ?? null,
    status: data.status ?? 'active',
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  };
}

export function validateCreateReservationPayload(body) {
  const errors = {};
  if (!body.locationId || typeof body.locationId !== 'string') errors.locationId = 'locationId is required';
  if (!body.courtId || typeof body.courtId !== 'string') errors.courtId = 'courtId is required';
  if (!body.startAt || typeof body.startAt !== 'string') errors.startAt = 'startAt ISO string is required';
  if (!body.endAt || typeof body.endAt !== 'string') errors.endAt = 'endAt ISO string is required';
  return { ok: Object.keys(errors).length === 0, errors };
}