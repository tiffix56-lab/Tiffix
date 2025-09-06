import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import referralService from '../../service/referralService.js';
import User from '../../models/user.model.js';

export default {

    /**
     * Validate referral code (public endpoint for registration form)
     */
    validateReferralCode: async (req, res, next) => {
        try {
            const { referralCode } = req.params;

            if (!referralCode) {
                return httpError(next, new Error('Referral code is required'), req, 400);
            }

            // Validate referral code format
            if (referralCode.length < 6 || referralCode.length > 10) {
                return httpError(next, new Error('Invalid referral code format'), req, 400);
            }

            const validationResult = await referralService.validateReferralCode(referralCode);

            if (!validationResult.valid) {
                return httpError(next, new Error(validationResult.message), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                valid: true,
                referrerName: validationResult.referrerName,
                message: validationResult.message,
                rewards: {
                    newUserBonus: 100,
                    referrerBonus: 50
                }
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Generate referral link and sharing content
     */
    generateReferralLink: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;

            // Check if user can generate referral links
            if (role !== 'user') {
                return httpError(next, new Error('Only regular users can generate referral links'), req, 403);
            }

            const referralData = await referralService.generateReferralLink(userId);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                success: true,
                ...referralData
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Get referral statistics for the authenticated user
     */
    getReferralStats: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;

            const stats = await referralService.getReferralStats(userId);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                success: true,
                userRole: role,
                ...stats
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Get referral leaderboard (Public for motivation)
     */
    getReferralLeaderboard: async (req, res, next) => {
        try {
            const { limit = 10 } = req.query;
            const limitNumber = Math.min(parseInt(limit) || 10, 50);

            const leaderboard = await referralService.getReferralLeaderboard(limitNumber);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                success: true,
                leaderboard,
                totalEntries: leaderboard.length,
                limit: limitNumber,
                lastUpdated: new Date().toISOString()
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Admin: Get comprehensive referral analytics with advanced statistics
     */
    getReferralAnalytics: async (req, res, next) => {
        try {
            const {
                page = 1,
                limit = 20,
                startDate,
                endDate,
                sortBy = 'totalreferralCredits',
                sortOrder = 'desc'
            } = req.query;


            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            const skip = (page - 1) * limit;
            const sortObj = {};
            sortObj[`referral.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;

            const analytics = await User.aggregate([
                {
                    $match: {
                        'referral.totalreferralCredits': { $gt: 0 },
                        ...dateFilter
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: 'referral.referredBy',
                        as: 'referredUsers'
                    }
                },
                {
                    $addFields: {
                        totalReferrals: { $size: '$referredUsers' },
                        successfulReferrals: {
                            $size: {
                                $filter: {
                                    input: '$referredUsers',
                                    cond: { $eq: ['$$this.referral.isReferralUsed', true] }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        name: 1,
                        emailAddress: 1,
                        'referral.userReferralCode': 1,
                        'referral.totalreferralCredits': 1,
                        totalReferrals: 1,
                        successfulReferrals: 1,
                        createdAt: 1
                    }
                },
                {
                    $sort: sortObj
                },
                {
                    $skip: skip
                },
                {
                    $limit: parseInt(limit)
                }
            ]);

            const totalCount = await User.countDocuments({
                'referral.totalreferralCredits': { $gt: 0 },
                ...dateFilter
            });

            const overallStats = await User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        totalReferrers: {
                            $sum: { $cond: [{ $gt: ['$referral.totalreferralCredits', 0] }, 1, 0] }
                        },
                        totalCreditsAwarded: { $sum: '$referral.totalreferralCredits' },
                        totalReferrals: {
                            $sum: { $cond: [{ $ne: ['$referral.referredBy', null] }, 1, 0] }
                        },
                        avgCreditsPerReferrer: { $avg: '$referral.totalreferralCredits' },
                        avgReferralsPerUser: { $avg: { $cond: [{ $gt: ['$referral.totalreferralCredits', 0] }, '$referral.totalreferralCredits', 0] } }
                    }
                }
            ]);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentStats = await User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: null,
                        newUsersLast30Days: { $sum: 1 },
                        newReferralsLast30Days: {
                            $sum: { $cond: [{ $ne: ['$referral.referredBy', null] }, 1, 0] }
                        }
                    }
                }
            ]);

            const topReferrers = await User.find({
                'referral.totalreferralCredits': { $gt: 0 }
            })
                .select('name emailAddress referral.totalreferralCredits referral.userReferralCode')
                .sort({ 'referral.totalreferralCredits': -1 })
                .limit(5);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                analytics,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < Math.ceil(totalCount / limit),
                    hasPrevPage: page > 1
                },
                overallStats: overallStats[0] || {
                    totalUsers: 0,
                    totalReferrers: 0,
                    totalCreditsAwarded: 0,
                    totalReferrals: 0,
                    avgCreditsPerReferrer: 0,
                    avgReferralsPerUser: 0
                },
                recentStats: recentStats[0] || {
                    newUsersLast30Days: 0,
                    newReferralsLast30Days: 0
                },
                topReferrers,
                filters: {
                    startDate,
                    endDate,
                    sortBy,
                    sortOrder
                }
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Get system-wide referral statistics (Admin only)
     */
    getSystemReferralStats: async (req, res, next) => {
        try {
            const systemStats = await referralService.getSystemReferralStats();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                success: true,
                systemStats,
                generatedAt: new Date().toISOString()
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Disable user referral capability (Admin only)
     */
    disableUserReferrals: async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { reason } = req.body;

            if (!userId) {
                return httpError(next, new Error('User ID is required'), req, 400);
            }

            const result = await referralService.disableUserReferrals(userId, reason);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                success: true,
                message: result.message,
                userId,
                disabledBy: req.authenticatedUser.userId,
                reason: reason || 'No reason provided',
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Enable user referral capability (Admin only)
     */
    enableUserReferrals: async (req, res, next) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return httpError(next, new Error('User ID is required'), req, 400);
            }

            const result = await referralService.enableUserReferrals(userId);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                success: true,
                message: result.message,
                userId,
                enabledBy: req.authenticatedUser.userId,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Process referral reward manually (Admin only)
     */
    processReferralReward: async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { subscriptionAmount } = req.body;

            if (!userId) {
                return httpError(next, new Error('User ID is required'), req, 400);
            }

            const result = await referralService.processReferralReward(userId, subscriptionAmount);

            if (!result.success) {
                return httpError(next, new Error(result.message), req, 400);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                success: true,
                message: result.message,
                referrerCredits: result.referrerCredits,
                newUserCredits: result.newUserCredits,
                referrerName: result.referrerName,
                processedBy: req.authenticatedUser.userId,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

};