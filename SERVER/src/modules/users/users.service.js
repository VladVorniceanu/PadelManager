import { admin, db } from '../../config/firebase.js';
import { USERS_COLLECTION, mapUser } from './users.model.js';

export async function bootstrapUserFromToken({ uid, email, name }) {
  const ref = db.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();

  const now = admin.firestore.FieldValue.serverTimestamp();

  if (!snap.exists) {
    const userData = {
      uid,
      email: email || '',
      displayName: name || '',
      role: 'player', // default
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(userData);
    const newSnap = await ref.get();
    return mapUser(newSnap);
  }

  await ref.update({
    email: email || '',
    displayName: name || '',
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

  const updateData = {
    ...details,
    updatedAt: new Date().toISOString(),
  };

  await ref.update(updateData);

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