import { admin, db } from '../../config/firebase.js';
import { MATCHES_COLLECTION, mapMatch, extractParticipants } from './matches.model.js';

function parseDateOrNull(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createMatch({ uid, payload }) {
  const ref = db.collection(MATCHES_COLLECTION).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const scheduledAtDate = parseDateOrNull(payload?.scheduledAt);
  const scheduledAt = scheduledAtDate ? admin.firestore.Timestamp.fromDate(scheduledAtDate) : null;

  const doc = {
    createdBy: uid,
    tournamentId: payload?.tournamentId ?? null,
    locationId: payload?.locationId ?? null,
    courtId: payload?.courtId ?? null,
    scheduledAt,
    status: payload?.status ?? (scheduledAt ? 'scheduled' : 'draft'),
    teams: {
      team1: [uid, null], // creator always player1 team1
      team2: [null, null],
    },
    score: null,
    winnerTeam: null,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(doc);
  return mapMatch(await ref.get());
}

export async function getMatchById(id) {
  const snap = await db.collection(MATCHES_COLLECTION).doc(id).get();
  return snap.exists ? mapMatch(snap) : null;
}

export async function listMatchesForUser(uid) {
  // Firestore can't query nested array-of-arrays easily; simplest: fetch recent and filter.
  // Optimize later by also storing a `participants` array.
  const snap = await db.collection(MATCHES_COLLECTION).orderBy('updatedAt', 'desc').limit(200).get();
  const all = snap.docs.map(mapMatch);
  return all.filter((m) => {
    if (m.createdBy === uid) return true;
    const parts = extractParticipants(m);
    return parts.includes(uid);
  });
}

export async function listAllMatchesAdmin() {
  const snap = await db.collection(MATCHES_COLLECTION).orderBy('updatedAt', 'desc').limit(500).get();
  return snap.docs.map(mapMatch);
}

export async function updateMatch(id, patch) {
  const ref = db.collection(MATCHES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();

  // apply patch carefully
  const next = { ...patch };

  // scheduledAt update if provided
  if (patch.scheduledAt !== undefined) {
    const d = patch.scheduledAt ? new Date(patch.scheduledAt) : null;
    next.scheduledAt = d && !Number.isNaN(d.getTime())
      ? admin.firestore.Timestamp.fromDate(d)
      : null;
  }

  // merge teams if partial
  if (patch.teams) {
    next.teams = {
      ...(data.teams ?? { team1: [null, null], team2: [null, null] }),
      ...patch.teams,
    };
  }

  await ref.update({
    ...next,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return mapMatch(await ref.get());
}

export async function deleteMatch(id) {
  await db.collection(MATCHES_COLLECTION).doc(id).delete();
}