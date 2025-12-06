import { createRouter, createWebHistory } from 'vue-router';

import AdminDashboardView from '../modules/admin/views/AdminDashboardView.vue';
import AdminLocationsView from '../modules/admin/views/AdminLocationsView.vue';
import LoginView from '../modules/auth/views/LoginView.vue';
import RegisterView from '../modules/auth/views/RegisterView.vue';
import FriendlyListView from '../modules/friendlyMatches/views/FriendlyListView.vue';
import FriendlyCreateView from '../modules/friendlyMatches/views/FriendlyCreateView.vue';
import ProfileView from '../modules/profile/views/ProfileView.vue';
import TournamentListView from '../modules/tournaments/views/TournamentListView.vue';
import TournamentCreateWizard from '../modules/tournaments/views/TournamentCreateWizard.vue';
import LiveRefereeView from '../modules/live/views/LiveRefereeView.vue';
import LiveSpectatorView from '../modules/live/views/LiveSpectatorView.vue';
import LocationsListView from '../modules/locations/views/LocationsListView.vue';
import LocationDetailsView from '../modules/locations/views/LocationDetailsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // public / auth
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },

    // profile
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },

    // friendly matches
    {
      path: '/friendly',
      name: 'friendly-list',
      component: FriendlyListView,
    },
    {
      path: '/friendly/create',
      name: 'friendly-create',
      component: FriendlyCreateView,
    },

    // tournaments
    {
      path: '/tournaments',
      name: 'tournaments-list',
      component: TournamentListView,
    },
    {
      path: '/tournaments/create',
      name: 'tournaments-create',
      component: TournamentCreateWizard,
    },

    // live
    {
      path: '/live/referee/:matchId',
      name: 'live-referee',
      component: LiveRefereeView,
      props: true,
    },
    {
      path: '/live/spectator/:matchId',
      name: 'live-spectator',
      component: LiveSpectatorView,
      props: true,
    },

    // locations (public / player)
    {
      path: '/locations',
      name: 'locations-list',
      component: LocationsListView,
    },
      {
      path: '/locations/:id',
      name: 'location-details',
      component: LocationDetailsView,
      props: true,
    },

    // admin
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView,
    },
    {
      path: '/admin/locations',
      name: 'admin-locations',
      component: AdminLocationsView,
    },

    // default redirect
    {
      path: '/',
      redirect: '/admin',
    },
  ],
});

export default router;