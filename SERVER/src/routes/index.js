// SERVER/src/routes/index.js
import express from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import locationsRoutes from '../modules/locations/locations.routes.js';
// import tournamentsRoutes from '../modules/tournaments/tournaments.routes.js';
// import matchesRoutes from '../modules/matches/matches.routes.js';
// import reservationsRoutes from '../modules/reservations/reservations.routes.js';
// import liveRoutes from '../modules/live/live.routes.js';
// import statsRoutes from '../modules/stats/stats.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/locations', locationsRoutes);
// router.use('/tournaments', tournamentsRoutes);
// router.use('/matches', matchesRoutes);
// router.use('/reservations', reservationsRoutes);
// router.use('/live', liveRoutes);
// router.use('/stats', statsRoutes);

export default router;