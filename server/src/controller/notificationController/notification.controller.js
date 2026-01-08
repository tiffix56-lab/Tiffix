import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import notificationService from '../../service/notification.service.js';
import User from '../../models/user.model.js';
import { EUserRole } from '../../constant/application.js';
import { validateJoiSchema, ValidateBroadcastNotification } from '../../service/validationService.js';

export default {
    sendBroadcastNotification: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;
            const { body } = req;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateBroadcastNotification, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { title, body: messageBody } = value;

            // Find all users with FCM tokens
            // We filter out users who have empty or null fcmTokens array
            const users = await User.find({
                fcmTokens: { $exists: true, $not: { $size: 0 } }
            }).select('fcmTokens');

            let allTokens = [];
            users.forEach(user => {
                if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
                    allTokens.push(...user.fcmTokens);
                }
            });

            // Remove duplicates
            allTokens = [...new Set(allTokens)];

            if (allTokens.length === 0) {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    message: 'No active users with push notification tokens found.'
                });
            }

            // Send notifications in chunks of 500 (Firebase limit per request)
            const chunkSize = 500;
            const notificationPromises = [];

            for (let i = 0; i < allTokens.length; i += chunkSize) {
                const chunk = allTokens.slice(i, i + chunkSize);
                notificationPromises.push(
                    notificationService.sendNotification(chunk, { title, body: messageBody })
                );
            }

            await Promise.all(notificationPromises);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: `Notification sent to ${allTokens.length} devices.`,
                recipientCount: allTokens.length
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error while sending broadcast';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};
