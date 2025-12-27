import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

import {
  listLocationsHandler,
  getLocationHandler,
  createLocationHandler,
  updateLocationHandler,
  deleteLocationHandler,
  addCourtHandler,
  updateCourtHandler,
  deleteCourtHandler,
} from './locations.controller.js';

const router = Router();

// Public read
router.get('/', listLocationsHandler);
router.get('/:id', getLocationHandler);

// Admin write
router.post('/', authMiddleware, requireRole('admin'), createLocationHandler);
router.put('/:id', authMiddleware, requireRole('admin'), updateLocationHandler);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteLocationHandler);

// Courts (admin only)
router.post('/:id/courts', authMiddleware, requireRole('admin'), addCourtHandler);
router.put('/:id/courts/:courtId', authMiddleware, requireRole('admin'), updateCourtHandler);
router.delete('/:id/courts/:courtId', authMiddleware, requireRole('admin'), deleteCourtHandler);

export default router;