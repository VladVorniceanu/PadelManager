import express from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import {
  listUsersHandler,
  promoteUserToAdminHandler,

} from './users.controller.js';

const router = express.Router();

// GET /api/users  -> doar admin
router.get('/', authMiddleware, requireRole('admin'), listUsersHandler);

// POST /api/users/:uid/promote -> doar admin, promovează la admin
router.post('/:uid/promote', authMiddleware, requireRole('admin'), promoteUserToAdminHandler);

export default router;