import { db, admin } from '../../config/firebase.js';
import { LIVE_COLLECTION, mapLive } from './live.model.js';

export async function getLiveByMatchId(matchId) {
  const q = await db.collection(LIVE_COLLECTION).where('matchId', '==', matchId).limit(1).get();
  if (q.empty) return null;
  return mapLive(q.docs[0]);
}

export async function upsertLive(data, reqUser) {
  const existing = await getLiveByMatchId(data.matchId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  if (!existing) {
    const ref = db.collection(LIVE_COLLECTION).doc();
    await ref.set({
      matchId: data.matchId,
      state: data.state || {},
      createdBy: reqUser?.id || reqUser?.uid || '',
      createdAt: now,
      updatedAt: now,
    });
    return mapLive(await ref.get());
  }

  const ref = db.collection(LIVE_COLLECTION).doc(existing.id);
  await ref.update({
    state: data.state || {},
    updatedAt: now,
  });
  return mapLive(await ref.get());
}