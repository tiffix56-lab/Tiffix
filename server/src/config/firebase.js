import admin from 'firebase-admin';
import config from '../config/config.js';

if (!config.firebase.serviceAccount) {
  console.warn('Firebase service account not provided. Skipping Firebase initialization.');
} else {
  try {
    const decoded = Buffer.from(config.firebase.serviceAccount, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decoded);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (err) {
    console.error('Failed to decode or initialize Firebase Admin SDK:', err.message);
    process.exit(1); 
  }
}

export default admin;
