import express from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { bootstrapUserFromToken } from '../users/users.service.js';

const router = express.Router();

router.post('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await bootstrapUserFromToken(req.user);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;