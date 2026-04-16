import { listUsers, updateUserRole, searchUsers, updateUserProfileDetails, getUserProfile } from './users.service.js';
import { asyncHandler } from '../../core/http.js';
import { BadRequestError, ForbiddenError, NotFoundError, ValidationError } from '../../core/errors.js';

export const getUsers = asyncHandler(async (req, res) => {
  const users = await listUsers();
  res.json(users);
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (req.user?.uid === id) throw new ForbiddenError('Cannot modify own role');

  if (!role || !['player', 'admin'].includes(role)) {
    throw new ValidationError({ role: 'role must be one of: player, admin' });
  }

  const updated = await updateUserRole(id, role);
  res.json(updated);
});

export const getProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = id === 'me' ? req.user?.uid : id;

  if (!userId) throw new BadRequestError('User ID is required');

  const user = await getUserProfile(userId);
  if (!user) throw new NotFoundError('User not found');

  res.json(user);
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = id === 'me' ? req.user?.uid : id;

  if (!userId) throw new BadRequestError('User ID is required');
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new BadRequestError('No valid fields to update');
  }

  const updated = await updateUserProfileDetails(userId, req.body);
  if (!updated) throw new NotFoundError('User not found');

  res.json(updated);
});

export const searchUsersHandler = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  const limit = Math.max(1, Math.min(20, Number(req.query.limit || 10)));

  if (!query) return res.json([]);

  const items = await searchUsers(query, limit);
  res.json(items);
});
