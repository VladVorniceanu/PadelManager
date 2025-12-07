import { listUsers, updateUserRole } from './users.service.js';
export async function getUsers(req, res, next) {
  try {
    const users = await listUsers();
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
}

export async function changeUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['player', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rol invalid.' });
    }

    const updated = await updateUserRole(id, role);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function createTestUserHandler(req, res, next) {
  try {
    const user = await createTestUser();
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}