import * as service from './matches.service.js';
import { validateCreateMatchPayload, validateUpdateMatchPayload, extractParticipants } from './matches.model.js';
import { asyncHandler } from '../../core/http.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../core/errors.js';

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function canMutateMatch(req, match) {
  if (!match) return false;
  if (isAdmin(req)) return true;
  const uid = req.user?.uid;
  if (!uid) return false;
  if (match.createdBy === uid) return true;
  const parts = extractParticipants(match);
  return parts.includes(uid);
}

export const listMatchesHandler = asyncHandler(async (req, res) => {
  const uid = req.user.uid;
  const items = await service.listMatchesForUser(uid);
  res.json(items);
});

export const getMatchHandler = asyncHandler(async (req, res) => {
  const match = await service.getMatchById(req.params.id);
  if (!match) throw new NotFoundError('Match not found');

  if (!isAdmin(req)) {
    const uid = req.user.uid;
    const parts = extractParticipants(match);
    if (match.createdBy !== uid && !parts.includes(uid)) {
      throw new ForbiddenError();
    }
  }

  res.json(match);
});

export const countMatchesHandler = asyncHandler(async (req, res) => {
  const status = req.params.status;
  const count = status
    ? await service.countMatchesByStatus(status)
    : await service.countAllMatches();

  res.json({ count });
});

export const createMatchHandler = asyncHandler(async (req, res) => {
  const check = validateCreateMatchPayload(req.body);
  if (!check.ok) throw new ValidationError(check.errors);

  const created = await service.createMatch({ uid: req.user.uid, payload: req.body });
  res.status(201).json(created);
});

export const updateMatchHandler = asyncHandler(async (req, res) => {
  const check = validateUpdateMatchPayload(req.body);
  if (!check.ok) throw new ValidationError(check.errors);

  const match = await service.getMatchById(req.params.id);
  if (!match) throw new NotFoundError('Match not found');
  if (!canMutateMatch(req, match)) throw new ForbiddenError();

  const updated = await service.updateMatch(req.params.id, req.body);
  res.json(updated);
});

export const deleteMatchHandler = asyncHandler(async (req, res) => {
  const match = await service.getMatchById(req.params.id);
  if (!match) throw new NotFoundError('Match not found');
  if (!canMutateMatch(req, match)) throw new ForbiddenError();

  await service.deleteMatch(req.params.id);
  res.status(204).end();
});
