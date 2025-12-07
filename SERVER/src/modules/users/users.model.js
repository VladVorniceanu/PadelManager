export const USERS_COLLECTION = 'users';

export function mapUser(doc) {
  if (!doc.exists) return null;

  const data = doc.data();

  return {
    id: doc.id,
    uid: data.uid || doc.id,
    email: data.email || '',
    displayName: data.displayName || '',
    role: data.role || 'player', // 'player' | 'admin'
    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
    updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
  };
}