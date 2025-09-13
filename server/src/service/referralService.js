import User from '../models/user.model.js';
import UserProfile from '../models/userProfile.model.js';
import logger from '../util/logger.js';
import quicker from '../util/quicker.js';
import config from '../config/config.js';

class ReferralService {

    async processReferralReward(userId, subscriptionAmount = null) {
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

            // Check if referrer can still refer (only USER role can refer)
            if (!referrer.referral.canRefer || referrer.role !== 'user') {
                logger.warn(`Referrer cannot refer anymore: ${referrer._id}`);
                return { success: false, message: 'Referrer is not eligible to receive rewards' };
            }

            // Enhanced reward system: 50 points for referrer, 100 points for new user
            const referrerCredits = 50;
            const newUserCredits = 100;

            // Update referrer's credits and stats
            referrer.referral.totalreferralCredits += referrerCredits;
            referrer.referral.referralStats.successfulReferrals += 1;
            referrer.referral.referralStats.pendingReferrals = Math.max(0, referrer.referral.referralStats.pendingReferrals - 1);
            await referrer.save();

            // Update referrer's profile credits
            const referrerProfile = await UserProfile.findOne({ userId: referrer._id });
            if (referrerProfile) {
                referrerProfile.credits += referrerCredits;
                await referrerProfile.save();
            }

            // Update new user's credits
            const newUserProfile = await UserProfile.findOne({ userId: user._id });
            if (newUserProfile) {
                newUserProfile.credits += newUserCredits;
                await newUserProfile.save();
            }

            // Mark referral as used and update timestamp
            user.referral.isReferralUsed = true;
            user.referral.referralUsedAt = new Date();
            await user.save();

            // Send notification emails if want [TODO] 

            // Semd Welcome Email [TODO]


            logger.info('Referral reward processed successfully', {
                userId,
                referrerId: referrer._id,
                referrerCredits,
                newUserCredits,
                subscriptionAmount
            });

            return {
                success: true,
                referrerCredits,
                newUserCredits,
                referrerName: referrer.name,
                message: 'Referral rewards processed successfully'
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
            const referrer = await User.findByReferralCode(referralCode);

            if (!referrer) {
                return {
                    success: false,
                    message: 'Invalid referral code'
                };
            }

            // Check if referrer can refer (only USER role can refer)
            if (!referrer.referral.canRefer || referrer.role !== 'user') {
                return {
                    success: false,
                    message: 'This referral code is not valid for referrals'
                };
            }

            // Check if referrer is active and not banned
            if (!referrer.isActive || referrer.isBanned) {
                return {
                    success: false,
                    message: 'This referral code is no longer active'
                };
            }

            // Check if user is trying to refer themselves
            if (referrer._id.toString() === newUserId) {
                return {
                    success: false,
                    message: 'You cannot use your own referral code'
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
                    message: 'You have already used a referral code'
                };
            }

            // Link the referral
            newUser.referral.referredBy = referrer._id;
            newUser.referral.usedReferralCode = referralCode.toUpperCase();
            await newUser.save();

            // Update referrer's stats
            referrer.referral.referralStats.totalReferrals += 1;
            referrer.referral.referralStats.pendingReferrals += 1;
            await referrer.save();

            logger.info('Referral linked successfully', {
                newUserId,
                referrerId: referrer._id,
                referralCode
            });

            return {
                success: true,
                referrerName: referrer.name,
                message: 'Referral code applied successfully! You will receive bonus credits upon verification.'
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
            const user = await User.findById(userId).populate({
                path: 'referral.referredBy',
                select: 'name emailAddress'
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Check if user can refer
            const canRefer = user.referral.canRefer && user.role === 'user';

            // Count referred users with detailed info
            const referredUsers = await User.find({
                'referral.referredBy': userId
            }).select('name emailAddress referral.isReferralUsed referral.referralUsedAt createdAt').sort({ createdAt: -1 });

            // Count successful referrals (users who made purchases)
            const successfulReferrals = referredUsers.filter(u => u.referral.isReferralUsed);
            const pendingReferrals = referredUsers.filter(u => !u.referral.isReferralUsed);

            // Calculate total earnings
            const totalCreditsEarned = user.referral.totalreferralCredits;
            const availableCredits = totalCreditsEarned;

            // Calculate this month's referrals
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);

            const thisMonthReferrals = referredUsers.filter(u => new Date(u.createdAt) >= currentMonth);

            return {
                canRefer,
                referralCode: user.referral.userReferralCode || null,
                referralCodeGeneratedAt: user.referral.referralCodeGeneratedAt,
                totalReferrals: referredUsers.length,
                successfulReferrals: successfulReferrals.length,
                pendingReferrals: pendingReferrals.length,
                thisMonthReferrals: thisMonthReferrals.length,
                totalCreditsEarned,
                availableCredits,
                referredBy: user.referral.referredBy ? {
                    name: user.referral.referredBy.name,
                    email: user.referral.referredBy.emailAddress,
                    usedReferralCode: user.referral.usedReferralCode,
                    isReferralUsed: user.referral.isReferralUsed,
                    referralUsedAt: user.referral.referralUsedAt
                } : null,
                recentReferrals: referredUsers.slice(0, 10).map(u => ({
                    name: u.name,
                    email: u.emailAddress,
                    joinedAt: u.createdAt,
                    hasUsedReferral: u.referral.isReferralUsed,
                    referralUsedAt: u.referral.referralUsedAt,
                    status: u.referral.isReferralUsed ? 'completed' : 'pending'
                })),
                conversionRate: referredUsers.length > 0 ? ((successfulReferrals.length / referredUsers.length) * 100).toFixed(2) + '%' : '0%'
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
            const leaderboard = await User.getReferralLeaderboard(limit);

            return leaderboard.map(user => ({
                name: user.name,
                referralCode: user.referral.userReferralCode,
                totalReferrals: user.totalReferrals,
                successfulReferrals: user.successfulReferrals,
                totalCreditsEarned: user.referral.totalreferralCredits,
                joinedAt: user.createdAt
            }));

        } catch (error) {
            logger.error('Error getting referral leaderboard', {
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

            // Check if user can refer
            if (!user.referral.canRefer || user.role !== 'user') {
                throw new Error('You are not eligible to generate referral links');
            }

            // Generate referral code if not exists
            if (!user.referral.userReferralCode) {
                user.referral.userReferralCode = await User.generateUniqueReferralCode();
                user.referral.referralCodeGeneratedAt = new Date();
                await user.save();
            }

            const referralCode = user.referral.userReferralCode;
            const referralLink = `${config.client.url}/register?ref=${referralCode}`;

            return {
                referralCode,
                referralLink,
                shareMessage: `🍽️ Join Tiffin Management System using my referral code ${referralCode} and get 100 bonus credits! Enjoy fresh, homemade food delivered to your doorstep. ${referralLink}`,
                whatsappMessage: `Hey! 🍴 I'm using Tiffin Management System for delicious homemade food delivery. Join using my code ${referralCode} and get 100 bonus credits plus I'll get 50 credits too! Win-win! 😊 ${referralLink}`,
                emailSubject: '🍽️ Join me on Tiffin Management System - Get 100 Bonus Credits!',
                emailMessage: `Hi there!\n\nI've been using Tiffin Management System for fresh, homemade food delivery and absolutely love it! 🍛\n\nUse my referral code ${referralCode} when you sign up to get 100 bonus credits that you can use for your orders. Plus, I'll get 50 credits too - it's a win-win! 🎉\n\nJoin here: ${referralLink}\n\nHappy eating!\n${user.name}`,
                twitterMessage: `🍽️ Just discovered amazing homemade food delivery with @TiffinSystem! Use my code ${referralCode} for 100 bonus credits. Fresh food, delivered daily! ${referralLink} #TiffinDelivery #HomeCookedMeals`,
                stats: {
                    totalReferrals: user.referral.referralStats.totalReferrals,
                    successfulReferrals: user.referral.referralStats.successfulReferrals,
                    pendingReferrals: user.referral.referralStats.pendingReferrals,
                    totalCreditsEarned: user.referral.totalreferralCredits,
                    availableCredits: user.referral.totalreferralCredits
                }
            };

        } catch (error) {
            logger.error('Error generating referral link', {
                userId,
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
            if (!referrer.isActive || referrer.isBanned) {
                return {
                    valid: false,
                    message: 'This referral code is no longer active'
                };
            }

            return {
                valid: true,
                referrerName: referrer.name,
                referrerEmail: referrer.emailAddress,
                message: 'Valid referral code! You will get 100 bonus credits upon registration.'
            };

        } catch (error) {
            logger.error('Error validating referral code', {
                referralCode,
                error: error.message
            });
            throw error;
        }
    }

    async getSystemReferralStats() {
        try {
            const stats = await User.getReferralStats();

            // Get recent referrals (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentReferrals = await User.countDocuments({
                'referral.referredBy': { $ne: null },
                createdAt: { $gte: sevenDaysAgo }
            });

            // Get top referrers this month
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);

            const topThisMonth = await User.aggregate([
                {
                    $match: {
                        'referral.canRefer': true,
                        role: 'user'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { userId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$referral.referredBy', '$$userId'] },
                                    createdAt: { $gte: currentMonth }
                                }
                            }
                        ],
                        as: 'thisMonthReferrals'
                    }
                },
                {
                    $addFields: {
                        thisMonthCount: { $size: '$thisMonthReferrals' }
                    }
                },
                {
                    $match: { thisMonthCount: { $gt: 0 } }
                },
                {
                    $sort: { thisMonthCount: -1 }
                },
                {
                    $limit: 5
                },
                {
                    $project: {
                        name: 1,
                        'referral.userReferralCode': 1,
                        thisMonthCount: 1
                    }
                }
            ]);

            return {
                overall: stats[0] || {
                    totalUsers: 0,
                    totalReferrers: 0,
                    totalReferralUsers: 0,
                    totalCreditsAwarded: 0,
                    activeReferrers: 0
                },
                recent: {
                    last7Days: recentReferrals
                },
                topThisMonth: topThisMonth.map(user => ({
                    name: user.name,
                    referralCode: user.referral.userReferralCode,
                    referralsThisMonth: user.thisMonthCount
                })),
                conversionRate: stats[0] ? ((stats[0].totalReferralUsers / stats[0].totalUsers) * 100).toFixed(2) + '%' : '0%',
                avgCreditsPerReferrer: stats[0] && stats[0].totalReferrers > 0 ? (stats[0].totalCreditsAwarded / stats[0].totalReferrers).toFixed(0) : 0
            };

        } catch (error) {
            logger.error('Error getting system referral stats', {
                error: error.message
            });
            throw error;
        }
    }

    async disableUserReferrals(userId, reason = 'Admin action') {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.referral.canRefer = false;
            await user.save();

            logger.info('User referral capability disabled', {
                userId,
                reason,
                timestamp: new Date()
            });

            return {
                success: true,
                message: 'User referral capability disabled successfully'
            };

        } catch (error) {
            logger.error('Error disabling user referrals', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    async enableUserReferrals(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Only USER role can refer
            if (user.role !== 'user') {
                throw new Error('Only regular users can be enabled for referrals');
            }

            user.referral.canRefer = true;
            await user.save();

            logger.info('User referral capability enabled', {
                userId,
                timestamp: new Date()
            });

            return {
                success: true,
                message: 'User referral capability enabled successfully'
            };

        } catch (error) {
            logger.error('Error enabling user referrals', {
                userId,
                error: error.message
            });
            throw error;
        }
    }
}

export default new ReferralService();