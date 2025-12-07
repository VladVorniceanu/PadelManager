import express from 'express';
import { getUsers, changeUserRole } from './users.controller.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/', getUsers);                 // GET /api/users
router.patch('/:id/role', changeUserRole); // PATCH /api/users/:id/role

export default router;