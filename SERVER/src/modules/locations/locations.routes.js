import { Router } from 'express';
import {
  listLocationsHandler,
  getLocationHandler,
  createLocationHandler,
  updateLocationHandler,
  deleteLocationHandler
} from './locations.controller.js';

const router = Router();

// GET /api/locations
router.get('/', listLocationsHandler);

// GET /api/locations/:id
router.get('/:id', getLocationHandler);

// POST /api/locations
router.post('/', createLocationHandler);

// PUT /api/locations/:id
router.put('/:id', updateLocationHandler);

// DELETE /api/locations/:id
router.delete('/:id', deleteLocationHandler);

export default router;