import { db, admin } from '../../config/firebase.js';
import { TOURNAMENTS_COLLECTION, mapTournament } from './tournaments.model.js';

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function toMs(v) {
  if (!v) return null;
  // acceptă ISO string / Date / number
  const d = v instanceof Date ? v : new Date(v);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function computeDerivedTournamentStatus(t, nowMs) {
  const current = String(t?.status || 'draft').toLowerCase();

  // nu atingem stări "manuale"/finale
  if (current === 'draft' || current === 'finished') return null;

  const startMs = toMs(t?.startDate);
  const endMs = toMs(t?.endDate);

  // dacă nu avem start sau end, nu putem deriva sigur
  if (startMs == null || endMs == null) return null;

  if (nowMs >= endMs) {
    if (current === 'scheduled' || current === 'running') return 'finished';
    return null;
  }

  if (nowMs >= startMs && nowMs < endMs) {
    if (current === 'scheduled') return 'running';
    return null; // dacă e deja running, nu schimbăm
  }

  // now < start
  if (current === 'running') return 'scheduled'; // caz “running” rămas în trecut înainte de start (stale)
  return null;
}

async function reconcileTournamentsForPairs(pairs) {
  const nowTs = admin.firestore.Timestamp.now();
  const nowMs = nowTs.toMillis();

  const updates = [];
  const result = pairs.map(({ ref, t }) => {
    const next = computeDerivedTournamentStatus(t, nowMs);
    if (!next) return t;

    updates.push({ ref, next });
    return { ...t, status: next };
  });

  if (!updates.length) return result;

  for (const group of chunk(updates, 500)) {
    const batch = db.batch();
    for (const u of group) {
      batch.update(u.ref, {
        status: u.next,
        updatedAt: nowTs, // consistent; sau FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
  }

  return result;
}

export async function listTournaments() {
  const snap = await db.collection(TOURNAMENTS_COLLECTION).orderBy('updatedAt', 'desc').get();

  const pairs = snap.docs.map((doc) => ({
    ref: doc.ref,
    t: mapTournament(doc),
  }));

  return await reconcileTournamentsForPairs(pairs);
}

export async function getTournamentById(id) {
  const doc = await db.collection(TOURNAMENTS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  const t = mapTournament(doc);
  const nowTs = admin.firestore.Timestamp.now();
  const nowMs = nowTs.toMillis();

  const next = computeDerivedTournamentStatus(t, nowMs);
  if (!next) return t;

  await doc.ref.update({
    status: next,
    updatedAt: nowTs,
  });

  return { ...t, status: next };
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