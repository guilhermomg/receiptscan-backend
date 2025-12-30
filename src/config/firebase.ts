import * as admin from 'firebase-admin';
import config from '../config';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: config.firebase.projectId,
    storageBucket: config.storage.bucket,
  });
}

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

export default admin;
