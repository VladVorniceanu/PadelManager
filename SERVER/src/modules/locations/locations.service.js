import { db, admin } from '../../config/firebase.js';
import { LOCATIONS_COLLECTION, mapLocation } from './locations.model.js';
import { randomUUID } from 'crypto';

export async function listLocations() {
  const snap = await db.collection(LOCATIONS_COLLECTION).get();
  return snap.docs.map(mapLocation);
}

export async function getLocationById(id) {
  const doc = await db.collection(LOCATIONS_COLLECTION).doc(id).get();
  return doc.exists ? mapLocation(doc) : null;
}

export async function createLocation(data) {
  const ref = db.collection(LOCATIONS_COLLECTION).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    name: data.name,
    address: data.address,
    city: data.city,
    courts: [],
    createdAt: now,
    updatedAt: now,
  });

  return mapLocation(await ref.get());
}

export async function updateLocation(id, data) {
  const ref = db.collection(LOCATIONS_COLLECTION).doc(id);

  await ref.update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return mapLocation(await ref.get());
}

export async function deleteLocation(id) {
  await db.collection(LOCATIONS_COLLECTION).doc(id).delete();
}

/**
 * Courts
 */
export async function addCourt(locationId, courtData) {
  const ref = db.collection(LOCATIONS_COLLECTION).doc(locationId);
  const snap = await ref.get();

  if (!snap.exists) throw new Error('Location not found');

  const location = snap.data();
  const courts = location.courts || [];

  courts.push({
    id: randomUUID(),
    name: courtData.name,
    isIndoor: !!courtData.isIndoor,
  });

  await ref.update({
    courts,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return mapLocation(await ref.get());
}

export async function updateCourt(locationId, courtId, data) {
  const ref = db.collection(LOCATIONS_COLLECTION).doc(locationId);
  const snap = await ref.get();

  if (!snap.exists) throw new Error('Location not found');

  const courts = (snap.data().courts || []).map((court) =>
    court.id === courtId ? { ...court, ...data } : court
  );

  await ref.update({
    courts,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return mapLocation(await ref.get());
}

export async function deleteCourt(locationId, courtId) {
  const ref = db.collection(LOCATIONS_COLLECTION).doc(locationId);
  const snap = await ref.get();

  if (!snap.exists) throw new Error('Location not found');

  const courts = (snap.data().courts || []).filter(
    (court) => court.id !== courtId
  );

  await ref.update({
    courts,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return mapLocation(await ref.get());
}