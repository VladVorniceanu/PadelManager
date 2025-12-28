import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import {
  listTournamentsHandler,
  getTournamentHandler,
  createTournamentHandler,
  updateTournamentHandler,
  deleteTournamentHandler,
} from './tournaments.controller.js';

const router = Router();

// auth required (player/admin)
router.use(authMiddleware);

router.get('/', listTournamentsHandler);
router.get('/:id', getTournamentHandler);

// admin only
router.post('/', requireRole('admin'), createTournamentHandler);
router.put('/:id', requireRole('admin'), updateTournamentHandler);
router.delete('/:id', requireRole('admin'), deleteTournamentHandler);

export default router;