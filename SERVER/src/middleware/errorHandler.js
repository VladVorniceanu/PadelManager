import { logger } from '../config/logger.js';
import { AppError, ValidationError } from '../core/errors.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    // Expected application errors (4xx) are not bugs — log only 5xx.
    if (err.statusCode >= 500) {
      logger.error(err.message, err.stack);
    }

    const body = { message: err.message };
    if (err instanceof ValidationError && err.errors) {
      body.errors = err.errors;
    }

    return res.status(err.statusCode).json(body);
  }

  // Unexpected errors — always log with full stack.
  logger.error(err.message, err.stack);

  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
