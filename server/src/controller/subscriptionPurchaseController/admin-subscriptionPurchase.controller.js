import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import UserSubscription from '../../models/userSubscription.model.js'
import Transaction from '../../models/transaction.model.js'
import TimezoneUtil from '../../util/timezone.js'
import {
    validateJoiSchema,
    ValidateAdminSubscriptionQuery,
    ValidateAdminStatsQuery
} from '../../service/validationService.js'

export default {
    getAllPurchaseSubscriptions: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateAdminSubscriptionQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                page = 1,
                limit = 20,
                search,
                status,
                vendorAssigned,
                dateFrom,
                dateTo,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                category,
                priceMin,
                priceMax,
                subscriptionId
            } = req.query;

            const skip = (page - 1) * limit;
            const query = {};
            if (search) {
                query.$or = [
                    { '_id': { $regex: new RegExp(search, 'i') } },
                    { 'userId.name': { $regex: new RegExp(search, 'i') } },
                    { 'userId.emailAddress': { $regex: new RegExp(search, 'i') } },
                    { 'userId.phoneNumber': { $regex: new RegExp(search, 'i') } },
                    { 'subscriptionId.planName': { $regex: new RegExp(search, 'i') } },
                    { 'deliveryAddress.city': { $regex: new RegExp(search, 'i') } },
                    { 'deliveryAddress.zipCode': { $regex: new RegExp(search, 'i') } }
                ];
            }
            if (status) {
                if (status === 'newer') {
                    query.status = { $in: ['pending', 'active'] };
                } else if (status === 'older') {
                    query.status = { $in: ['completed', 'cancelled', 'expired'] };
                } else {
                    query.status = status;
                }
            }

            // Vendor assignment filter
            if (vendorAssigned) {
                if (vendorAssigned === 'assigned') {
                    query['vendorDetails.isVendorAssigned'] = true;
                } else if (vendorAssigned === 'unassigned') {
                    query['vendorDetails.isVendorAssigned'] = false;
                }
            }

            // Date range filter
            if (dateFrom || dateTo) {
                query.createdAt = {};
                if (dateFrom) query.createdAt.$gte = TimezoneUtil.toIST(dateFrom);
                if (dateTo) query.createdAt.$lte = TimezoneUtil.endOfDay(dateTo);
            }

            // Price range filter
            if (priceMin || priceMax) {
                query.finalPrice = {};
                if (priceMin) query.finalPrice.$gte = parseFloat(priceMin);
                if (priceMax) query.finalPrice.$lte = parseFloat(priceMax);
            }

            // Specific subscription filter
            if (subscriptionId) {
                query.subscriptionId = subscriptionId;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute aggregation pipeline for complex filtering
            const pipeline = [
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
                        from: 'vendorprofiles',
                        localField: 'vendorDetails.currentVendor.vendorId',
                        foreignField: '_id',
                        as: 'currentVendor'
                    }
                },
                {
                    $lookup: {
                        from: 'promocodes',
                        localField: 'promoCodeUsed',
                        foreignField: '_id',
                        as: 'promoCodeUsed'
                    }
                },
                {
                    $lookup: {
                        from: 'transactions',
                        localField: 'transactionId',
                        foreignField: '_id',
                        as: 'transactionId'
                    }
                },
                { $unwind: { path: '$transactionId', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$promoCodeUsed', preserveNullAndEmptyArrays: true } }
            ];

            // Add match stage for filtering
            if (Object.keys(query).length > 0) {
                pipeline.push({ $match: query });
            }

            // Category filter (after lookup)
            if (category) {
                pipeline.push({
                    $match: {
                        'subscriptionId.category': category
                    }
                });
            }

            // Add sort stage
            pipeline.push({ $sort: sort });

            // Get total count
            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await UserSubscription.aggregate(countPipeline);
            const totalSubscriptions = countResult.length > 0 ? countResult[0].total : 0;

            // Add pagination
            pipeline.push({ $skip: skip }, { $limit: Number(limit) });

            // Project only needed fields
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
                    'userId._id': 1,
                    'userId.name': 1,
                    'userId.emailAddress': 1,
                    'userId.phoneNumber': 1,
                    'subscriptionId._id': 1,
                    'subscriptionId.planName': 1,
                    'subscriptionId.category': 1,
                    'subscriptionId.duration': 1,
                    'subscriptionId.durationDays': 1,
                    'currentVendor.businessInfo': 1,
                    'currentVendor._id': 1,
                    'vendorDetails.isVendorAssigned': 1,
                    'vendorDetails.vendorSwitchUsed': 1,
                    'promoCodeUsed.code': 1,
                    'promoCodeUsed.discountValue': 1,
                    'transactionId.paymentId': 1,
                    'transactionId.completedAt': 1,
                    'transactionId.status': 1
                }
            });

            const subscriptions = await UserSubscription.aggregate(pipeline);
            const totalPages = Math.ceil(totalSubscriptions / limit);

            // Get summary statistics
            const statsQuery = {};
            if (Object.keys(query).length > 0) {
                Object.assign(statsQuery, query);
            }

            const stats = await UserSubscription.aggregate([
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
                ...(Object.keys(statsQuery).length > 0 ? [{ $match: statsQuery }] : []),
                ...(category ? [{ $match: { 'subscriptionId.category': category } }] : []),
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$finalPrice' },
                        totalSubscriptions: { $sum: 1 },
                        activeSubscriptions: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        },
                        pendingSubscriptions: {
                            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                        },
                        assignedVendors: {
                            $sum: { $cond: ['$vendorDetails.isVendorAssigned', 1, 0] }
                        },
                        unassignedVendors: {
                            $sum: { $cond: [{ $not: '$vendorDetails.isVendorAssigned' }, 1, 0] }
                        },
                        averagePrice: { $avg: '$finalPrice' }
                    }
                }
            ]);

            const summary = stats.length > 0 ? stats[0] : {
                totalRevenue: 0,
                totalSubscriptions: 0,
                activeSubscriptions: 0,
                pendingSubscriptions: 0,
                assignedVendors: 0,
                unassignedVendors: 0,
                averagePrice: 0
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscriptions,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalSubscriptions,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    limit: Number(limit)
                },
                summary,
                filters: {
                    search,
                    status,
                    vendorAssigned,
                    category,
                    dateRange: dateFrom || dateTo ? { from: dateFrom, to: dateTo } : null,
                    priceRange: priceMin || priceMax ? { min: priceMin, max: priceMax } : null
                }
            });

        } catch (error) {


            const errorMessage = error.message || 'Internal server error while processing admin request';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get purchase subscription by ID with full details for admin
    getPurchaseSubscriptionById: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;

            const subscription = await UserSubscription.findById(subscriptionId)
                .populate('userId', 'name emailAddress phoneNumber profilePicture addresses createdAt')
                .populate('subscriptionId', 'planName category duration durationDays features terms originalPrice discountedPrice')
                .populate('vendorDetails.currentVendor.vendorId', 'businessInfo contactInfo address isVerified rating capacity')
                .populate('promoCodeUsed', 'code discountType discountValue maxDiscount')
                .populate('transactionId', 'amount paymentId completedAt status type paymentGateway orderId')
                .populate('vendorDetails.vendorsAssignedHistory.vendorId', 'businessInfo')
                .populate('vendorDetails.vendorsAssignedHistory.assignedBy', 'name');

            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            // Get related vendor assignment requests
            const VendorAssignmentRequest = (await import('../../models/vendorSwitchRequest.model.js')).default;
            const vendorRequests = await VendorAssignmentRequest.find({
                userSubscriptionId: subscriptionId
            })
                .populate('currentVendorId', 'businessInfo')
                .populate('requestedVendorId', 'businessInfo')
                .populate('assignedBy', 'name')
                .sort({ createdAt: -1 });

            // Calculate analytics
            const remainingDays = subscription.getDaysRemaining();
            const dailyMealCount = subscription.getDailyMealCount();
            const totalMealsExpected = Math.max(0, remainingDays * dailyMealCount);
            const creditsUsedPercentage = subscription.creditsGranted > 0
                ? (subscription.creditsUsed / subscription.creditsGranted) * 100
                : 0;

            // Get delivery zone information
            const LocationZone = (await import('../../models/locationZone.model.js')).default;
            const deliveryZones = await LocationZone.findByPincode(subscription.deliveryAddress.zipCode);
            const deliveryZone = deliveryZones && deliveryZones.length > 0 ? deliveryZones[0] : null;

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscription,
                vendorRequests,
                deliveryZone,
                analytics: {
                    remainingDays,
                    dailyMealCount,
                    totalMealsExpected,
                    creditsUsedPercentage: Math.round(creditsUsedPercentage * 100) / 100,
                    isExpired: subscription.CheckisExpired(),
                    isActive: subscription.isActive(),
                    canSwitchVendor: subscription.canSwitchVendor(),
                    remainingCredits: subscription.getRemainingCredits()
                },
                timeline: {
                    purchased: subscription.createdAt,
                    paymentCompleted: subscription.transactionId?.completedAt,
                    subscriptionStart: subscription.startDate,
                    subscriptionEnd: subscription.endDate,
                    vendorAssigned: subscription.vendorDetails.currentVendor?.assignedAt,
                    lastUpdated: subscription.updatedAt
                }
            });

        } catch (error) {

            const errorMessage = error.message || 'Internal server error while processing admin request';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get subscription purchase statistics for admin dashboard
    getPurchaseSubscriptionStats: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateAdminStatsQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                period = '30d', // 7d, 30d, 90d, 1y, all
                category,
                startDate,
                endDate
            } = req.query;

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

            // Custom date range
            if (startDate && endDate) {
                dateFilter.createdAt = {
                    $gte: TimezoneUtil.toIST(startDate),
                    $lte: TimezoneUtil.endOfDay(endDate)
                };
            }

            // Overall statistics
            const overallStats = await UserSubscription.aggregate([
                { $match: dateFilter },
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
                        totalSubscriptions: { $sum: 1 },
                        totalRevenue: { $sum: '$finalPrice' },
                        averageOrderValue: { $avg: '$finalPrice' },
                        totalDiscountGiven: { $sum: '$discountApplied' },
                        activeSubscriptions: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        },
                        pendingSubscriptions: {
                            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                        },
                        cancelledSubscriptions: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        },
                        assignedVendors: {
                            $sum: { $cond: ['$vendorDetails.isVendorAssigned', 1, 0] }
                        }
                    }
                }
            ]);

            // Status-wise distribution
            const statusDistribution = await UserSubscription.aggregate([
                { $match: dateFilter },
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
                        _id: '$status',
                        count: { $sum: 1 },
                        revenue: { $sum: '$finalPrice' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Category-wise distribution (if no category filter applied)
            let categoryDistribution = [];
            if (!category) {
                categoryDistribution = await UserSubscription.aggregate([
                    { $match: dateFilter },
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
                        $group: {
                            _id: '$subscriptionId.category',
                            count: { $sum: 1 },
                            revenue: { $sum: '$finalPrice' },
                            averagePrice: { $avg: '$finalPrice' }
                        }
                    },
                    { $sort: { count: -1 } }
                ]);
            }

            // Monthly trend (for the current period)
            const monthlyTrend = await UserSubscription.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 },
                        revenue: { $sum: '$finalPrice' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Vendor assignment statistics
            const vendorStats = await UserSubscription.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalAssigned: {
                            $sum: { $cond: ['$vendorDetails.isVendorAssigned', 1, 0] }
                        },
                        totalUnassigned: {
                            $sum: { $cond: [{ $not: '$vendorDetails.isVendorAssigned' }, 1, 0] }
                        },
                        vendorSwitchesUsed: {
                            $sum: { $cond: ['$vendorDetails.vendorSwitchUsed', 1, 0] }
                        }
                    }
                }
            ]);

            const stats = overallStats.length > 0 ? overallStats[0] : {};
            const vendorStatistics = vendorStats.length > 0 ? vendorStats[0] : {};

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                period,
                category: category || 'all',
                dateRange: {
                    start: startDate || (dateFilter.createdAt?.$gte ? TimezoneUtil.format(dateFilter.createdAt.$gte, 'date') : null),
                    end: endDate || TimezoneUtil.format(now, 'date')
                },
                overall: {
                    ...stats,
                    ...vendorStatistics,
                    conversionRate: stats.totalSubscriptions > 0
                        ? ((stats.activeSubscriptions || 0) / stats.totalSubscriptions * 100).toFixed(2)
                        : 0,
                    cancellationRate: stats.totalSubscriptions > 0
                        ? ((stats.cancelledSubscriptions || 0) / stats.totalSubscriptions * 100).toFixed(2)
                        : 0
                },
                distribution: {
                    byStatus: statusDistribution,
                    byCategory: categoryDistribution
                },
                trends: {
                    monthly: monthlyTrend
                },
                vendorAssignment: vendorStatistics
            });

        } catch (error) {


            const errorMessage = error.message || 'Internal server error while processing admin request';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    }
};