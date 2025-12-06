import { Router } from 'express';
import { listUsersHandler, createTestUserHandler } from './users.controller.js';

const router = Router();

router.get('/', listUsersHandler);
router.post('/test', createTestUserHandler);

export default router;