import express from 'express';
import { getUsers, changeUserRole, searchUsersHandler } from './users.controller.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/search', searchUsersHandler);
router.get('/', requireRole('admin'), getUsers);
router.patch('/:id/role', requireRole('admin'), changeUserRole);

export default router;