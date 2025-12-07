import { db } from '../../config/firebase.js';

const COLLECTION = 'users';

export async function list() {
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getByUid(uid) {
  const ref = db.collection(COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

export async function create(user) {
  const ref = db.collection(COLLECTION).doc(user.uid);
  await ref.set(user);
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function update(uid, data) {
  const ref = db.collection(COLLECTION).doc(uid);
  await ref.update(data);
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}