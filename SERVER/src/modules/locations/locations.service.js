import admin from 'firebase-admin';
import { getFirestore } from '../../config/firebase.js';
import { LOCATIONS_COLLECTION, mapLocation } from './locations.model.js';

const db = getFirestore();

export async function listLocations() {
  const snapshot = await db.collection(LOCATIONS_COLLECTION).get();
  return snapshot.docs.map(mapLocation);
}

export async function getLocation(id) {
  const doc = await db.collection(LOCATIONS_COLLECTION).doc(id).get();
  return mapLocation(doc);
}

export async function createLocation({ name, address, city, courts }) {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const ref = await db.collection(LOCATIONS_COLLECTION).add({
    name,
    address,
    city,
    courts: courts || [],
    createdAt: now,
    updatedAt: now,
    isActive: true
  });

  const doc = await ref.get();
  return mapLocation(doc);
}

export async function updateLocation(id, data) {
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection(LOCATIONS_COLLECTION).doc(id).update({
    ...data,
    updatedAt: now
  });

  const doc = await db.collection(LOCATIONS_COLLECTION).doc(id).get();
  return mapLocation(doc);
}

export async function deleteLocation(id) {
  await db.collection(LOCATIONS_COLLECTION).doc(id).delete();
  return { success: true };
}