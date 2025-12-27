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

export function validateLocationPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['Payload invalid'] };
  }

  const { name, city, address, courts } = payload;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name is required (min 2 chars)');
  }
  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    errors.push('city is required (min 2 chars)');
  }
  if (!address || typeof address !== 'string' || address.trim().length < 3) {
    errors.push('address is required (min 3 chars)');
  }

  if (!Array.isArray(courts) || courts.length < 1) {
    errors.push('courts must be a non-empty array');
  } else {
    courts.forEach((c, idx) => {
      if (!c || typeof c !== 'object') errors.push(`courts[${idx}] invalid`);
      if (!c.id || typeof c.id !== 'string') errors.push(`courts[${idx}].id required`);
      if (!c.name || typeof c.name !== 'string') errors.push(`courts[${idx}].name required`);
    });
  }

  return { ok: errors.length === 0, errors };
}