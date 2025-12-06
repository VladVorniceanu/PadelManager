import { Router } from 'express';

const router = Router();

// Health check - pentru test inițial
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// aici vom monta ulterior routerele:
// import authRouter from '../modules/auth/auth.routes.js';
// router.use('/auth', authRouter);
// etc.

export default router;