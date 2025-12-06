import { Router } from 'express';
import usersRouter from '../modules/users/users.routes.js';
import locationsRouter from '../modules/locations/locations.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/users', usersRouter);
router.use('/locations', locationsRouter);

export default router;