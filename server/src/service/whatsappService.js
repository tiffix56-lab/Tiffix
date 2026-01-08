import axios from 'axios';
import config from '../config/config.js';
import logger from '../util/logger.js';
import { EApplicationEnvironment } from '../constant/application.js';

// AiSensy WhatsApp API helper function
const sendWhatsAppMessage = async (destination, userName, otpCode, campaignName = config.aisensy.campaignName) => {
    try {
        const payload = {
            apiKey: config.aisensy.apiKey,
            campaignName: campaignName,
            destination: destination,
            userName: userName,
            templateParams: [otpCode],
            source: "tiffix-app",
            media: {},
            buttons: [
                {
                    type: "button",
                    sub_type: "url",
                    index: 0,
                    parameters: [
                        {
                            type: "text",
                            text: otpCode
                        }
                    ]
                }
            ],
            carouselCards: [],
            location: {},
            attributes: {},
            paramsFallbackValue: {
                FirstName: userName || "user"
            }
        };

        const response = await axios.post(
            `${config.aisensy.baseUrl}${config.aisensy.apiEndpoint}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("RESPONSE FORM AI SENSY", response);


        return response.data;
    } catch (error) {
        logger.error('AiSensy API error:', error.response?.data || error.message);
        throw error;
    }
};

const sendPurchaseMessage = async (destination, userName, planName, amount, startDate, endDate, transactionId) => {
    try {
        const payload = {
            apiKey: config.aisensy.apiKey,
            campaignName: "SUBSCRIPTION_PURCHASED", // Placeholder campaign name
            destination: destination,
            userName: userName,
            templateParams: [userName, planName, amount, startDate, endDate, transactionId],
            source: "tiffix-app",
            media: {},
            carouselCards: [],
            location: {},
            attributes: {},
            paramsFallbackValue: {
                FirstName: userName || "user"
            }
        };

        const response = await axios.post(
            `${config.aisensy.baseUrl}${config.aisensy.apiEndpoint}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        logger.error('AiSensy API error (Purchase):', error.response?.data || error.message);
        throw error;
    }
};

/**
 * WhatsApp Service for sending various types of messages via AiSensy
 */
class WhatsAppService {

    async sendVerificationMessage(phoneNumber, name, otp) {
        if (config.env !== EApplicationEnvironment.PRODUCTION) {
            logger.info("YOUR IN THE DEVELOPMENT MODE", {
                meta: {
                    otp: otp
                }
            })
            return { success: true, messageId: "00000" };
        }

        try {
            const result = await sendWhatsAppMessage(phoneNumber, name, otp, config.aisensy.campaignName);

            logger.info(`Verification WhatsApp sent to ${phoneNumber}`, { result });
            return { success: true, messageId: result.messageId || "whatsapp_sent" };
        } catch (error) {
            logger.error('Failed to send verification WhatsApp', {
                phoneNumber,
                error: error.message
            });
            throw new Error('Failed to send verification WhatsApp');
        }
    }

    async sendPasswordResetMessage(phoneNumber, name, otp) {
        if (config.env !== EApplicationEnvironment.PRODUCTION) {
            logger.info("YOUR IN THE DEVELOPMENT MODE", {
                otp: otp
            })
            return { success: true, messageId: "00000" };
        }

        try {
            const result = await sendWhatsAppMessage(phoneNumber, name, otp, config.aisensy.campaignName);

            logger.info(`Password reset WhatsApp sent to ${phoneNumber}`, { result });
            return { success: true, messageId: result.messageId || "whatsapp_sent" };
        } catch (error) {
            logger.error('Failed to send password reset WhatsApp', {
                phoneNumber,
                error: error.message
            });
            throw new Error('Failed to send password reset WhatsApp');
        }
    }

    async sendPurchaseSuccessMessage(phoneNumber, name, planName, amount, startDate, endDate, transactionId) {
        if (config.env !== EApplicationEnvironment.PRODUCTION) {
            logger.info("YOUR IN THE DEVELOPMENT MODE - Purchase WhatsApp", {
                phoneNumber, name, planName, amount, startDate, endDate, transactionId
            });
            return { success: true, messageId: "00000" };
        }

        try {
            const result = await sendPurchaseMessage(phoneNumber, name, planName, amount, startDate, endDate, transactionId);
            logger.info(`Purchase success WhatsApp sent to ${phoneNumber}`, { result });
            return { success: true, messageId: result.messageId || "whatsapp_sent" };
        } catch (error) {
            logger.error('Failed to send purchase success WhatsApp', {
                phoneNumber,
                error: error.message
            });
            // Don't throw error to avoid failing the whole request just because notification failed
            return { success: false, error: error.message };
        }
    }

}

export default new WhatsAppService();