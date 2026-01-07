import { admin, db } from '../../config/firebase.js';
import { RESERVATIONS_COLLECTION, mapReservation } from './reservations.model.js';
import { MATCHES_COLLECTION } from '../matches/matches.model.js';

/**
 * ---------------------------
 * Helpers (same paradigm)
 * ---------------------------
 */
function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function toTimestampOrNull(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(d);
}

function toDateOrNull(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function clampTeams({ requesterUid, teams }) {
  // Ensure arrays exist + requester is always player1 of team1
  const empty = [null, null];
  const t = teams && typeof teams === 'object' ? teams : { team1: empty, team2: empty };

  const team1 = Array.isArray(t.team1) ? [...t.team1] : [...empty];
  const team2 = Array.isArray(t.team2) ? [...t.team2] : [...empty];

  team1.length = 2;
  team2.length = 2;

  team1[0] = requesterUid; // forced
  if (team1[1] === undefined) team1[1] = null;
  if (team2[0] === undefined) team2[0] = null;
  if (team2[1] === undefined) team2[1] = null;

  // normalize empty strings
  for (const arr of [team1, team2]) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === '') arr[i] = null;
    }
  }

  return { team1, team2 };
}

/**
 * ---------------------------
 * ✅ Overlaps guard (logic from v1)
 * ---------------------------
 */
async function findOverlapsForCourt({ courtId, startAtDate, endAtDate }) {
  // Firestore limitation: query by courtId + startAt range, then filter overlaps.
  const startWindow = new Date(startAtDate.getTime() - 24 * 60 * 60 * 1000);
  const endWindow = new Date(endAtDate.getTime() + 24 * 60 * 60 * 1000);

  const snap = await db
    .collection(RESERVATIONS_COLLECTION)
    .where('courtId', '==', courtId)
    .where('startAt', '>=', admin.firestore.Timestamp.fromDate(startWindow))
    .where('startAt', '<=', admin.firestore.Timestamp.fromDate(endWindow))
    .get();

  const overlaps = [];
  for (const doc of snap.docs) {
    const r = doc.data();
    const s = r.startAt?.toDate?.();
    const e = r.endAt?.toDate?.();
    if (!s || !e) continue;

    // overlap: s < end && e > start
    if (s.getTime() < endAtDate.getTime() && e.getTime() > startAtDate.getTime()) {
      overlaps.push({ id: doc.id, startAt: s, endAt: e });
    }
  }

  return overlaps;
}

/**
 * ---------------------------
 * ✅ Create reservation + match (logic from v1, style from v2)
 * ---------------------------
 */
export async function createReservationWithMatch({ uid, payload }) {
  const startDate = toDateOrNull(payload.startAt);
  const endDate = toDateOrNull(payload.endAt);
  if (!startDate || !endDate) throw httpError('Invalid startAt/endAt', 400);
  if (endDate.getTime() <= startDate.getTime()) throw httpError('endAt must be after startAt', 400);

  const startTs = admin.firestore.Timestamp.fromDate(startDate);
  const endTs = admin.firestore.Timestamp.fromDate(endDate);

  // ✅ pre-check overlaps (server guard)
  const overlaps = await findOverlapsForCourt({
    courtId: payload.courtId,
    startAtDate: startDate,
    endAtDate: endDate,
  });
  if (overlaps.length) throw httpError('Selected time slot is no longer available.', 409);

  const now = admin.firestore.FieldValue.serverTimestamp();

  const matchRef = db.collection(MATCHES_COLLECTION).doc();
  const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc();

  const normalizedTeams = clampTeams({ requesterUid: uid, teams: payload.teams });

  const batch = db.batch();

  // Match (scheduled)
  batch.set(matchRef, {
    createdBy: uid,
    tournamentId: payload.tournamentId ?? null,
    locationId: payload.locationId,
    courtId: payload.courtId,
    scheduledAt: startTs,
    endAt: endTs, // ✅ kept from v1 logic (used by auto-status in your system, if any)
    teams: normalizedTeams,
    status: 'scheduled',
    score: null,
    winnerTeam: null,
    createdAt: now,
    updatedAt: now,
  });

  // Reservation linked to match
  batch.set(reservationRef, {
    createdBy: uid,
    locationId: payload.locationId,
    courtId: payload.courtId,
    startAt: startTs,
    endAt: endTs,
    matchId: matchRef.id,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();

  // return reservation in the same shape as your v2 (mapReservation)
  const reservationSnap = await reservationRef.get();
  const reservation = mapReservation(reservationSnap);

  // keep v1 "match" linkage in response (optional, but preserves v1 behavior)
  return {
    ...reservation,
    matchId: matchRef.id,
  };
}

export async function getReservationById(id) {
  const snap = await db.collection(RESERVATIONS_COLLECTION).doc(id).get();
  return snap.exists ? mapReservation(snap) : null;
}

export async function listReservationsForUser(uid) {
  const snap = await db
    .collection(RESERVATIONS_COLLECTION)
    .where('createdBy', '==', uid)
    .orderBy('startAt', 'desc')
    .limit(100)
    .get();

  return snap.docs.map(mapReservation);
}

/**
 * ---------------------------
 * ✅ Delete reservation (+ match) with auth (logic from v1, style from v2)
 * ---------------------------
 */
export async function deleteReservation({ reservationId, requesterUid, requesterRole }) {
  const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc(reservationId);
  const snap = await reservationRef.get();

  if (!snap.exists) throw httpError('Reservation not found', 404);

  const reservation = mapReservation(snap);
  const isAdmin = requesterRole === 'admin';
  const isOwner = reservation.createdBy === requesterUid;

  if (!isAdmin && !isOwner) throw httpError('Not allowed', 403);

  const matchRef = reservation.matchId ? db.collection(MATCHES_COLLECTION).doc(reservation.matchId) : null;

  const batch = db.batch();
  batch.delete(reservationRef);
  if (matchRef) batch.delete(matchRef);

  await batch.commit();
}

/**
 * ---------------------------
 * ✅ Availability (logic from v1)
 * ---------------------------
 */
function toUtcFromLocalDateParts({ y, m, d, tzOffsetMinutes, hh = 0, mm = 0 }) {
  // tzOffsetMinutes = Date.getTimezoneOffset() (UTC - local)
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) + tzOffsetMinutes * 60 * 1000;
  return new Date(utcMs);
}

function minutesSinceLocalMidnight(dateUtc, tzOffsetMinutes) {
  // local = utc - tzOffset
  const localMs = dateUtc.getTime() - tzOffsetMinutes * 60 * 1000;
  const local = new Date(localMs);
  return local.getHours() * 60 + local.getMinutes();
}

/**
 * GET slots available for a specific court, given local date + duration.
 */
export async function getCourtAvailability({
  courtId,
  date, // YYYY-MM-DD (local)
  durationMinutes,
  tzOffsetMinutes,
  openHourLocal = 8,
  closeHourLocal = 22,
  slotStepMinutes = 30,
}) {
  const [yStr, mStr, dStr] = String(date).split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    throw httpError('Invalid date', 400);
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw httpError('Invalid durationMinutes', 400);
  }
  if (!Number.isFinite(tzOffsetMinutes)) {
    throw httpError('Invalid tzOffsetMinutes', 400);
  }

  const dayStartUtc = toUtcFromLocalDateParts({ y, m, d, tzOffsetMinutes, hh: 0, mm: 0 });
  const dayEndUtc = toUtcFromLocalDateParts({ y, m, d, tzOffsetMinutes, hh: 23, mm: 59 });

  // query reservations for that day-ish (by startAt range)
  const snap = await db
    .collection(RESERVATIONS_COLLECTION)
    .where('courtId', '==', courtId)
    .where('startAt', '>=', admin.firestore.Timestamp.fromDate(dayStartUtc))
    .where('startAt', '<=', admin.firestore.Timestamp.fromDate(dayEndUtc))
    .get();

  const booked = [];
  for (const doc of snap.docs) {
    const r = doc.data();
    const s = r.startAt?.toDate?.();
    const e = r.endAt?.toDate?.();
    if (!s || !e) continue;

    const startMin = minutesSinceLocalMidnight(s, tzOffsetMinutes);
    const endMin = minutesSinceLocalMidnight(e, tzOffsetMinutes);
    booked.push({ startMin, endMin });
  }

  // generate candidate slots (local minutes)
  const openMin = openHourLocal * 60;
  const closeMin = closeHourLocal * 60;

  const slots = [];
  for (let startMin = openMin; startMin + durationMinutes <= closeMin; startMin += slotStepMinutes) {
    const endMin = startMin + durationMinutes;

    const overlaps = booked.some((b) => startMin < b.endMin && endMin > b.startMin);
    if (overlaps) continue;

    // produce ISO in UTC for the actual start/end
    const startUtc = toUtcFromLocalDateParts({
      y,
      m,
      d,
      tzOffsetMinutes,
      hh: Math.floor(startMin / 60),
      mm: startMin % 60,
    });
    const endUtc = toUtcFromLocalDateParts({
      y,
      m,
      d,
      tzOffsetMinutes,
      hh: Math.floor(endMin / 60),
      mm: endMin % 60,
    });

    const pad = (n) => String(n).padStart(2, '0');
    const label = `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`;

    slots.push({
      label, // "HH:MM" local
      startAt: startUtc.toISOString(),
      endAt: endUtc.toISOString(),
    });
  }

  return {
    courtId,
    date,
    durationMinutes,
    openHourLocal,
    closeHourLocal,
    slotStepMinutes,
    slots,
  };
}