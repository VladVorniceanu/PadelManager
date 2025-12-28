import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { myStatsHandler } from './stats.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/me', myStatsHandler);

export default router;