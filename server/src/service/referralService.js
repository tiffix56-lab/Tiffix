import User from '../models/user.model.js';
import UserProfile from '../models/userProfile.model.js';
import emailService from './emailService.js';
import logger from '../util/logger.js';
import quicker from '../util/quicker.js';

class ReferralService {

    async processReferralReward(userId, subscriptionAmount) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user was referred and hasn't used referral reward yet
            if (!user.referral.referredBy || user.referral.isReferralUsed) {
                return { success: false, message: 'No valid referral to process' };
            }

            // Find the referrer
            const referrer = await User.findById(user.referral.referredBy);
            if (!referrer) {
                logger.warn(`Referrer not found for user ${userId}`);
                return { success: false, message: 'Referrer not found' };
            }

            // Calculate credits to award
            const creditsToAward = quicker.calculateReferralCredits(subscriptionAmount);

            // Update referrer's credits
            referrer.referral.totalreferralCredits += creditsToAward;
            await referrer.save();

            // Update referrer's profile credits
            const referrerProfile = await UserProfile.findOne({ userId: referrer._id });
            if (referrerProfile) {
                referrerProfile.credits += creditsToAward;
                await referrerProfile.save();
            }

            // Mark referral as used
            user.referral.isReferralUsed = true;
            await user.save();

            // Send notification email to referrer
            try {
                await emailService.sendReferralRewardEmail(
                    referrer.emailAddress,
                    referrer.name,
                    creditsToAward,
                    user.name
                );
            } catch (emailError) {
                logger.error('Failed to send referral reward email', {
                    referrerId: referrer._id,
                    error: emailError.message
                });
            }

            logger.info('Referral reward processed successfully', {
                userId,
                referrerId: referrer._id,
                creditsAwarded: creditsToAward,
                subscriptionAmount
            });

            return {
                success: true,
                creditsAwarded: creditsToAward,
                referrerName: referrer.name,
                message: 'Referral reward processed successfully'
            };

        } catch (error) {
            logger.error('Error processing referral reward', {
                userId,
                subscriptionAmount,
                error: error.message
            });
            throw error;
        }
    }


    async validateAndLinkReferral(referralCode, newUserId) {
        try {
            // Find the referrer by referral code
            const referrer = await User.findOne({
                'referral.userReferralCode': referralCode.toUpperCase()
            });

            if (!referrer) {
                return {
                    success: false,
                    message: 'Invalid referral code'
                };
            }

            // Check if user is trying to refer themselves
            if (referrer._id.toString() === newUserId) {
                return {
                    success: false,
                    message: 'Cannot use your own referral code'
                };
            }

            // Update new user's referral information
            const newUser = await User.findById(newUserId);
            if (!newUser) {
                throw new Error('New user not found');
            }

            // Check if user already has a referral
            if (newUser.referral.referredBy) {
                return {
                    success: false,
                    message: 'Referral code already used'
                };
            }

            // Link the referral
            newUser.referral.referredBy = referrer._id;
            newUser.referral.usedReferralCode = referralCode.toUpperCase();
            await newUser.save();

            logger.info('Referral linked successfully', {
                newUserId,
                referrerId: referrer._id,
                referralCode
            });

            return {
                success: true,
                referrerName: referrer.name,
                message: 'Referral code applied successfully'
            };

        } catch (error) {
            logger.error('Error validating referral code', {
                referralCode,
                newUserId,
                error: error.message
            });
            throw error;
        }
    }


    async getReferralStats(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Count referred users
            const referredUsers = await User.find({
                'referral.referredBy': userId
            }).select('name emailAddress referral.isReferralUsed createdAt');

            // Count successful referrals (users who made purchases)
            const successfulReferrals = referredUsers.filter(u => u.referral.isReferralUsed);

            // Calculate total earnings
            const totalCreditsEarned = user.referral.totalreferralCredits;
            const creditsUsed = user.referral.referralCreditsUsed;
            const availableCredits = totalCreditsEarned - creditsUsed;

            return {
                referralCode: user.referral.userReferralCode,
                totalReferrals: referredUsers.length,
                successfulReferrals: successfulReferrals.length,
                pendingReferrals: referredUsers.length - successfulReferrals.length,
                totalCreditsEarned,
                creditsUsed,
                availableCredits,
                referredUsers: referredUsers.map(u => ({
                    name: u.name,
                    email: u.emailAddress,
                    joinedAt: u.createdAt,
                    hasUsedReferral: u.referral.isReferralUsed
                }))
            };

        } catch (error) {
            logger.error('Error getting referral stats', {
                userId,
                error: error.message
            });
            throw error;
        }
    }


    async getReferralLeaderboard(limit = 10) {
        try {
            const topReferrers = await User.aggregate([
                {
                    $match: {
                        'referral.totalreferralCredits': { $gt: 0 }
                    }
                },
                {
                    $project: {
                        name: 1,
                        'referral.totalreferralCredits': 1,
                        'referral.userReferralCode': 1
                    }
                },
                {
                    $sort: { 'referral.totalreferralCredits': -1 }
                },
                {
                    $limit: limit
                }
            ]);

            // Get referral counts for each user
            const leaderboard = await Promise.all(
                topReferrers.map(async (user) => {
                    const referralCount = await User.countDocuments({
                        'referral.referredBy': user._id
                    });

                    const successfulReferrals = await User.countDocuments({
                        'referral.referredBy': user._id,
                        'referral.isReferralUsed': true
                    });

                    return {
                        name: user.name,
                        referralCode: user.referral.userReferralCode,
                        totalReferrals: referralCount,
                        successfulReferrals,
                        totalCreditsEarned: user.referral.totalreferralCredits
                    };
                })
            );

            return leaderboard;

        } catch (error) {
            logger.error('Error getting referral leaderboard', {
                error: error.message
            });
            throw error;
        }
    }


    async useReferralCredits(userId, creditsToUse) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                throw new Error('User profile not found');
            }

            const availableCredits = user.referral.totalreferralCredits - user.referral.referralCreditsUsed;

            if (creditsToUse > availableCredits) {
                return {
                    success: false,
                    message: 'Insufficient referral credits',
                    availableCredits
                };
            }

            // Deduct credits from user's referral account
            user.referral.referralCreditsUsed += creditsToUse;
            await user.save();

            // Add credits to user's profile (they can be used like regular credits)
            userProfile.credits += creditsToUse;
            await userProfile.save();

            logger.info('Referral credits used successfully', {
                userId,
                creditsUsed: creditsToUse,
                remainingReferralCredits: availableCredits - creditsToUse
            });

            return {
                success: true,
                creditsUsed: creditsToUse,
                remainingReferralCredits: availableCredits - creditsToUse,
                newTotalCredits: userProfile.credits,
                message: 'Referral credits applied successfully'
            };

        } catch (error) {
            logger.error('Error using referral credits', {
                userId,
                creditsToUse,
                error: error.message
            });
            throw error;
        }
    }


    async generateReferralLink(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const referralCode = user.referral.userReferralCode;
            const referralLink = `${process.env.CLIENT_URL}/register?ref=${referralCode}`;

            return {
                referralCode,
                referralLink,
                shareMessage: `Join Tiffin Management System using my referral code ${referralCode} and get amazing deals on fresh, homemade food! ${referralLink}`,
                whatsappMessage: `Hey! I'm using Tiffin Management System for delicious homemade food delivery. Join using my code ${referralCode} and get special offers! ${referralLink}`,
                emailSubject: 'Join me on Tiffin Management System!',
                emailMessage: `I've been using Tiffin Management System for fresh, homemade food delivery and thought you'd love it too! Use my referral code ${referralCode} when you sign up to get special offers. ${referralLink}`
            };

        } catch (error) {
            logger.error('Error generating referral link', {
                userId,
                error: error.message
            });
            throw error;
        }
    }
}

export default new ReferralService();