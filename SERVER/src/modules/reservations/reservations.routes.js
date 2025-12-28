import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import {
  listReservationsHandler,
  createReservationHandler,
  deleteReservationHandler,
} from './reservations.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listReservationsHandler);
router.post('/', createReservationHandler);
router.delete('/:id', deleteReservationHandler);

export default router;