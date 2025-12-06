// SERVER/src/config/firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { env } from './env.js';
import { logger } from './logger.js';

let app;
let db;

function initFirebase() {
  if (app && db) {
    return { app, db };
  }

  try {
    // Path către fișierul JSON, relativ la folderul SERVER
    const serviceAccountPath = resolve(
      process.cwd(),
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
    );

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    db = admin.firestore();

    logger.info('✅ Firebase initialized successfully');

    return { app, db };
  } catch (err) {
    logger.error('❌ Failed to initialize Firebase:', err.message);
    throw err;
  }
}

export function getFirestore() {
  if (!db) {
    initFirebase();
  }
  return db;
}