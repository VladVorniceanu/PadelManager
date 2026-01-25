import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import {
  listMatchesHandler,
  getMatchHandler,
  createMatchHandler,
  updateMatchHandler,
  deleteMatchHandler,
  countMatchesHandler,
} from './matches.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listMatchesHandler);
router.post('/', createMatchHandler);
router.get('/count/:status?', countMatchesHandler);
router.get('/:id', getMatchHandler);
router.patch('/:id', updateMatchHandler);
router.delete('/:id', deleteMatchHandler);


export default router;