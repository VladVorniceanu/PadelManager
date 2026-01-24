import { admin, db } from '../../config/firebase.js';
import { RESERVATIONS_COLLECTION, mapReservation } from './reservations.model.js';
import { MATCHES_COLLECTION } from '../matches/matches.model.js';

/**
 * ---------------------------
 * Helpers (same paradigm)
 * ---------------------------
 */
// Accept both call styles:
export function httpError(status, message) {
  const err = new Error(message || 'Error');
  err.status = status || 500;
  return err;
}

function normalizeDateParam(dateRaw) {
  const raw = Array.isArray(dateRaw) ? dateRaw[0] : dateRaw;

  if (raw == null) return '';

  // if it's a Date, use its ISO date part (UTC)
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return '';
    return raw.toISOString().slice(0, 10);
  }

  // string
  const s = String(raw).trim();

  // if it's ISO with time -> keep yyyy-mm-dd
  const head = s.slice(0, 10);

  // accept doar yyyy-mm-dd
  return head;
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

function toInt(raw) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v == null) return NaN;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
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
  if (!startDate) throw httpError(400, 'Invalid startAt');

  // endAt can be provided, or auto-calculated from durationMinutes
  let endDate = toDateOrNull(payload.endAt);
  if (!endDate) {
    const dur = Number(payload.durationMinutes ?? payload.duration ?? 90);
    if (!Number.isFinite(dur) || dur <= 0) throw httpError(400, 'Invalid durationMinutes');
    endDate = new Date(startDate.getTime() + dur * 60 * 1000);
  }

  if (!endDate) throw httpError(400, 'Invalid endAt');
  if (endDate.getTime() <= startDate.getTime()) throw httpError(400, 'endAt must be after startAt');

  const startTs = admin.firestore.Timestamp.fromDate(startDate);
  const endTs = admin.firestore.Timestamp.fromDate(endDate);

  // ✅ pre-check overlaps (server guard)
  const overlaps = await findOverlapsForCourt({
    courtId: payload.courtId,
    startAtDate: startDate,
    endAtDate: endDate,
  });
  if (overlaps.length) throw httpError(409, 'Selected time slot is no longer available.');

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
 * ✅ Availability (NO timezone offsets)
 * ---------------------------
 */
function dayStartUtcFromDateStr(dateStr) {
  // Treat YYYY-MM-DD as a UTC date boundary. No local conversions.
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function minutesFromDayStart(date, dayStartUtc) {
  return Math.round((date.getTime() - dayStartUtc.getTime()) / (60 * 1000));
}

async function resolveLocationHoursForCourt(courtId) {
  if (!courtId) return null;

  // NOTE: This is intentionally simple (scan locations) because courts are embedded in locations.
  // If you need scale, store `courtId -> locationId` mapping.
  const snap = await db.collection('locations').get();
  for (const doc of snap.docs) {
    const loc = { ...doc.data(), id: doc.id };
    const courts = Array.isArray(loc.courts) ? loc.courts : [];

    const hit = courts.some((c) => {
      if (!c) return false;
      if (typeof c === 'string') return c === courtId;
      const id = String(c.id || c.courtId || '');
      return id === courtId;
    });

    if (hit) {
      const open = Number(loc.openHour ?? 8);
      const close = Number(loc.closeHour ?? 22);
      return {
        locationId: loc.id,
        openHour: Number.isFinite(open) ? open : 8,
        closeHour: Number.isFinite(close) ? close : 22,
      };
    }
  }

  return null;
}

/**
 * GET slots available for a specific court, given local date + duration.
 */
export async function getCourtAvailability({
  courtId,
  date, // YYYY-MM-DD (or ISO; we'll normalize to YYYY-MM-DD)
  durationMinutes,
  openHour,
  closeHour,
  slotStepMinutes = 30,
}) {

  const dateStr = normalizeDateParam(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw httpError(400, 'Invalid date');

  const dayStartUtc = dayStartUtcFromDateStr(dateStr);
  if (!dayStartUtc) throw httpError(400, 'Invalid date');

  const dur = toInt(durationMinutes);
  if (!Number.isFinite(dur) || dur <= 0) {
    throw httpError(400, 'Invalid durationMinutes');
  }

  // Resolve location hours (defaults)
  const resolved = await resolveLocationHoursForCourt(courtId).catch(() => null);
  const openH = Number.isFinite(Number(openHour)) ? Number(openHour) : Number(resolved?.openHour ?? 8);
  let closeH = Number.isFinite(Number(closeHour)) ? Number(closeHour) : Number(resolved?.closeHour ?? 22);

  // Convention: closeHour = 0 means midnight end-of-day (24:00)
  if (closeH === 0) closeH = 24;
  // If close is earlier than open, treat it as "next day" (e.g. open 20, close 2 => close 26)
  if (Number.isFinite(openH) && Number.isFinite(closeH) && closeH <= openH) closeH += 24;

  if (!Number.isFinite(openH) || openH < 0 || openH > 24) throw httpError(400, 'Invalid openHour');
  if (!Number.isFinite(closeH) || closeH < 0 || closeH > 48) throw httpError(400, 'Invalid closeHour');

  // Query a bit wider than one day to safely catch overlaps when close hour is past midnight.
  const rangeStartUtc = new Date(dayStartUtc.getTime() - 24 * 60 * 60 * 1000);
  const rangeEndUtc = new Date(dayStartUtc.getTime() + 48 * 60 * 60 * 1000);

  // query reservations for that day-ish (by startAt range)
  const snap = await db
    .collection(RESERVATIONS_COLLECTION)
    .where('courtId', '==', courtId)
    .where('startAt', '>=', admin.firestore.Timestamp.fromDate(rangeStartUtc))
    .where('startAt', '<=', admin.firestore.Timestamp.fromDate(rangeEndUtc))
    .get();

  const booked = [];
  for (const doc of snap.docs) {
    const r = doc.data();
    const s = r.startAt?.toDate?.();
    const e = r.endAt?.toDate?.();
    if (!s || !e) continue;

    const startMin = minutesFromDayStart(s, dayStartUtc);
    const endMin = minutesFromDayStart(e, dayStartUtc);
    booked.push({ startMin, endMin });
  }

  // generate candidate slots (local minutes)
  const openMin = Math.round(openH * 60);
  let closeMin = Math.round(closeH * 60);
  // If close is "earlier" than open, treat as next-day close.
  if (closeMin <= openMin) closeMin += 24 * 60;

  const slots = [];
  const nowMs = Date.now();
  for (let startMin = openMin; startMin + dur <= closeMin; startMin += slotStepMinutes) {
    const endMin = startMin + dur;

    const overlaps = booked.some((b) => startMin < b.endMin && endMin > b.startMin);
    if (overlaps) continue;

    const startUtc = new Date(dayStartUtc.getTime() + startMin * 60 * 1000);
    const endUtc = new Date(dayStartUtc.getTime() + endMin * 60 * 1000);

    if (startUtc.getTime() < nowMs) continue;
    const pad = (n) => String(n).padStart(2, '0');
    const hh = Math.floor(startMin / 60) % 24;
    const mm = startMin % 60;
    const label = `${pad(hh)}:${pad(mm)}`;

    slots.push({
      label,
      startAt: startUtc.toISOString(),
      endAt: endUtc.toISOString(),
    });
  }

  return {
    courtId,
    date: dateStr,
    durationMinutes: dur,
    openHour: openH,
    closeHour: ((closeH % 24) + 24) % 24,
    slotStepMinutes,
    slots,
  };
}