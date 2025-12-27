export const LOCATIONS_COLLECTION = 'locations';

export function mapLocation(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name,
    address: data.address,
    city: data.city,
    courts: data.courts || [],
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  };
}

export function validateLocationPayload(payload, opts = { partial: false }) {
  const errors = [];
  const partial = !!opts.partial;

  const has = (k) => payload && Object.prototype.hasOwnProperty.call(payload, k);

  if (!partial || has('name')) {
    if (!payload?.name || String(payload.name).trim().length < 2) errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!partial || has('city')) {
    if (!payload?.city || String(payload.city).trim().length < 2) errors.push({ field: 'city', message: 'City is required' });
  }

  if (!partial || has('address')) {
    if (!payload?.address || String(payload.address).trim().length < 2) errors.push({ field: 'address', message: 'Address is required' });
  }

  if (has('courts') && !Array.isArray(payload.courts)) {
    errors.push({ field: 'courts', message: 'Courts must be an array' });
  }

  return { ok: errors.length === 0, errors };
}