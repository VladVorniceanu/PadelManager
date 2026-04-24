import { admin, db } from '../../config/firebase.js';
import {
  MATCHES_COLLECTION,
  mapMatch,
  extractParticipants,
  validateCreateMatchPayload,
  validateUpdateMatchPayload,
} from './matches.model.js';
import { BadRequestError } from '../../core/errors.js';

function isoToDateOrNull(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toMs(v) {
  if (!v) return null;

  // Firestore Timestamp
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.toDate === 'function') return v.toDate().getTime();

  // JS Date
  if (v instanceof Date) {
    const ms = v.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  // ISO string / number
  const d = new Date(v);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function computeDerivedStatus(match, nowMs) {
  const status = String(match.status || 'draft').toLowerCase();
  if (status === 'cancelled' || status === 'completed' || status === 'draft') return null;

  const startMs = toMs(match.scheduledAt);
  const endMs = toMs(match.endAt) ?? (startMs != null ? startMs + 60 * 60 * 1000 : null);

  if (startMs == null || endMs == null) return null;

  if (nowMs >= endMs) {
    if (status === 'scheduled' || status === 'ongoing') return 'completed';
    return null;
  }

  if (nowMs >= startMs && nowMs < endMs) {
    if (status === 'scheduled') return 'ongoing';
    return null;
  }

  // now < start -> keep scheduled
  return null;
}

async function reconcileStatusesForMatches(pairs) {
  const nowTs = admin.firestore.Timestamp.now();
  const nowMs = nowTs.toMillis();

  const updates = [];
  const result = pairs.map(({ ref, match }) => {
    const next = computeDerivedStatus(match, nowMs);
    if (!next) return match;

    updates.push({ ref, next });
    return { ...match, status: next };
  });

  if (!updates.length) return result;

  // batch max 500 writes
  for (const group of chunk(updates, 200)) {
    const batch = db.batch();
    for (const u of group) {
      batch.update(u.ref, {
        status: u.next,
        updatedAt: nowTs,
      });
    }
    await batch.commit();
  }

  return result;
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
  if (!ok) throw new BadRequestError( `Invalid match payload: ${JSON.stringify(errors)}`);

  const now = admin.firestore.Timestamp.now();
  const scheduledAt = isoToDateOrNull(hydrated.scheduledAt);
  const endAt = isoToDateOrNull(hydrated.endAt);

  const docRef = await db.collection(MATCHES_COLLECTION).add({
    createdBy: uid,
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
  const snap = await db.collection(MATCHES_COLLECTION).orderBy('updatedAt', 'desc').limit(200).get();

  // păstrezi ref + match mapped
  const allPairs = snap.docs.map((doc) => ({ ref: doc.ref, match: mapMatch(doc) }));

  const userPairs = allPairs.filter(({ match }) => {
    if (match.createdBy === uid) return true;
    const parts = extractParticipants(match);
    return parts.includes(uid);
  });

  return await reconcileStatusesForMatches(userPairs);
}

export async function countMatchesByStatus(status) {
  let query = db.collection(MATCHES_COLLECTION);

  if (status) {
    const normalized = String(status).toLowerCase();
    query = query.where('status', '==', normalized);
  }

  const snap = await query.count().get();
  return snap.data().count;
}

export async function countAllMatches() {
  const snap = await db.collection(MATCHES_COLLECTION).count().get();
  return snap.data().count;
}

export async function updateMatch(id, patch) {
  const ref = db.collection(MATCHES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();

  const { ok, errors } = validateUpdateMatchPayload(patch);
  if (!ok) throw new BadRequestError( Object.values(errors).join(', '));

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