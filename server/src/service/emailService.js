import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../util/logger.js';
import { EApplicationEnvironment } from '../constant/application.js';

const transporter = nodemailer.createTransport(config.email.smtp);

const sendEmail = async (to, subject, text, html) => {
    if (config.env !== EApplicationEnvironment.PRODUCTION) {
        logger.info(`[DEV] Mock Email sent to ${to}: ${subject}`);
        return { messageId: 'mock-id' };
    }

    try {
        const info = await transporter.sendMail({
            from: config.email.from,
            to,
            subject,
            text,
            html
        });
        logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Error sending email: ${error.message}`);
        return null;
    }
};

export default {
    sendPurchaseSuccessEmail: async (to, userName, planName, startDate, endDate, amount, transactionId) => {
        const subject = 'Purchase Confirmation - Tiffix';
        const text = `Hello ${userName},

Your subscription for ${planName} has been successfully activated.

Details:
Plan: ${planName}
Amount Paid: ₹${amount}
Transaction ID: ${transactionId}
Start Date: ${startDate}
End Date: ${endDate}

Thank you for choosing Tiffix!`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4CAF50;">Purchase Successful!</h2>
                <p>Hello <strong>${userName}</strong>,</p>
                <p>Your subscription for <strong>${planName}</strong> has been successfully activated.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Subscription Details</h3>
                    <p><strong>Plan:</strong> ${planName}</p>
                    <p><strong>Amount Paid:</strong> ₹${amount}</p>
                    <p><strong>Transaction ID:</strong> ${transactionId}</p>
                    <p><strong>Start Date:</strong> ${startDate}</p>
                    <p><strong>End Date:</strong> ${endDate}</p>
                </div>
                <p>Thank you for choosing Tiffix!</p>
            </div>
        `;
        
        return sendEmail(to, subject, text, html);
    }
};
