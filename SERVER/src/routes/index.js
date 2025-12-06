import { Router } from 'express';
import usersRouter from '../modules/users/users.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/users', usersRouter);

export default router;