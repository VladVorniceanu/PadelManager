import { admin, db } from '../../config/firebase.js';
import { USERS_COLLECTION, mapUser } from './users.model.js';
import { logger } from '../../config/logger.js';

export async function bootstrapUserFromToken({ uid, email, name }) {
  const ref = db.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();

  const now = admin.firestore.FieldValue.serverTimestamp();

  if (!snap.exists) {
    const userData = {
      uid,
      email: email || '',
      displayName: name || '',
      role: 'player',
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(userData);
    const newSnap = await ref.get();
    return mapUser(newSnap);
  }

  const existing = snap.data();

  await ref.update({
    email: email || '',
    displayName: existing?.displayName ? existing.displayName : (name || ''),
    updatedAt: now,
  });

  const updatedSnap = await ref.get();
  return mapUser(updatedSnap);
}

export async function listUsers() {
  const snap = await db.collection(USERS_COLLECTION).get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getUserProfile(userId) {
  const ref = db.collection(USERS_COLLECTION).doc(userId);
  const snap = await ref.get();

  if (!snap.exists) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  };
}

export async function updateUserRole(userId, role) {
  const ref = db.collection(USERS_COLLECTION).doc(userId);

  await ref.update({
    role,
    updatedAt: new Date().toISOString(),
  });

  const updated = await ref.get();
  return {
    id: updated.id,
    ...updated.data(),
  };
}

export async function updateUserProfileDetails(userId, details) {
  const ref = db.collection(USERS_COLLECTION).doc(userId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const allowed = [
    'profilePicUrl',
    'displayName',
    'preferredSide',
    'playingLevel',
    'preferredPosition',
    'preferredTime',
  ];

  const next = {};
  for (const k of allowed) {
    if (details[k] !== undefined) next[k] = details[k];
  }

  // normalizări simple (opțional)
  if (typeof next.displayName === 'string') next.displayName = next.displayName.trim();
  if (typeof next.profilePicUrl === 'string') next.profilePicUrl = next.profilePicUrl.trim();

  await ref.update({
    ...next,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();
  return {
    id: updated.id,
    ...updated.data(),
  };
}

export async function searchUsers(query, limit=10) {
  const snap = await db.collection(USERS_COLLECTION)
    .where('displayName', '>=', query)
    .where('displayName', '<=', query + '\uf8ff')
    .limit(limit)
    .get();

  return snap.docs.map((doc) => mapUser(doc));
}