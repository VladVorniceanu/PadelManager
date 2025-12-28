export const TOURNAMENTS_COLLECTION = 'tournaments';

export function mapTournament(doc) {
  const data = doc.data ? doc.data() : doc; // acceptă doc snapshot sau obiect
  const id = doc.id || data.id;

  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null;
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || null;

  return {
    id,
    name: data.name || '',
    locationId: data.locationId || '',
    startDate: data.startDate || null, // ISO string
    endDate: data.endDate || null,     // ISO string
    status: data.status || 'draft',    // draft | scheduled | running | finished
    createdBy: data.createdBy || '',
    createdAt,
    updatedAt,
  };
}

export function validateTournamentPayload(body) {
  const errors = {};

  const name = String(body?.name || '').trim();
  const locationId = String(body?.locationId || '').trim();
  const status = String(body?.status || 'draft').trim();
  const startDate = body?.startDate ? String(body.startDate) : null;
  const endDate = body?.endDate ? String(body.endDate) : null;

  if (name.length < 2) errors.name = 'Name must have at least 2 characters';
  if (!locationId) errors.locationId = 'locationId is required';

  const allowed = ['draft', 'scheduled', 'running', 'finished'];
  if (!allowed.includes(status)) errors.status = 'Invalid status';

  // date sanity (optional)
  if (startDate && Number.isNaN(new Date(startDate).getTime())) errors.startDate = 'Invalid startDate';
  if (endDate && Number.isNaN(new Date(endDate).getTime())) errors.endDate = 'Invalid endDate';

  if (startDate && endDate) {
    const a = new Date(startDate).getTime();
    const b = new Date(endDate).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) errors.endDate = 'endDate must be >= startDate';
  }

  const ok = Object.keys(errors).length === 0;
  return { ok, errors, data: { name, locationId, status, startDate, endDate } };
}