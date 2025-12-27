import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

import {
  listLocationsHandler,
  getLocationHandler,
  createLocationHandler,
  updateLocationHandler,
  deleteLocationHandler,
  // addCourtHandler,
  // updateCourtHandler,
  // deleteCourtHandler,
} from './locations.controller.js';

const router = Router();

/**
 * PUBLIC (read-only)
 */
router.get('/', listLocationsHandler);
router.get('/:id', getLocationHandler);

/**
 * ADMIN (write)
 */
router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  createLocationHandler
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  updateLocationHandler
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  deleteLocationHandler
);

// /**
//  * COURTS (nested resource, admin only)
//  */
// router.post(
//   '/:id/courts',
//   authMiddleware,
//   requireRole('admin'),
//   addCourtHandler
// );

// router.patch(
//   '/:id/courts/:courtId',
//   authMiddleware,
//   requireRole('admin'),
//   updateCourtHandler
// );

// router.delete(
//   '/:id/courts/:courtId',
//   authMiddleware,
//   requireRole('admin'),
//   deleteCourtHandler
// );

export default router;