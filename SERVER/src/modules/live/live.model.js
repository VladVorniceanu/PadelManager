export const LIVE_COLLECTION = 'live';

export function mapLive(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    ...d,
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || null,
    updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt || null,
  };
}

export function validateLivePayload(payload) {
  const errors = {};
  if (!payload?.matchId) errors.matchId = 'matchId is required';
  // payload.data can be anything, keep flexible
  return { ok: Object.keys(errors).length === 0, errors };
}