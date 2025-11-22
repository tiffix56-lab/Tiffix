import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import referralService from '../../service/referralService.js';
import User from '../../models/user.model.js';
import UserSubscription from '../../models/userSubscription.model.js';
import { validateJoiSchema, ValidateGetReferralUsedUsers, ValidateGetReferralDetailsById } from '../../service/validationService.js';
import TimezoneUtil from '../../util/timezone.js';

export default {
    /**
     * Get all users who used referral codes with pagination, filtering, and search
     * Admin only
     */
    getReferralUsedUsers: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateGetReferralUsedUsers, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                page = 1,
                limit = 10,
                search = '',
                sortBy = 'referralUsedAt',
                sortOrder = 'desc',
                hasActiveSubscription
            } = req.query;

            const skip = (page - 1) * limit;

            const matchQuery = {
                'referral.isReferralUsed': true,
                'referral.usedReferralDetails.referralCode': { $ne: null }
            };

            if (search) {
                matchQuery.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { emailAddress: { $regex: search, $options: 'i' } },
                    { 'phoneNumber.internationalNumber': { $regex: search, $options: 'i' } },
                    { 'referral.usedReferralDetails.referralCode': { $regex: search, $options: 'i' } }
                ];
            }

            const pipeline = [
                { $match: matchQuery },

                // Lookup the referrer (who referred this user)
                {
                    $lookup: {
                        from: 'users',
                        localField: 'referral.usedReferralDetails.referredBy',
                        foreignField: '_id',
                        as: 'referrerDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$referrerDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },

                // Lookup the subscription where referral was used
                {
                    $lookup: {
                        from: 'usersubscriptions',
                        localField: 'referral.usedReferralDetails.usedInSubscription',
                        foreignField: '_id',
                        as: 'subscriptionDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$subscriptionDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },

                // Lookup subscription plan details
                {
                    $lookup: {
                        from: 'subscriptions',
                        localField: 'subscriptionDetails.subscriptionId',
                        foreignField: '_id',
                        as: 'planDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$planDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },

                // Project required fields
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        emailAddress: 1,
                        phoneNumber: 1,
                        avatar: 1,
                        isActive: 1,
                        createdAt: 1,
                        'referral.isReferralUsed': 1,
                        'referral.referralUsedAt': 1,
                        'referral.usedReferralDetails': 1,
                        referrerDetails: {
                            _id: 1,
                            name: 1,
                            emailAddress: 1,
                            phoneNumber: 1,
                            'referral.userReferralCode': 1
                        },
                        subscriptionDetails: {
                            _id: 1,
                            status: 1,
                            startDate: 1,
                            endDate: 1,
                            finalPrice: 1,
                            createdAt: 1
                        },
                        planDetails: {
                            _id: 1,
                            planName: 1,
                            category: 1,
                            duration: 1
                        }
                    }
                }
            ];

            if (hasActiveSubscription === 'true') {
                pipeline.push({
                    $match: {
                        'subscriptionDetails.status': 'active'
                    }
                });
            } else if (hasActiveSubscription === 'false') {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'subscriptionDetails.status': { $ne: 'active' } },
                            { subscriptionDetails: { $exists: false } }
                        ]
                    }
                });
            }

            const sortObj = {};
            if (sortBy === 'referralUsedAt') {
                sortObj['referral.referralUsedAt'] = sortOrder === 'desc' ? -1 : 1;
            } else {
                sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
            }
            pipeline.push({ $sort: sortObj });

            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await User.aggregate(countPipeline);
            const totalUsers = countResult.length > 0 ? countResult[0].total : 0;

            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: parseInt(limit) });

            const users = await User.aggregate(pipeline);

            const formattedUsers = users.map(user => ({
                ...user,
                referral: {
                    ...user.referral,
                    referralUsedAt: user.referral?.referralUsedAt
                        ? TimezoneUtil.format(user.referral.referralUsedAt, 'datetime')
                        : null
                },
                subscriptionDetails: user.subscriptionDetails ? {
                    ...user.subscriptionDetails,
                    startDate: TimezoneUtil.format(user.subscriptionDetails.startDate, 'date'),
                    endDate: TimezoneUtil.format(user.subscriptionDetails.endDate, 'date'),
                    createdAt: TimezoneUtil.format(user.subscriptionDetails.createdAt, 'datetime')
                } : null
            }));

            const totalPages = Math.ceil(totalUsers / limit);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                users: formattedUsers,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalUsers,
                    limit: Number(limit),
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });

        } catch (error) {
            console.error('Get Referral Used Users Error:', {
                message: error.message,
                stack: error.stack
            });
            const errorMessage = error.message || 'Internal server error while fetching referral users';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Get detailed referral information for a specific user
     * Admin only
     */
    getReferralDetailsById: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateGetReferralDetailsById, req.params);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { userId } = req.params;

            const user = await User.findById(userId)
                .select('name emailAddress phoneNumber avatar isActive isBanned referral createdAt')
                .lean();

            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (!user.referral.isReferralUsed) {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    user: {
                        _id: user._id,
                        name: user.name,
                        emailAddress: user.emailAddress,
                        phoneNumber: user.phoneNumber,
                        isActive: user.isActive
                    },
                    hasUsedReferral: false,
                    message: 'This user has not used any referral code'
                });
            }

            let referrerDetails = null;
            if (user.referral.usedReferralDetails?.referredBy) {
                referrerDetails = await User.findById(user.referral.usedReferralDetails.referredBy)
                    .select('name emailAddress phoneNumber referral.userReferralCode avatar isActive')
                    .lean();
            }

            let subscriptionDetails = null;
            if (user.referral.usedReferralDetails?.usedInSubscription) {
                subscriptionDetails = await UserSubscription.findById(
                    user.referral.usedReferralDetails.usedInSubscription
                )
                    .populate('subscriptionId', 'planName category duration durationDays originalPrice discountedPrice')
                    .populate('transactionId', 'amount finalAmount paymentId completedAt status')
                    .lean();
            }

            const allSubscriptions = await UserSubscription.find({ userId: user._id })
                .populate('subscriptionId', 'planName category duration')
                .select('status startDate endDate finalPrice createdAt referralDetails')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            const response = {
                user: {
                    _id: user._id,
                    name: user.name,
                    emailAddress: user.emailAddress,
                    phoneNumber: user.phoneNumber,
                    avatar: user.avatar,
                    isActive: user.isActive,
                    isBanned: user.isBanned,
                    createdAt: TimezoneUtil.format(user.createdAt, 'datetime')
                },
                hasUsedReferral: true,
                referralInfo: {
                    referralCode: user.referral.usedReferralDetails?.referralCode || null,
                    referralUsedAt: user.referral.referralUsedAt
                        ? TimezoneUtil.format(user.referral.referralUsedAt, 'datetime')
                        : null
                },
                referrer: referrerDetails ? {
                    _id: referrerDetails._id,
                    name: referrerDetails.name,
                    emailAddress: referrerDetails.emailAddress,
                    phoneNumber: referrerDetails.phoneNumber,
                    avatar: referrerDetails.avatar,
                    isActive: referrerDetails.isActive,
                    ownReferralCode: referrerDetails.referral?.userReferralCode || null
                } : null,
                subscriptionUsedIn: subscriptionDetails ? {
                    _id: subscriptionDetails._id,
                    status: subscriptionDetails.status,
                    startDate: TimezoneUtil.format(subscriptionDetails.startDate, 'date'),
                    endDate: TimezoneUtil.format(subscriptionDetails.endDate, 'date'),
                    finalPrice: subscriptionDetails.finalPrice,
                    createdAt: TimezoneUtil.format(subscriptionDetails.createdAt, 'datetime'),
                    plan: subscriptionDetails.subscriptionId ? {
                        _id: subscriptionDetails.subscriptionId._id,
                        planName: subscriptionDetails.subscriptionId.planName,
                        category: subscriptionDetails.subscriptionId.category,
                        duration: subscriptionDetails.subscriptionId.duration,
                        originalPrice: subscriptionDetails.subscriptionId.originalPrice,
                        discountedPrice: subscriptionDetails.subscriptionId.discountedPrice
                    } : null,
                    transaction: subscriptionDetails.transactionId ? {
                        amount: subscriptionDetails.transactionId.amount,
                        finalAmount: subscriptionDetails.transactionId.finalAmount,
                        paymentId: subscriptionDetails.transactionId.paymentId,
                        status: subscriptionDetails.transactionId.status,
                        completedAt: subscriptionDetails.transactionId.completedAt
                            ? TimezoneUtil.format(subscriptionDetails.transactionId.completedAt, 'datetime')
                            : null
                    } : null
                } : null,
                subscriptionHistory: allSubscriptions.map(sub => ({
                    _id: sub._id,
                    status: sub.status,
                    startDate: TimezoneUtil.format(sub.startDate, 'date'),
                    endDate: TimezoneUtil.format(sub.endDate, 'date'),
                    finalPrice: sub.finalPrice,
                    createdAt: TimezoneUtil.format(sub.createdAt, 'datetime'),
                    planName: sub.subscriptionId?.planName || 'N/A',
                    category: sub.subscriptionId?.category || 'N/A',
                    usedReferralInThis: sub.referralDetails?.isReferralUsed || false
                }))
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, response);

        } catch (error) {
            console.error('Get Referral Details By ID Error:', {
                message: error.message,
                stack: error.stack,
                userId: req.params?.userId
            });
            const errorMessage = error.message || 'Internal server error while fetching referral details';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    }
};