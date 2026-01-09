import { admin, db } from '../../config/firebase.js';
import {
  MATCHES_COLLECTION,
  mapMatch,
  extractParticipants,
  validateCreateMatchPayload,
  validateUpdateMatchPayload,
} from './matches.model.js';

function isoToDateOrNull(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeDerivedStatus(match) {
  const now = Date.now();

  const start = match.scheduledAt ? new Date(match.scheduledAt).getTime() : null;
  const end = match.endAt ? new Date(match.endAt).getTime() : null;

  const status = String(match.status || 'draft').toLowerCase();

  if (!start || !end) return null; // can't derive

  if (status === 'cancelled' || status === 'draft') return null;

  if (now >= start && now < end) {
    if (status === 'scheduled') return 'ongoing';
  }

  if (now >= end) {
    if (status === 'scheduled' || status === 'ongoing') return 'completed';
  }

  return null;
}

async function reconcileStatusIfNeeded(docRef, mappedMatch) {
  const next = computeDerivedStatus(mappedMatch);
  if (!next) return mappedMatch;

  await docRef.update({
    status: next,
    updatedAt: admin.firestore.Timestamp.now(),
  });

  return { ...mappedMatch, status: next };
}

export async function createMatch({ uid, payload }) {
  // Auto-calculate endAt if missing: endAt = scheduledAt + durationMinutes
  const hydrated = { ...payload };
  if (hydrated.scheduledAt && !hydrated.endAt) {
    const dur = Number(hydrated.durationMinutes ?? hydrated.duration ?? 0);
    if (Number.isFinite(dur) && dur > 0) {
      const start = isoToDateOrNull(hydrated.scheduledAt);
      if (start) hydrated.endAt = new Date(start.getTime() + dur * 60 * 1000).toISOString();
    }
  }

  const { ok, errors } = validateCreateMatchPayload(hydrated);
  if (!ok) throw new Error(`Invalid match payload: ${JSON.stringify(errors)}`);

  const now = admin.firestore.Timestamp.now();
  const scheduledAt = isoToDateOrNull(hydrated.scheduledAt);
  const endAt = isoToDateOrNull(hydrated.endAt);

  const docRef = await db.collection(MATCHES_COLLECTION).add({
    createdBy: hydrated.createdBy,
    tournamentId: hydrated.tournamentId ?? null,
    locationId: hydrated.locationId ?? null,
    courtId: hydrated.courtId ?? null,
    scheduledAt: scheduledAt ? admin.firestore.Timestamp.fromDate(scheduledAt) : null,
    endAt: endAt ? admin.firestore.Timestamp.fromDate(endAt) : null,
    status: hydrated.status ?? 'draft',
    teams: hydrated.teams ?? { team1: [null, null], team2: [null, null] },
    score: hydrated.score ?? null,
    winnerTeam: hydrated.winnerTeam ?? null,
    createdAt: now,
    updatedAt: now,
  });

  const snap = await docRef.get();
  return mapMatch(snap);
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

  const { ok, errors } = validateUpdateMatchPayload(patch);
  if (!ok) throw httpError(Object.values(errors).join(', '), 400);

  // apply patch carefully
  const next = { ...patch };

  // scheduledAt update if provided
  if (patch.scheduledAt !== undefined) {
    const d = patch.scheduledAt ? new Date(patch.scheduledAt) : null;
    next.scheduledAt = d && !Number.isNaN(d.getTime())
      ? admin.firestore.Timestamp.fromDate(d)
      : null;
  }

  // endAt update (explicit) if provided
  if (patch.endAt !== undefined) {
    const d = patch.endAt ? new Date(patch.endAt) : null;
    next.endAt = d && !Number.isNaN(d.getTime())
      ? admin.firestore.Timestamp.fromDate(d)
      : null;
  }

  // Auto-calculate endAt if missing but we have durationMinutes (+ scheduledAt new or existing)
  const shouldAutoEndAt = patch.endAt === undefined && patch.durationMinutes !== undefined;
  if (shouldAutoEndAt) {
    const dur = Number(patch.durationMinutes);
    const startTs = next.scheduledAt !== undefined ? next.scheduledAt : (data.scheduledAt ?? null);
    const startDate = startTs?.toDate ? startTs.toDate() : (startTs ? new Date(startTs) : null);
    if (Number.isFinite(dur) && dur > 0 && startDate && !Number.isNaN(startDate.getTime())) {
      const endDate = new Date(startDate.getTime() + dur * 60 * 1000);
      next.endAt = admin.firestore.Timestamp.fromDate(endDate);
    }
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