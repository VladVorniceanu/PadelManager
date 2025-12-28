import { validateLivePayload } from './live.model.js';
import * as service from './live.service.js';

export async function getLiveHandler(req, res) {
  const live = await service.getLiveByMatchId(req.params.matchId);
  if (!live) return res.status(404).json({ message: 'Live state not found' });
  res.json({ data: live });
}

export async function upsertLiveHandler(req, res) {
  const check = validateLivePayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const updated = await service.upsertLive(req.body, req.user);
  return res.status(200).json(updated);
}