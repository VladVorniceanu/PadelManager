// src/modules/auth/store/useAuthStore.js
import { defineStore } from 'pinia';
import { auth } from '../../../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { fetchCurrentUserProfile } from '../../../api/authApi';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    firebaseUser: null,
    profile: null,
    loading: true,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.firebaseUser,
    isAdmin: (state) => state.profile?.role === 'admin',
  },

  actions: {
    init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.firebaseUser = user;
          if (user) {
            try {
              this.profile = await fetchCurrentUserProfile();
            } catch (err) {
              console.error(err);
            }
          } else {
            this.profile = null;
          }
          this.loading = false;
          resolve();
        });
      });
    },

    async register(email, password) {
      this.error = null;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      this.firebaseUser = cred.user;
      this.profile = await fetchCurrentUserProfile();
    },

    async login(email, password) {
      this.error = null;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      this.firebaseUser = cred.user;
      this.profile = await fetchCurrentUserProfile();
    },

    async logout() {
      await signOut(auth);
      this.firebaseUser = null;
      this.profile = null;
    },
  },
});