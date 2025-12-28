import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import {
  getLiveHandler,
  upsertLiveHandler,
} from './live.controller.js';

const router = Router();

// GET /api/live/:matchId
router.get('/:matchId', authMiddleware, getLiveHandler);

// PUT /api/live (upsert by matchId in body)
router.put('/', authMiddleware, upsertLiveHandler);

export default router;