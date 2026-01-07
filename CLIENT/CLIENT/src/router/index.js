import { createRouter, createWebHistory } from 'vue-router';

import AdminDashboardView from '../modules/admin/views/AdminDashboardView.vue';
import LoginView from '../modules/auth/views/LoginView.vue';
import RegisterView from '../modules/auth/views/RegisterView.vue';
import FriendlyListView from '../modules/matches/views/MatchesListView.vue';
import BookMatchModal from '../modules/matches/components/BookMatchModal.vue';
import ProfileView from '../modules/profile/views/ProfileView.vue';
import TournamentListView from '../modules/tournaments/views/TournamentListView.vue';
import TournamentCreateWizard from '../modules/tournaments/views/TournamentCreateWizard.vue';
import LiveRefereeView from '../modules/live/views/LiveRefereeView.vue';
import LiveSpectatorView from '../modules/live/views/LiveSpectatorView.vue';
import LocationsListView from '../modules/locations/views/LocationsListView.vue';
import LocationDetailsView from '../modules/locations/views/LocationDetailsView.vue';
import HomeView from '../modules/home/views/HomeView.vue';

import { useAuthStore } from '../modules/auth/store/useAuthStore';

const routes = [
  // Auth (public)
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true },
  },

  // Home (decide din guard unde merge)
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },

  // Locations (public)
  {
    path: '/locations',
    name: 'locations-list',
    component: LocationsListView,
    children: [
      {
        path: ':id',
        name: 'location-details',
        component: LocationDetailsView,
        props: true,
      },
    ],
  },

  // Profile (auth)
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },

  // Friendly matches (auth)
  {
    path: '/friendly',
    name: 'friendly-list',
    component: FriendlyListView,
    meta: { requiresAuth: true },
  },
  {
    path: '/friendly/create',
    name: 'friendly-create',
    component: BookMatchModal,
    meta: { requiresAuth: true },
  },

  // Tournaments (auth)
  {
    path: '/tournaments',
    name: 'tournaments-list',
    component: TournamentListView,
    meta: { requiresAuth: true },
  },
  {
    path: '/tournaments/create',
    name: 'tournaments-create',
    component: TournamentCreateWizard,
    meta: { requiresAuth: true },
  },

  // Live (referee needs admin; spectator can be public or auth - alegi tu)
  {
    path: '/live/referee/:matchId',
    name: 'live-referee',
    component: LiveRefereeView,
    props: true,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/live/spectator/:matchId',
    name: 'live-spectator',
    component: LiveSpectatorView,
    props: true,
    // dacă vrei doar logați: meta: { requiresAuth: true }
  },

  // Admin (admin only)
  {
    path: '/admin',
    name: 'admin',
    component: AdminDashboardView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  // 404 fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (authStore.loading) {
    await authStore.init();
  }

  const ok = await authStore.enforceSessionMaxAge();
  if (!ok) {
    return { name: 'login', query: { reason: 'session-expired' } };
  }

  // Guest-only pages (login/register)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return authStore.isAdmin ? { name: 'admin' } : { name: 'home' };
  }

  // Auth required
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  // Admin required
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'profile' };
  }

  return true;
});

export default router;