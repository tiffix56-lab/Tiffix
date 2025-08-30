import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import UserSubscription from '../../models/userSubscription.model.js'
import VendorProfile from '../../models/vendorProfile.model.js'
import TimezoneUtil from '../../util/timezone.js'
import {
    validateJoiSchema,
    ValidateVendorCustomerQuery,
    ValidateVendorAnalyticsQuery
} from '../../service/validationService.js'

export default {
    getAllMyCustomers: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateVendorCustomerQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                page = 1,
                limit = 15,
                search,
                status,
                deliveryAddress,
                amount,
                dateFrom,
                dateTo,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const vendorId = req.authenticatedUser._id;
            const skip = (page - 1) * limit;
            const vendorProfile = await VendorProfile.findOne({ userId: vendorId });
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            const query = {
                'vendorDetails.currentVendor.vendorId': vendorProfile._id,
                'vendorDetails.isVendorAssigned': true
            };

            // Status filter
            if (status) {
                if (status === 'active') {
                    query.status = 'active';
                    query.endDate = { $gte: TimezoneUtil.now() };
                } else if (status === 'expired') {
                    query.status = 'active';
                    query.endDate = { $lt: TimezoneUtil.now() };
                } else {
                    query.status = status;
                }
            }

            // Date range filter
            if (dateFrom || dateTo) {
                query.createdAt = {};
                if (dateFrom) query.createdAt.$gte = TimezoneUtil.toIST(dateFrom);
                if (dateTo) query.createdAt.$lte = TimezoneUtil.endOfDay(dateTo);
            }

            // Amount range filter
            if (amount) {
                const [min, max] = amount.split('-').map(Number);
                query.finalPrice = {};
                if (min) query.finalPrice.$gte = min;
                if (max) query.finalPrice.$lte = max;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Aggregation pipeline for complex filtering
            const pipeline = [
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userId'
                    }
                },
                { $unwind: '$userId' },
                {
                    $lookup: {
                        from: 'subscriptions',
                        localField: 'subscriptionId',
                        foreignField: '_id',
                        as: 'subscriptionId'
                    }
                },
                { $unwind: '$subscriptionId' },
                {
                    $lookup: {
                        from: 'promocodes',
                        localField: 'promoCodeUsed',
                        foreignField: '_id',
                        as: 'promoCodeUsed'
                    }
                },
                { $unwind: { path: '$promoCodeUsed', preserveNullAndEmptyArrays: true } }
            ];

            // Search filter (after lookups)
            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { '_id': { $regex: new RegExp(search, 'i') } },
                            { 'userId.name': { $regex: new RegExp(search, 'i') } },
                            { 'userId.emailAddress': { $regex: new RegExp(search, 'i') } },
                            { 'userId.phoneNumber': { $regex: new RegExp(search, 'i') } },
                            { 'subscriptionId.planName': { $regex: new RegExp(search, 'i') } },
                            { 'deliveryAddress.city': { $regex: new RegExp(search, 'i') } },
                            { 'deliveryAddress.zipCode': { $regex: new RegExp(search, 'i') } },
                            { 'deliveryAddress.street': { $regex: new RegExp(search, 'i') } }
                        ]
                    }
                });
            }

            // Delivery address filter
            if (deliveryAddress) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'deliveryAddress.city': { $regex: new RegExp(deliveryAddress, 'i') } },
                            { 'deliveryAddress.zipCode': { $regex: new RegExp(deliveryAddress, 'i') } },
                            { 'deliveryAddress.street': { $regex: new RegExp(deliveryAddress, 'i') } },
                            { 'deliveryAddress.landmark': { $regex: new RegExp(deliveryAddress, 'i') } }
                        ]
                    }
                });
            }

            // Add sort
            pipeline.push({ $sort: sort });

            // Get total count
            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await UserSubscription.aggregate(countPipeline);
            const totalCustomers = countResult.length > 0 ? countResult[0].total : 0;

            // Add pagination
            pipeline.push({ $skip: skip }, { $limit: Number(limit) });

            // Project required fields
            pipeline.push({
                $project: {
                    _id: 1,
                    status: 1,
                    startDate: 1,
                    endDate: 1,
                    finalPrice: 1,
                    originalPrice: 1,
                    discountApplied: 1,
                    deliveryAddress: 1,
                    mealTiming: 1,
                    creditsGranted: 1,
                    creditsUsed: 1,
                    skipCreditAvailable: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'vendorDetails.currentVendor.assignedAt': 1,
                    'userId._id': 1,
                    'userId.name': 1,
                    'userId.emailAddress': 1,
                    'userId.phoneNumber': 1,
                    'userId.profilePicture': 1,
                    'subscriptionId._id': 1,
                    'subscriptionId.planName': 1,
                    'subscriptionId.category': 1,
                    'subscriptionId.duration': 1,
                    'subscriptionId.durationDays': 1,
                    'promoCodeUsed.code': 1,
                    'promoCodeUsed.discountValue': 1,
                    // Calculated fields
                    daysRemaining: {
                        $ceil: {
                            $divide: [
                                { $subtract: ['$endDate', '$$NOW'] },
                                86400000 // milliseconds in a day
                            ]
                        }
                    },
                    isActive: {
                        $and: [
                            { $eq: ['$status', 'active'] },
                            { $gte: ['$endDate', '$$NOW'] }
                        ]
                    },
                    creditsRemainingPercentage: {
                        $multiply: [
                            {
                                $divide: [
                                    { $subtract: ['$creditsGranted', '$creditsUsed'] },
                                    '$creditsGranted'
                                ]
                            },
                            100
                        ]
                    }
                }
            });

            const customers = await UserSubscription.aggregate(pipeline);
            const totalPages = Math.ceil(totalCustomers / limit);

            // Get summary stats for this vendor
            const summaryStats = await UserSubscription.aggregate([
                {
                    $match: {
                        'vendorDetails.currentVendor.vendorId': vendorProfile._id,
                        'vendorDetails.isVendorAssigned': true
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCustomers: { $sum: 1 },
                        activeCustomers: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$status', 'active'] },
                                            { $gte: ['$endDate', '$$NOW'] }
                                        ]
                                    },
                                    1, 0
                                ]
                            }
                        },
                        totalRevenue: { $sum: '$finalPrice' },
                        averageOrderValue: { $avg: '$finalPrice' },
                        pendingCustomers: {
                            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                        },
                        cancelledCustomers: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        }
                    }
                }
            ]);

            const summary = summaryStats.length > 0 ? summaryStats[0] : {
                totalCustomers: 0,
                activeCustomers: 0,
                totalRevenue: 0,
                averageOrderValue: 0,
                pendingCustomers: 0,
                cancelledCustomers: 0
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                customers,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalCustomers,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    limit: Number(limit)
                },
                summary,
                vendorInfo: {
                    vendorId: vendorProfile._id,
                    businessName: vendorProfile.businessInfo?.businessName,
                    category: vendorProfile.businessInfo?.category,
                    rating: vendorProfile.rating
                },
                filters: {
                    search,
                    status,
                    deliveryAddress,
                    amount,
                    dateRange: dateFrom || dateTo ? { from: dateFrom, to: dateTo } : null
                }
            });

        } catch (error) {


            const errorMessage = error.message || 'Internal server error while processing vendor request';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get specific customer subscription details by ID for vendor
    getCustomerSubscriptionById: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;
            const vendorId = req.authenticatedUser._id;

            // Find vendor profile
            const vendorProfile = await VendorProfile.findOne({ userId: vendorId });
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            // Find subscription and verify it belongs to this vendor
            const subscription = await UserSubscription.findOne({
                _id: subscriptionId,
                'vendorDetails.currentVendor.vendorId': vendorProfile._id,
                'vendorDetails.isVendorAssigned': true
            })
                .populate('userId', 'name emailAddress phoneNumber profilePicture addresses createdAt preferences')
                .populate('subscriptionId', 'planName category duration durationDays features terms mealsPerPlan')
                .populate('promoCodeUsed', 'code discountType discountValue maxDiscount')
                .populate('transactionId', 'amount paymentId completedAt status type')
                .populate('vendorDetails.vendorsAssignedHistory.vendorId', 'businessInfo')
                .populate('vendorDetails.vendorsAssignedHistory.assignedBy', 'name');

            if (!subscription) {
                return httpError(next, new Error('Customer subscription not found or not assigned to you'), req, 404);
            }

            // Get delivery zone info
            const LocationZone = (await import('../../models/locationZone.model.js')).default;
            const deliveryZones = await LocationZone.findByPincode(subscription.deliveryAddress.zipCode);
            const deliveryZone = deliveryZones && deliveryZones.length > 0 ? deliveryZones[0] : null;

            // Calculate analytics
            const remainingDays = subscription.getDaysRemaining();
            const dailyMealCount = subscription.getDailyMealCount();
            const totalMealsExpected = Math.max(0, remainingDays * dailyMealCount);
            const creditsUsedPercentage = subscription.creditsGranted > 0
                ? (subscription.creditsUsed / subscription.creditsGranted) * 100
                : 0;

            // Get meal preferences from user
            const mealTypes = subscription.getMealTypes();
            const customerPreferences = subscription.userId?.preferences || {};

            // Calculate assignment duration
            const assignedAt = subscription.vendorDetails.currentVendor?.assignedAt;
            const assignmentDuration = assignedAt
                ? Math.floor((TimezoneUtil.now() - assignedAt) / (1000 * 60 * 60 * 24))
                : 0;

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscription,
                customer: {
                    ...subscription.userId.toObject(),
                    totalSubscriptions: await UserSubscription.countDocuments({
                        userId: subscription.userId._id
                    }),
                    activeSubscriptions: await UserSubscription.countDocuments({
                        userId: subscription.userId._id,
                        status: 'active',
                        endDate: { $gte: TimezoneUtil.now() }
                    })
                },
                deliveryZone,
                analytics: {
                    remainingDays,
                    dailyMealCount,
                    totalMealsExpected,
                    creditsUsedPercentage: Math.round(creditsUsedPercentage * 100) / 100,
                    isExpired: subscription.CheckisExpired(),
                    isActive: subscription.isActive(),
                    canSkipMeal: subscription.canSkipMeal(),
                    remainingCredits: subscription.getRemainingCredits(),
                    assignmentDuration,
                    mealTypes
                },
                preferences: {
                    dietary: customerPreferences.dietary || [],
                    allergies: customerPreferences.allergies || [],
                    spiceLevel: customerPreferences.spiceLevel || 'medium',
                    cuisinePreferences: customerPreferences.cuisinePreferences || []
                },
                timeline: {
                    subscriptionPurchased: subscription.createdAt,
                    paymentCompleted: subscription.transactionId?.completedAt,
                    subscriptionStart: subscription.startDate,
                    subscriptionEnd: subscription.endDate,
                    vendorAssigned: assignedAt,
                    lastUpdated: subscription.updatedAt
                },
                vendorAssignmentHistory: subscription.vendorDetails.vendorsAssignedHistory
            });

        } catch (error) {

            const errorMessage = error.message || 'Internal server error while processing vendor request';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get vendor's customer statistics and analytics
    getCustomerAnalytics: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateVendorAnalyticsQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                period = '30d', // 7d, 30d, 90d, 1y, all
                category
            } = req.query;

            const vendorId = req.authenticatedUser._id;

            // Find vendor profile
            const vendorProfile = await VendorProfile.findOne({ userId: vendorId });
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            let dateFilter = {};
            const now = TimezoneUtil.now();

            // Set date range based on period
            if (period !== 'all') {
                switch (period) {
                    case '7d':
                        dateFilter.createdAt = { $gte: TimezoneUtil.addDays(-7, now) };
                        break;
                    case '30d':
                        dateFilter.createdAt = { $gte: TimezoneUtil.addDays(-30, now) };
                        break;
                    case '90d':
                        dateFilter.createdAt = { $gte: TimezoneUtil.addDays(-90, now) };
                        break;
                    case '1y':
                        dateFilter.createdAt = { $gte: TimezoneUtil.addDays(-365, now) };
                        break;
                }
            }

            const baseQuery = {
                'vendorDetails.currentVendor.vendorId': vendorProfile._id,
                'vendorDetails.isVendorAssigned': true,
                ...dateFilter
            };

            // Overall statistics
            const overallStats = await UserSubscription.aggregate([
                { $match: baseQuery },
                ...(category ? [{
                    $lookup: {
                        from: 'subscriptions',
                        localField: 'subscriptionId',
                        foreignField: '_id',
                        as: 'subscriptionId'
                    }
                }, { $unwind: '$subscriptionId' }, {
                    $match: { 'subscriptionId.category': category }
                }] : []),
                {
                    $group: {
                        _id: null,
                        totalCustomers: { $sum: 1 },
                        totalRevenue: { $sum: '$finalPrice' },
                        averageOrderValue: { $avg: '$finalPrice' },
                        totalCreditsGranted: { $sum: '$creditsGranted' },
                        totalCreditsUsed: { $sum: '$creditsUsed' },
                        activeCustomers: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$status', 'active'] },
                                            { $gte: ['$endDate', now] }
                                        ]
                                    },
                                    1, 0
                                ]
                            }
                        },
                        pendingCustomers: {
                            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                        },
                        cancelledCustomers: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        },
                        completedCustomers: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        }
                    }
                }
            ]);

            // Status distribution
            const statusDistribution = await UserSubscription.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        revenue: { $sum: '$finalPrice' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Monthly customer acquisition trend
            const monthlyTrend = await UserSubscription.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        newCustomers: { $sum: 1 },
                        revenue: { $sum: '$finalPrice' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Top delivery areas
            const topDeliveryAreas = await UserSubscription.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: {
                            city: '$deliveryAddress.city',
                            zipCode: '$deliveryAddress.zipCode'
                        },
                        customerCount: { $sum: 1 },
                        totalRevenue: { $sum: '$finalPrice' }
                    }
                },
                { $sort: { customerCount: -1 } },
                { $limit: 10 }
            ]);

            // Customer retention analysis
            const retentionStats = await UserSubscription.aggregate([
                { $match: baseQuery },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $group: {
                        _id: '$user._id',
                        subscriptionCount: { $sum: 1 },
                        totalRevenue: { $sum: '$finalPrice' },
                        lastSubscription: { $max: '$createdAt' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        newCustomers: {
                            $sum: { $cond: [{ $eq: ['$subscriptionCount', 1] }, 1, 0] }
                        },
                        returningCustomers: {
                            $sum: { $cond: [{ $gt: ['$subscriptionCount', 1] }, 1, 0] }
                        },
                        averageRevenuePerCustomer: { $avg: '$totalRevenue' }
                    }
                }
            ]);

            const stats = overallStats.length > 0 ? overallStats[0] : {};
            const retention = retentionStats.length > 0 ? retentionStats[0] : {};

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                vendorInfo: {
                    vendorId: vendorProfile._id,
                    businessName: vendorProfile.businessInfo?.businessName,
                    category: vendorProfile.businessInfo?.category
                },
                period,
                dateRange: {
                    start: dateFilter.createdAt?.$gte ? TimezoneUtil.format(dateFilter.createdAt.$gte, 'date') : null,
                    end: TimezoneUtil.format(now, 'date')
                },
                overview: {
                    ...stats,
                    creditUtilizationRate: stats.totalCreditsGranted > 0
                        ? ((stats.totalCreditsUsed / stats.totalCreditsGranted) * 100).toFixed(2)
                        : 0,
                    customerRetentionRate: (retention.newCustomers + retention.returningCustomers) > 0
                        ? ((retention.returningCustomers / (retention.newCustomers + retention.returningCustomers)) * 100).toFixed(2)
                        : 0
                },
                distribution: {
                    byStatus: statusDistribution
                },
                trends: {
                    monthly: monthlyTrend
                },
                topDeliveryAreas,
                retention: {
                    ...retention,
                    totalUniqueCustomers: (retention.newCustomers || 0) + (retention.returningCustomers || 0)
                }
            });

        } catch (error) {


            const errorMessage = error.message || 'Internal server error while processing vendor request';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },


};