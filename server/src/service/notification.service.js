import admin from '../config/firebase.js';

class NotificationService {
    async sendNotification(fcmTokens, payload) {
        if (!fcmTokens || fcmTokens.length === 0) {
            return;
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            tokens: fcmTokens,
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log('Successfully sent message:', response);
        } catch (error) {
            console.log('Error sending message:', error);
        }
    }
}

export default new NotificationService();
