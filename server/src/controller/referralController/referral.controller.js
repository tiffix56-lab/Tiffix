import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateReferralCode, ValidateUseCredits } from '../../util/validationService.js';
import referralService from '../../service/referralService.js';

export default {
    /**
     * Apply referral code for a new user
     */
    applyReferralCode: async (req, res, next) => {
        try {
            const { body } = req;
            const { userId } = req.user;

            const { error, value } = validateJoiSchema(ValidateReferralCode, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { referralCode } = value;

            const result = await referralService.validateAndLinkReferral(referralCode, userId);

            if (!result.success) {
                return httpError(next, new Error(result.message), req, 400);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: result.message,
                referrerName: result.referrerName
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    /**
     * Get referral statistics for the authenticated user
     */
    getReferralStats: async (req, res, next) => {
        try {
            const { userId } = req.user; // From auth middleware

            const stats = await referralService.getReferralStats(userId);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                referralStats: stats
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    /**
     * Get referral leaderboard
     */
    getReferralLeaderboard: async (req, res, next) => {
        try {
            const { limit = 10 } = req.query;

            const leaderboard = await referralService.getReferralLeaderboard(parseInt(limit));

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                leaderboard
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    /**
     * Use referral credits for purchase
     */
    useReferralCredits: async (req, res, next) => {
        try {
            const { body } = req;
            const { userId } = req.user; // From auth middleware

            const { error, value } = validateJoiSchema(ValidateUseCredits, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { creditsToUse } = value;

            const result = await referralService.useReferralCredits(userId, creditsToUse);

            if (!result.success) {
                return httpError(next, new Error(result.message), req, 400);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: result.message,
                creditsUsed: result.creditsUsed,
                remainingReferralCredits: result.remainingReferralCredits,
                newTotalCredits: result.newTotalCredits
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    /**
     * Generate referral link and sharing content
     */
    generateReferralLink: async (req, res, next) => {
        try {
            const { userId } = req.user; // From auth middleware

            const referralData = await referralService.generateReferralLink(userId);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                referralData
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    /**
     * Validate referral code (public endpoint for registration form)
     */
    validateReferralCode: async (req, res, next) => {
        try {
            const { referralCode } = req.params;

            if (!referralCode) {
                return httpError(next, new Error('Referral code is required'), req, 400);
            }

            // Just check if the referral code exists
            const User = (await import('../../models/user.model.js')).default;
            const referrer = await User.findOne({
                'referral.userReferralCode': referralCode.toUpperCase()
            }).select('name');

            if (!referrer) {
                return httpError(next, new Error('Invalid referral code'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                valid: true,
                referrerName: referrer.name,
                message: 'Valid referral code'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    /**
     * Admin: Get referral analytics and reports
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

            const User = (await import('../../models/user.model.js')).default;

            // Build date filter
            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            // Get referral analytics
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
                        'referral.referralCreditsUsed': 1,
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

            // Get total count
            const totalCount = await User.countDocuments({
                'referral.totalreferralCredits': { $gt: 0 },
                ...dateFilter
            });

            // Get overall statistics
            const overallStats = await User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        totalReferrers: {
                            $sum: { $cond: [{ $gt: ['$referral.totalreferralCredits', 0] }, 1, 0] }
                        },
                        totalCreditsAwarded: { $sum: '$referral.totalreferralCredits' },
                        totalCreditsUsed: { $sum: '$referral.referralCreditsUsed' },
                        totalReferrals: {
                            $sum: { $cond: [{ $ne: ['$referral.referredBy', null] }, 1, 0] }
                        }
                    }
                }
            ]);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                analytics,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit)
                },
                overallStats: overallStats[0] || {
                    totalUsers: 0,
                    totalReferrers: 0,
                    totalCreditsAwarded: 0,
                    totalCreditsUsed: 0,
                    totalReferrals: 0
                }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    }
};