import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import config from './index';
import logger from './logger';

let firebaseInitialized = false;

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

    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK', { error });
    throw error;
  }
};

export const getAuth = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.auth();
};

export const getFirestore = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.firestore();
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
