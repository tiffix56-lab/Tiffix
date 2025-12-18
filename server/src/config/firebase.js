import admin from 'firebase-admin';
import config from './config.js';

if (config.firebase.serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(config.firebase.serviceAccount),
    });
}

export default admin;
