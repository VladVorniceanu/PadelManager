/**
 * Lightweight validation primitives.
 *
 * Each helper returns a string error message when the value is invalid,
 * or null when it's fine. Pass these directly to buildErrors():
 *
 *   import { requireString, optionalIsoDate, buildErrors } from '../../core/validation.js';
 *
 *   export function validateCreateReservationPayload(body) {
 *     return buildErrors({
 *       locationId: requireString('locationId', body.locationId),
 *       startAt:    requireIsoDate('startAt',    body.startAt),
 *     });
 *   }
 */

/** Field must be a non-empty string. */
export function requireString(field, value) {
  if (value == null || value === '') return `${field} is required`;
  if (typeof value !== 'string') return `${field} must be a string`;
  return null;
}

/** Field is optional but, when present, must be a string. */
export function optionalString(field, value) {
  if (value != null && typeof value !== 'string') return `${field} must be a string`;
  return null;
}

/** Field must be a valid ISO date string. */
export function requireIsoDate(field, value) {
  if (value == null || value === '') return `${field} is required`;
  if (typeof value !== 'string') return `${field} must be an ISO date string`;
  if (Number.isNaN(Date.parse(value))) return `${field} must be a valid ISO date`;
  return null;
}

/** Field is optional but, when present, must be a valid ISO date string. */
export function optionalIsoDate(field, value) {
  if (value == null) return null;
  if (typeof value !== 'string') return `${field} must be an ISO date string`;
  if (Number.isNaN(Date.parse(value))) return `${field} must be a valid ISO date`;
  return null;
}

/** Field is optional but, when present, must be one of the allowed choices. */
export function oneOf(field, value, choices) {
  if (value == null) return null;
  if (!choices.includes(value)) return `${field} must be one of: ${choices.join(', ')}`;
  return null;
}

/** Field is optional but, when present, must be a finite positive integer. */
export function positiveInt(field, value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    return `${field} must be a positive integer`;
  }
  return null;
}

/**
 * Compose primitive checks into a { ok, errors } result.
 *
 * Pass an object where each key is a field name and each value is the
 * string returned by a primitive (or null for "no error"):
 *
 *   buildErrors({
 *     name:       requireString('name', body.name),
 *     scheduledAt: optionalIsoDate('scheduledAt', body.scheduledAt),
 *   })
 */
export function buildErrors(checks) {
  const errors = {};
  for (const [field, msg] of Object.entries(checks)) {
    if (msg) errors[field] = msg;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
