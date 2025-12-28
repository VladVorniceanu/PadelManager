import { db } from '../../config/firebase.js';
import { MATCHES_COLLECTION } from '../matches/matches.model.js';

function inc(map, key, by = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + by);
}

function topKey(map) {
  let best = null;
  let bestVal = -1;
  for (const [k, v] of map.entries()) {
    if (v > bestVal) { bestVal = v; best = k; }
  }
  return best ? { key: best, count: bestVal } : null;
}

export async function getMyStats(uid) {
  // v1: fetch recent matches and compute. Later optimize by storing `participants` array.
  const snap = await db.collection(MATCHES_COLLECTION).orderBy('updatedAt', 'desc').limit(500).get();

  const teammateCounts = new Map();
  const opponentCounts = new Map();
  const locationCounts = new Map();

  let games = 0;
  let wins = 0;
  let losses = 0;

  for (const doc of snap.docs) {
    const m = doc.data();
    const teams = m.teams || { team1: [], team2: [] };
    const t1 = teams.team1 || [];
    const t2 = teams.team2 || [];

    const inT1 = t1.includes(uid);
    const inT2 = t2.includes(uid);
    if (!inT1 && !inT2) continue;

    games += 1;

    // location
    if (m.locationId) inc(locationCounts, m.locationId);

    // teammates/opponents
    const myTeam = inT1 ? t1 : t2;
    const oppTeam = inT1 ? t2 : t1;

    for (const p of myTeam) if (p && p !== uid) inc(teammateCounts, p);
    for (const p of oppTeam) if (p) inc(opponentCounts, p);

    // W/L only if completed
    if (m.status === 'completed' && (m.winnerTeam === 1 || m.winnerTeam === 2)) {
      const iWon = (inT1 && m.winnerTeam === 1) || (inT2 && m.winnerTeam === 2);
      if (iWon) wins += 1;
      else losses += 1;
    }
  }

  return {
    uid,
    gamesPlayed: games,
    wins,
    losses,
    mostFrequentTeammate: topKey(teammateCounts),   // {key: uid, count}
    mostFrequentOpponent: topKey(opponentCounts),
    mostPlayedLocation: topKey(locationCounts),     // {key: locationId, count}
    updatedAt: new Date(),
  };
}