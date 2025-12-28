import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import {
  listMatchesHandler,
  getMatchHandler,
  createMatchHandler,
  updateMatchHandler,
  deleteMatchHandler,
} from './matches.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listMatchesHandler);
router.get('/:id', getMatchHandler);
router.post('/', createMatchHandler);
router.patch('/:id', updateMatchHandler);
router.delete('/:id', deleteMatchHandler);

export default router;