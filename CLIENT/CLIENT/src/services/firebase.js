import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: "padelmanager-web.firebasestorage.app",
  messagingSenderId: "26382989508",
  appId: "1:26382989508:web:8f18d3ac2ab3998f2bf191",
  measurementId: "G-87FWLF9QK9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);