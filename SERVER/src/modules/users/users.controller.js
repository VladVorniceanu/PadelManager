import { listUsers, updateUserRole, searchUsers, updateUserProfileDetails, getUserProfile } from './users.service.js';
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

export async function getProfile(req, res, next) {
  try {
    const { id } = req.params;
    const userId = id === 'me' ? req.user?.uid : id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
      const user = await getUserProfile(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const userId = id === 'me' ? req.user?.uid : id;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updated = await updateUserProfileDetails(userId, req.body);
    if (!updated) return res.status(404).json({ message: 'User not found' });

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