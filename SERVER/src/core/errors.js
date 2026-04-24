/**
 * Base application error. All thrown errors in services/controllers should
 * extend this so errorHandler can distinguish expected errors from surprises.
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode; // backward compat with existing err.status reads
  }
}

/** 400 — malformed input that doesn't fit the validation shape */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/**
 * 400 — failed field-level validation.
 * Carries an `errors` object ({ field: message }) so clients get granular feedback.
 */
export class ValidationError extends AppError {
  constructor(errors, message = 'Validation error') {
    super(message, 400);
    this.errors = errors;
  }
}

/** 403 — authenticated but not allowed */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/** 404 — resource does not exist */
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

/** 409 — request conflicts with existing state (e.g. double-booking) */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}
