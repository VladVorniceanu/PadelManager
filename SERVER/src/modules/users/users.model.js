export const USERS_COLLECTION = 'users';

function toIso(value) {
  if (!value) return null;

  // Firestore Timestamp
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  // JS Date
  if (value instanceof Date) {
    return value.toISOString();
  }

  // ISO string
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Firestore timestamp-like object
  if (typeof value === 'object' && typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000).toISOString();
  }

  return null;
}

export function mapUser(snap) {
  const data = snap?.data ? snap.data() : snap;
  const id = snap?.id || data?.id || data?.uid;

  return {
    id,
    uid: data?.uid || id,
    email: data?.email || '',
    displayName: data?.displayName || '',
    role: data?.role || 'player',
    status: data?.status || 'active',
    createdAt: toIso(data?.createdAt),
    updatedAt: toIso(data?.updatedAt),
  };
}