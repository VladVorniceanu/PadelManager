import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import {
  listReservationsHandler,
  createReservationHandler,
  getCourtAvailabilityHandler,
} from './reservations.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listReservationsHandler);
router.get('/availability', getCourtAvailabilityHandler);
router.post('/', createReservationHandler);

export default router;