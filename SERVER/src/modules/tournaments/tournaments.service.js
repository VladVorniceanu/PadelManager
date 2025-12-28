import { db, admin } from '../../config/firebase.js';
import { TOURNAMENTS_COLLECTION, mapTournament } from './tournaments.model.js';

export async function listTournaments() {
  const snap = await db.collection(TOURNAMENTS_COLLECTION).orderBy('updatedAt', 'desc').get();
  return snap.docs.map(mapTournament);
}

export async function getTournamentById(id) {
  const doc = await db.collection(TOURNAMENTS_COLLECTION).doc(id).get();
  return doc.exists ? mapTournament(doc) : null;
}

export async function createTournament(data, reqUser) {
  const ref = db.collection(TOURNAMENTS_COLLECTION).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    name: data.name,
    locationId: data.locationId,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    status: data.status || 'draft',
    createdBy: reqUser?.id || reqUser?.uid || '',
    createdAt: now,
    updatedAt: now,
  });

  return mapTournament(await ref.get());
}

export async function updateTournament(id, data) {
  const ref = db.collection(TOURNAMENTS_COLLECTION).doc(id);
  await ref.update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return mapTournament(await ref.get());
}

export async function deleteTournament(id) {
  await db.collection(TOURNAMENTS_COLLECTION).doc(id).delete();
}