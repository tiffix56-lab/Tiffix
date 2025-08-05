import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../util/logger.js';
import { EApplicationEnvironment } from '../constant/application.js';

// Create transporter based on configuration
const createTransporter = () => {
    const transportConfig = {
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass
        }
    };


    if (config.email.smtp.service) {
        transportConfig.service = config.email.smtp.service;
    }

    return nodemailer.createTransport(transportConfig);
};

const transporter = createTransporter();

/**
 * Email Service for sending various types of emails
 */
class EmailService {

    async sendVerificationEmail(email, name, otp) {
        if (config.env !== EApplicationEnvironment.PRODUCTION) {
            logger.info("YOUR IN THE DEVELOPMENT MODE", {
                meta: {
                    otp: otp
                }
            })
            return { success: true, messageId: "00000" };

        }
        try {
            const html = this.generateVerificationEmailTemplate(name, otp);

            const mailOptions = {
                from: config.email.from,
                to: email,
                subject: config.email.templates.verificationSubject,
                html: html
            };

            const result = await transporter.sendMail(mailOptions);

            logger.info(`Verification email sent to ${email}`, { messageId: result.messageId });
            return { success: true, messageId: result.messageId };
        } catch (error) {
            logger.error('Failed to send verification email', {
                email,
                error: error.message
            });
            throw new Error('Failed to send verification email');
        }
    }


    async sendWelcomeEmail(email, name, userType = 'user') {
        if (config.env !== EApplicationEnvironment.PRODUCTION) {
            logger.info("YOUR IN THE DEVELOPMENT MODE", {
                message: "Welcome MAil Send Succesfully"
            })
            return { success: true, messageId: "00000" };

        }
        try {
            const html = this.generateWelcomeEmailTemplate(name, userType);

            const mailOptions = {
                from: config.email.from,
                to: email,
                subject: config.email.templates.welcomeSubject,
                html: html
            };

            const result = await transporter.sendMail(mailOptions);

            logger.info(`Welcome email sent to ${email}`, { messageId: result.messageId });
            return { success: true, messageId: result.messageId };
        } catch (error) {
            logger.error('Failed to send welcome email', {
                email,
                error: error.message
            });
            throw new Error('Failed to send welcome email');
        }
    }

    async sendPasswordResetEmail(email, name, otp) {
        if (config.env !== EApplicationEnvironment.PRODUCTION) {
            logger.info("YOUR IN THE DEVELOPMENT MODE", {
                otp: otp
            })
            return { success: true, messageId: "00000" };
        }
        try {
            const html = this.generatePasswordResetEmailTemplate(name, otp);

            const mailOptions = {
                from: config.email.from,
                to: email,
                subject: config.email.templates.passwordResetSubject,
                html: html
            };

            const result = await transporter.sendMail(mailOptions);

            logger.info(`Password reset email sent to ${email}`, { messageId: result.messageId });
            return { success: true, messageId: result.messageId };
        } catch (error) {
            logger.error('Failed to send password reset email', {
                email,
                error: error.message
            });
            throw new Error('Failed to send password reset email');
        }
    }


    async sendReferralRewardEmail(email, name, credits, referredUserName) {
        if (config.env !== EApplicationEnvironment.PRODUCTION) {
            logger.info("YOUR IN THE DEVELOPMENT MODE", {
                message: "Referral reward email sent successfully"
            })
            return { success: true, messageId: "00000" };
        }
        try {
            const html = this.generateReferralRewardEmailTemplate(name, credits, referredUserName);

            const mailOptions = {
                from: config.email.from,
                to: email,
                subject: config.email.templates.referralRewardSubject,
                html: html
            };

            const result = await transporter.sendMail(mailOptions);

            logger.info(`Referral reward email sent to ${email}`, { messageId: result.messageId });
            return { success: true, messageId: result.messageId };
        } catch (error) {
            logger.error('Failed to send referral reward email', {
                email,
                error: error.message
            });
            throw new Error('Failed to send referral reward email');
        }
    }


    async sendVendorVerificationEmail(email, name, businessName, isApproved) {
        if (config.env !== EApplicationEnvironment.PRODUCTION) {
            logger.info("YOUR IN THE DEVELOPMENT MODE", {
                message: "Vendor verification email sent successfully"
            })
            return { success: true, messageId: "00000" };
        }
        try {
            const html = this.generateVendorVerificationEmailTemplate(name, businessName, isApproved);
            const subject = isApproved ? 'Vendor Account Approved!' : 'Vendor Account Status Update';

            const mailOptions = {
                from: config.email.from,
                to: email,
                subject: subject,
                html: html
            };

            const result = await transporter.sendMail(mailOptions);

            logger.info(`Vendor verification email sent to ${email}`, { messageId: result.messageId });
            return { success: true, messageId: result.messageId };
        } catch (error) {
            logger.error('Failed to send vendor verification email', {
                email,
                error: error.message
            });
            throw new Error('Failed to send vendor verification email');
        }
    }

    // Email Template Generators

    generateVerificationEmailTemplate(name, otp) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Email Verification</title>
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9f9f9; }
                .otp-box { background: #FF6B35; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Tiffin Management System</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Thank you for registering with Tiffin Management System. Please verify your email address using the OTP below:</p>
                    <div class="otp-box">${otp}</div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Tiffin Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateWelcomeEmailTemplate(name, userType) {
        const userTypeText = userType === 'vendor' ? 'vendor' : 'member';
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome</title>
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9f9f9; }
                .cta-button { background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Tiffin Management System!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Welcome to Tiffin Management System! We're excited to have you as a ${userTypeText}.</p>
                    ${userType === 'vendor' ? `
                        <p>As a vendor, you can:</p>
                        <ul>
                            <li>Create and manage your menu items</li>
                            <li>Set your operating hours and service area</li>
                            <li>Track orders and earnings</li>
                            <li>Build your customer base</li>
                        </ul>
                        <p>Your account is currently under review. You'll receive an email once it's approved.</p>
                    ` : `
                        <p>As a member, you can:</p>
                        <ul>
                            <li>Browse delicious tiffin options</li>
                            <li>Subscribe to meal plans</li>
                            <li>Refer friends and earn credits</li>
                            <li>Enjoy doorstep delivery</li>
                        </ul>
                    `}
                    <a href="${config.client.url}" class="cta-button">Get Started</a>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Tiffin Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generatePasswordResetEmailTemplate(name, otp) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9f9f9; }
                .otp-box { background: #FF6B35; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #666; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>We received a request to reset your password. Please use the OTP below to reset your password:</p>
                    <div class="otp-box">${otp}</div>
                    <div class="warning">
                        <strong>Security Notice:</strong> This OTP will expire in 10 minutes. If you didn't request this reset, please ignore this email.
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Tiffin Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateReferralRewardEmailTemplate(name, credits, referredUserName) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Referral Reward</title>
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9f9f9; }
                .reward-box { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Congratulations!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Great news! ${referredUserName} just made their first subscription purchase using your referral code.</p>
                    <div class="reward-box">
                        <h3>You've earned ${credits} credits!</h3>
                    </div>
                    <p>These credits have been added to your account and can be used for future purchases.</p>
                    <p>Keep sharing your referral code to earn more rewards!</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Tiffin Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateVendorVerificationEmailTemplate(name, businessName, isApproved) {
        const status = isApproved ? 'approved' : 'requires additional information';
        const bgColor = isApproved ? '#28a745' : '#ffc107';

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Vendor Verification Update</title>
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: ${bgColor}; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9f9f9; }
                .status-box { background: ${bgColor}; color: white; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Vendor Account Update</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>We have an update regarding your vendor account for <strong>${businessName}</strong>:</p>
                    <div class="status-box">
                        <h3>Status: ${status.toUpperCase()}</h3>
                    </div>
                    ${isApproved ? `
                        <p>🎉 Congratulations! Your vendor account has been approved. You can now:</p>
                        <ul>
                            <li>Start adding menu items</li>
                            <li>Set your availability and pricing</li>
                            <li>Begin accepting orders</li>
                        </ul>
                    ` : `
                        <p>Your application requires additional review. Please ensure all required documents are submitted and accurate.</p>
                    `}
                </div>
                <div class="footer">
                    <p>&copy; 2024 Tiffin Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

export default new EmailService();