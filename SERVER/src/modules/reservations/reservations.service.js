import { admin, db } from '../../config/firebase.js';
import { randomUUID } from 'crypto';
import { RESERVATIONS_COLLECTION, mapReservation } from './reservations.model.js';
import { MATCHES_COLLECTION } from '../matches/matches.model.js';

function toTimestamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(d);
}

export async function createReservationWithMatch({ uid, payload }) {
  const startTs = toTimestamp(payload.startAt);
  const endTs = toTimestamp(payload.endAt);
  if (!startTs || !endTs) {
    const err = new Error('Invalid startAt/endAt');
    err.status = 400;
    throw err;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  const matchRef = db.collection(MATCHES_COLLECTION).doc();
  const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc();

  const batch = db.batch();

  batch.set(matchRef, {
    createdBy: uid,
    tournamentId: payload.tournamentId ?? null,
    locationId: payload.locationId,
    courtId: payload.courtId,
    scheduledAt: startTs,
    status: 'scheduled',
    teams: { team1: [uid, null], team2: [null, null] },
    score: null,
    winnerTeam: null,
    createdAt: now,
    updatedAt: now,
  });

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

  const reservationSnap = await reservationRef.get();
  return mapReservation(reservationSnap);
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

export async function listAllReservationsAdmin() {
  const snap = await db.collection(RESERVATIONS_COLLECTION).orderBy('startAt', 'desc').limit(300).get();
  return snap.docs.map(mapReservation);
}

export async function deleteReservationAndMatch(reservation) {
  const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc(reservation.id);
  const matchRef = reservation.matchId ? db.collection(MATCHES_COLLECTION).doc(reservation.matchId) : null;

  const batch = db.batch();
  batch.delete(reservationRef);
  if (matchRef) batch.delete(matchRef);

  await batch.commit();
}