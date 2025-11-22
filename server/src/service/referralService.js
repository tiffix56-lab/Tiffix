import User from '../models/user.model.js';
import logger from '../util/logger.js';
import quicker from '../util/quicker.js';
import config from '../config/config.js';
import userSubscriptionModel from '../models/userSubscription.model.js';

class ReferralService {

    async canUserUseReferral(userId, referralCode) {
        try {
            // Validate referral code format
            if (!referralCode || referralCode.length < 6 || referralCode.length > 10) {
                return {
                    canUse: false,
                    message: 'Referral code must be between 6-10 characters'
                };
            }

            // Find the user who wants to use referral
            const user = await User.findById(userId);
            if (!user) {
                return {
                    canUse: false,
                    message: 'User not found'
                };
            }

            // Check if user has already used a referral code
            if (user.referral.isReferralUsed) {
                return {
                    canUse: false,
                    message: 'You have already used a referral code. Each user can only use one referral code.'
                };
            }

            // Find the referrer by referral code
            const referrer = await User.findByReferralCode(referralCode);
            if (!referrer) {
                return {
                    canUse: false,
                    message: 'Invalid referral code'
                };
            }

            // Prevent self-referral
            if (referrer._id.toString() === userId.toString()) {
                return {
                    canUse: false,
                    message: 'You cannot use your own referral code'
                };
            }

            // Check if referrer can refer (canRefer flag and role)
            if (!referrer.referral.canRefer || referrer.role !== 'user') {
                return {
                    canUse: false,
                    message: 'This referral code is not valid for referrals'
                };
            }

            // Check if referrer is active and not banned/deleted
            if (!referrer.isActive) {
                return {
                    canUse: false,
                    message: 'This referral code belongs to an inactive account'
                };
            }

            if (referrer.isBanned) {
                return {
                    canUse: false,
                    message: 'This referral code is no longer active'
                };
            }

            if (referrer.isDeleted) {
                return {
                    canUse: false,
                    message: 'This referral code is no longer valid'
                };
            }

            return {
                canUse: true,
                referrerId: referrer._id,
                referrerName: referrer.name,
                message: 'Valid referral code! You can use this code.'
            };

        } catch (error) {
            logger.error('Error checking if user can use referral', {
                userId,
                referralCode,
                error: error.message
            });
            throw error;
        }
    }

    async validateReferralCode(referralCode) {
        try {
            if (!referralCode || referralCode.length < 6 || referralCode.length > 10) {
                return {
                    valid: false,
                    message: 'Referral code must be between 6-10 characters'
                };
            }

            const referrer = await User.findByReferralCode(referralCode);

            if (!referrer) {
                return {
                    valid: false,
                    message: 'Invalid referral code'
                };
            }

            // Check if referrer can refer
            if (!referrer.referral.canRefer || referrer.role !== 'user') {
                return {
                    valid: false,
                    message: 'This referral code is not valid'
                };
            }

            // Check if referrer is active
            if (!referrer.isActive || referrer.isBanned || referrer.isDeleted) {
                return {
                    valid: false,
                    message: 'This referral code is no longer active'
                };
            }

            return {
                valid: true,
                referrerId: referrer._id,
                referrerName: referrer.name,
                referrerEmail: referrer.emailAddress,
                message: 'Valid referral code! You will get some reward from our team contact our team.'
            };

        } catch (error) {
            logger.error('Error validating referral code', {
                referralCode,
                error: error.message
            });
            throw error;
        }
    }

}

export default new ReferralService();