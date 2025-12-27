import { defineStore } from 'pinia';
import { auth } from '../../../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { fetchCurrentUserProfile } from '../../../api/authApi';

const SESSION_STARTED_KEY = 'pm_session_started_at';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function getSessionStartedAt() {
  const raw = localStorage.getItem(SESSION_STARTED_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function setSessionStartedNow() {
  localStorage.setItem(SESSION_STARTED_KEY, String(nowMs()));
}

function clearSessionStartedAt() {
  localStorage.removeItem(SESSION_STARTED_KEY);
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    firebaseUser: null,
    profile: null,
    loading: true,
    error: null,

    // prevent multiple listeners
    _initPromise: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.firebaseUser,
    isAdmin: (state) => state.profile?.role === 'admin',

    // useful for UI
    displayName: (state) => state.firebaseUser?.displayName || state.profile?.displayName || 'User',
    email: (state) => state.firebaseUser?.email || '',
  },

  actions: {
    // Call this from router guard (and/or from init flow)
    async enforceSessionMaxAge() {
      if (!this.firebaseUser) return true;

      const startedAt = getSessionStartedAt();

      // if missing (e.g. first login after you introduced this feature), set it now
      if (!startedAt) {
        setSessionStartedNow();
        return true;
      }

      const age = nowMs() - startedAt;
      if (age > THIRTY_DAYS_MS) {
        await this.logout();
        // returning false signals "session expired"
        return false;
      }

      return true;
    },

    init() {
      if (this._initPromise) return this._initPromise;

      this._initPromise = new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.firebaseUser = user;

          if (user) {
            // ensure session clock exists
            if (!getSessionStartedAt()) setSessionStartedNow();

            // enforce 30 days right away (e.g. after refresh)
            const ok = await this.enforceSessionMaxAge();
            if (!ok) {
              this.loading = false;
              resolve();
              return;
            }

            try {
              this.profile = await fetchCurrentUserProfile();
            } catch (err) {
              console.error('Failed to fetch profile:', err);
              this.profile = null;
            }
          } else {
            this.profile = null;
            clearSessionStartedAt();
          }

          this.loading = false;
          resolve();
        });
      });

      return this._initPromise;
    },

    async register(email, password) {
      this.error = null;
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // mark session start explicitly
      setSessionStartedNow();

      this.firebaseUser = cred.user;
      this.profile = await fetchCurrentUserProfile();
    },

    async login(email, password) {
      this.error = null;
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // mark session start explicitly
      setSessionStartedNow();

      this.firebaseUser = cred.user;
      this.profile = await fetchCurrentUserProfile();
    },

    async logout() {
      try {
        await signOut(auth);
      } finally {
        this.firebaseUser = null;
        this.profile = null;
        this.error = null;
        clearSessionStartedAt();
      }
    },
  },
});