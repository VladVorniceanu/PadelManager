import * as service from './matches.service.js';
import { validateCreateMatchPayload, validateUpdateMatchPayload, extractParticipants } from './matches.model.js';

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
  return parts.includes(uid); // allow participants to update/delete their match if you want
}

export async function listMatchesHandler(req, res) {
  const uid = req.user.uid;
  const items = isAdmin(req)
    ? await service.listAllMatchesAdmin()
    : await service.listMatchesForUser(uid);

  res.json({ data: items });
}

export async function getMatchHandler(req, res) {
  const match = await service.getMatchById(req.params.id);
  if (!match) return res.status(404).json({ message: 'Match not found' });

  // non-admin can see only if participant/creator
  if (!isAdmin(req)) {
    const uid = req.user.uid;
    const parts = extractParticipants(match);
    if (match.createdBy !== uid && !parts.includes(uid)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  res.json({ data: match });
}

export async function createMatchHandler(req, res) {
  const check = validateCreateMatchPayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const created = await service.createMatch({ uid: req.user.uid, payload: req.body });
  res.status(201).json({ data: created });
}

export async function updateMatchHandler(req, res) {
  const check = validateUpdateMatchPayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const match = await service.getMatchById(req.params.id);
  if (!match) return res.status(404).json({ message: 'Match not found' });
  if (!canMutateMatch(req, match)) return res.status(403).json({ message: 'Forbidden' });

  const updated = await service.updateMatch(req.params.id, req.body);
  res.json({ data: updated });
}

export async function deleteMatchHandler(req, res) {
  const match = await service.getMatchById(req.params.id);
  if (!match) return res.status(404).json({ message: 'Match not found' });
  if (!canMutateMatch(req, match)) return res.status(403).json({ message: 'Forbidden' });

  await service.deleteMatch(req.params.id);
  res.status(204).end();
}