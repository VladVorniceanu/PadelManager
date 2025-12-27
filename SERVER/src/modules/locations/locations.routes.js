import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

import {
  listLocationsHandler,
  getLocationHandler,
  createLocationHandler,
  updateLocationHandler,
  deleteLocationHandler
} from './locations.controller.js';

const router = Router();

// public
router.get('/', listLocationsHandler);
router.get('/:id', getLocationHandler);

// admin only
router.post('/', authMiddleware, requireRole('admin'), createLocationHandler);
router.put('/:id', authMiddleware, requireRole('admin'), updateLocationHandler);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteLocationHandler);

export default router;