import * as service from './stats.service.js';

export async function myStatsHandler(req, res) {
  const uid = req.user.uid;
  const data = await service.getMyStats(uid);
  res.json({ data });
}