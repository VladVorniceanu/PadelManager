import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(err.message, err.stack);

  const status = err.status || 500;

  res.status(status).json({
    message: err.message || 'Internal server error',
    // în producție poți ascunde stack-ul
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}