import express from 'express';
import { getUsers, changeUserRole, searchUsersHandler, getProfile, updateUserProfile } from './users.controller.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole, requireSameUser } from '../../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/search', searchUsersHandler);
router.get('/', requireRole('admin'), getUsers);
router.get('/profile/:id', requireSameUser, getProfile);
router.patch('/:id/role', requireRole('admin'), changeUserRole);
router.patch('/:id', requireSameUser, updateUserProfile);

export default router;