import { listUsers, promoteToAdmin, createTestUser } from './users.service.js';

export async function listUsersHandler(req, res, next) {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

// opțional, pentru debug / test
export async function createTestUserHandler(req, res, next) {
  try {
    const user = await createTestUser();
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function promoteUserToAdminHandler(req, res, next) {
  try {
    const { uid } = req.params;
    const user = await promoteToAdmin(uid);
    res.json(user);
  } catch (err) {
    next(err);
  }
}