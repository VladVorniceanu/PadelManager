import * as usersModel from './users.model.js';

export async function listUsers() {
  return usersModel.list();
}

export async function createTestUser() {
  const user = {
    uid: 'test-' + Date.now(),
    email: `test-${Date.now()}@example.com`,
    displayName: 'Test User',
    role: 'player',
    createdAt: new Date().toISOString(),
  };

  return usersModel.create(user);
}

export async function bootstrapUserFromToken(tokenUser) {
  let user = await usersModel.getByUid(tokenUser.uid);

  if (!user) {
    user = await usersModel.create({
      uid: tokenUser.uid,
      email: tokenUser.email,
      displayName: tokenUser.name || '',
      role: 'player', // implicit jucător
      createdAt: new Date().toISOString(),
    });
  }

  return user;
}

export async function promoteToAdmin(uid) {
  return usersModel.update(uid, { role: 'admin' });
}