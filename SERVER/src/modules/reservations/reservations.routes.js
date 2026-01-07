import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import {
  listReservationsHandler,
  createReservationHandler,
  deleteReservationHandler,
  getCourtAvailabilityHandler,
} from './reservations.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listReservationsHandler);
router.get('/availability', getCourtAvailabilityHandler);
router.post('/', createReservationHandler);
router.delete('/:id', deleteReservationHandler);

export default router;