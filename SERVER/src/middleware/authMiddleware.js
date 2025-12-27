import { auth } from '../config/firebase.js';
import { bootstrapUserFromToken } from '../modules/users/users.service.js';

export default async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const decoded = await auth.verifyIdToken(token);

    const user = await bootstrapUserFromToken({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || '',
    });

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}