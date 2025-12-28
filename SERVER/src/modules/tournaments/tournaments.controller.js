import { validateTournamentPayload } from './tournaments.model.js';
import * as service from './tournaments.service.js';

export async function listTournamentsHandler(req, res) {
  const data = await service.listTournaments();
  res.json({ data });
}

export async function getTournamentHandler(req, res) {
  const t = await service.getTournamentById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Tournament not found' });
  res.json({ data: t });
}

export async function createTournamentHandler(req, res) {
  const check = validateTournamentPayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const created = await service.createTournament(check.data, req.user);
  res.status(201).json({ data: created });
}

export async function updateTournamentHandler(req, res) {
  const check = validateTournamentPayload(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation error', errors: check.errors });

  const updated = await service.updateTournament(req.params.id, check.data);
  res.json({ data: updated });
}

export async function deleteTournamentHandler(req, res) {
  await service.deleteTournament(req.params.id);
  res.status(204).end();
}