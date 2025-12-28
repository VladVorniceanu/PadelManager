export const MATCHES_COLLECTION = 'matches';

/**
 * Expected shape in Firestore:
 * {
 *   createdBy: uid,
 *   tournamentId?: string | null,
 *   locationId?: string | null,
 *   courtId?: string | null,
 *   scheduledAt?: Timestamp | null,
 *   status: 'draft' | 'scheduled' | 'completed' | 'cancelled',
 *   teams: { team1: [uid|null, uid|null], team2: [uid|null, uid|null] },
 *   score?: { sets: Array<{ t1: number, t2: number }> } | null,
 *   winnerTeam?: 1 | 2 | null,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */

export function mapMatch(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    createdBy: data.createdBy,
    tournamentId: data.tournamentId ?? null,
    locationId: data.locationId ?? null,
    courtId: data.courtId ?? null,
    scheduledAt: data.scheduledAt?.toDate?.() ?? null,
    status: data.status ?? 'draft',
    teams: data.teams ?? { team1: [null, null], team2: [null, null] },
    score: data.score ?? null,
    winnerTeam: data.winnerTeam ?? null,
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  };
}

/**
 * Minimal validation (keep it simple; expand later).
 */
export function validateCreateMatchPayload(body) {
  const errors = {};

  if (body.locationId != null && typeof body.locationId !== 'string') errors.locationId = 'locationId must be string';
  if (body.courtId != null && typeof body.courtId !== 'string') errors.courtId = 'courtId must be string';
  if (body.tournamentId != null && typeof body.tournamentId !== 'string') errors.tournamentId = 'tournamentId must be string';

  if (body.scheduledAt != null && typeof body.scheduledAt !== 'string') {
    errors.scheduledAt = 'scheduledAt must be ISO string';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateUpdateMatchPayload(body) {
  const errors = {};

  if (body.status != null) {
    const allowed = ['draft', 'scheduled', 'completed', 'cancelled'];
    if (!allowed.includes(body.status)) errors.status = `status must be one of ${allowed.join(', ')}`;
  }

  // teams patch
  if (body.teams != null) {
    const t = body.teams;
    if (typeof t !== 'object') errors.teams = 'teams must be object';
    else {
      for (const k of ['team1', 'team2']) {
        if (t[k] != null) {
          if (!Array.isArray(t[k]) || t[k].length !== 2) errors[k] = `${k} must be array of length 2`;
        }
      }
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function extractParticipants(match) {
  const team1 = match?.teams?.team1 ?? [];
  const team2 = match?.teams?.team2 ?? [];
  return [...team1, ...team2].filter(Boolean);
}