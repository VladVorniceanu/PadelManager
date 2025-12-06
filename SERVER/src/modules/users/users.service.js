import { getFirestore } from '../../config/firebase.js';

const db = getFirestore();
const USERS_COLLECTION = 'users';

export async function listUsers() {
  const snapshot = await db.collection(USERS_COLLECTION).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createTestUser() {
  const ref = await db.collection(USERS_COLLECTION).add({
    displayName: 'Test User',
    email: 'test@example.com',
    role: 'player',
    createdAt: new Date()
  });

  const doc = await ref.get();
  return { id: doc.id, ...doc.data() };
}