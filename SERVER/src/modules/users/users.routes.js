import express from 'express';
import { getUsers, changeUserRole, searchUsers } from './users.controller.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/search', searchUsers);
router.get('/', getUsers, requireRole('admin'));
router.patch('/:id/role', changeUserRole, requireRole('admin'));

export default router;