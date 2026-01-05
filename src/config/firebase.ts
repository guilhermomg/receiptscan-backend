import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import config from './index';
import logger from './logger';
import type { Firestore } from 'firebase-admin/firestore';

let firebaseInitialized = false;
let firestoreInstance: Firestore | null = null;

export const initializeFirebase = (): void => {
  if (firebaseInitialized) {
    logger.warn('Firebase already initialized');
    return;
  }

  try {
    if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
      logger.warn('Firebase credentials not configured, authentication will not work');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
      storageBucket: config.firebase.storageBucket,
    });

    firestoreInstance = admin.firestore();
    firestoreInstance.settings({
      ignoreUndefinedProperties: true,
    });

    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK', { error });
    logger.warn('Continuing without Firebase - authentication and storage will not work');
    // Don't throw - allow server to start for testing Swagger docs
  }
};

export const getAuth = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.auth();
};

export const getFirestore = () => {
  if (!firebaseInitialized || !firestoreInstance) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return firestoreInstance;
};

export const getStorage = (): Storage => {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return new Storage({
    projectId: config.firebase.projectId,
    credentials: {
      client_email: config.firebase.clientEmail,
      private_key: config.firebase.privateKey,
    },
  });
};

export default admin;
