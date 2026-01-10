import { listUsers, updateUserRole, searchUsers, updateUserProfileDetails } from './users.service.js';
export async function getUsers(req, res, next) {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function changeUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (req.user?.uid === id) {
      return res.status(403).json({ message: 'Cannot modify own role' });
    }

    if (!role || !['player', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const updated = await updateUserRole(id, role);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { displayName, email } = req.body;

    if (req.user?.uid !== id) {
      return res.status(403).json({ message: 'Cannot change another user\'s profile' });
    }

    if (!displayName && !email) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updated = await updateUserProfileDetails(id, { displayName, email });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function searchUsersHandler(req, res) {
  const query = String(req.query.q || '').trim();
  const limit = Math.max(1, Math.min(20, Number(req.query.limit || 10)));

  if (!query) return res.json([]);

  try {
    const items = await searchUsers(query, limit);
    return res.json(items);
  } catch (error) {
    console.error('searchUsers error', error);
    return res.status(500).json({ message: 'Failed to search users' });
  }
}