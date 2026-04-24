/**
 * Wraps an async Express route handler so that any unhandled rejection is
 * forwarded to Express's next() error handler automatically.
 *
 * Express 4 does not catch async errors natively — without this wrapper,
 * a thrown error or rejected promise in an async handler is an unhandled
 * rejection that crashes Node 20+.
 *
 * Usage:
 *   import { asyncHandler } from '../../core/http.js';
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
