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
import VendorAssignmentRequest from '../../models/vendorSwitchRequest.model.js'
import LocationZone from '../../models/locationZone.model.js'
import Subscription from '../../models/subscription.model.js'
import User from '../../models/user.model.js'
import promoCodeService from '../../service/promoCodeService.js'
import emailService from '../../service/emailService.js'
import whatsappService from '../../service/whatsappService.js'
import paymentService from '../../service/paymentService.js'
export default {
    getAllPurchaseSubscriptions: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateAdminSubscriptionQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            let {
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
                subscriptionId,
                endingSoon
            } = req.query;

            const skip = (page - 1) * limit;
            const query = {};

            if (endingSoon === 'true') {
                const now = TimezoneUtil.now();
                query.status = 'active';
                query.endDate = { $gte: now };
                // Override sort to show closest ending first
                req.query.sortBy = 'endDate';
                sortOrder = 'asc';
            }

            if (search) {
                query.$or = [
                    { '_id': { $regex: new RegExp(search, 'i') } },
                    { 'userId.name': { $regex: new RegExp(search, 'i') } },
                    { 'userId.emailAddress': { $regex: new RegExp(search, 'i') } },
                    { 'userId.phoneNumber': { $regex: new RegExp(search, 'i') } },
                    { 'transactionId.transactionId': { $regex: new RegExp(search, 'i') } },
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

            if (vendorAssigned) {
                if (vendorAssigned === 'assigned') {
                    query['vendorDetails.isVendorAssigned'] = true;
                } else if (vendorAssigned === 'unassigned') {
                    query['vendorDetails.isVendorAssigned'] = false;
                }
            }

            if (dateFrom || dateTo) {
                query.createdAt = {};
                if (dateFrom) query.createdAt.$gte = TimezoneUtil.toIST(dateFrom);
                if (dateTo) query.createdAt.$lte = TimezoneUtil.endOfDay(dateTo);
            }

            if (priceMin || priceMax) {
                query.finalPrice = {};
                if (priceMin) query.finalPrice.$gte = parseFloat(priceMin);
                if (priceMax) query.finalPrice.$lte = parseFloat(priceMax);
            }

            if (subscriptionId) {
                query.subscriptionId = subscriptionId;
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

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

            if (Object.keys(query).length > 0) {
                pipeline.push({ $match: query });
            }

            if (category) {
                pipeline.push({
                    $match: {
                        'subscriptionId.category': category
                    }
                });
            }

            pipeline.push({ $sort: sort });

            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await UserSubscription.aggregate(countPipeline);
            const totalSubscriptions = countResult.length > 0 ? countResult[0].total : 0;

            pipeline.push({ $skip: skip }, { $limit: Number(limit) });

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
                    'transactionId._id': 1,
                    'transactionId.transactionId': 1,
                    'transactionId.paymentId': 1,
                    'transactionId.completedAt': 1,
                    'transactionId.status': 1
                }
            });

            const subscriptions = await UserSubscription.aggregate(pipeline);
            const totalPages = Math.ceil(totalSubscriptions / limit);

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
                .populate('userId', 'name emailAddress phoneNumber createdAt')
                .populate('subscriptionId', 'planName category duration durationDays features terms originalPrice discountedPrice')
                .populate('vendorDetails.currentVendor.vendorId', 'businessInfo isVerified rating capacity')
                .populate('promoCodeUsed', 'code discountType discountValue maxDiscount')
                .populate('transactionId', 'amount paymentId completedAt status type paymentGateway orderId')
                .populate('vendorDetails.vendorsAssignedHistory.vendorId', 'businessInfo')
                .populate('vendorDetails.vendorsAssignedHistory.assignedBy', 'name');

            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }


            const vendorRequests = await VendorAssignmentRequest.find({
                userSubscriptionId: subscriptionId
            })
                .populate('currentVendorId', 'businessInfo')
                .populate('newVendorId', 'businessInfo')
                .populate('processedBy', 'name')
                .sort({ createdAt: -1 });

            const remainingDays = subscription.getDaysRemaining();
            const dailyMealCount = subscription.getDailyMealCount();
            const totalMealsExpected = Math.max(0, remainingDays * dailyMealCount);
            const creditsUsedPercentage = subscription.creditsGranted > 0
                ? (subscription.creditsUsed / subscription.creditsGranted) * 100
                : 0;


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
    },

    // Verify payment status with Razorpay and update local status if paid
    verifyPaymentStatus: async (req, res, next) => {
        try {
            const { transactionId } = req.params;

            const transaction = await Transaction.findById(transactionId)
                .populate('subscriptionId')
                .populate('userId');

            if (!transaction) {
                return httpError(next, new Error('Transaction not found'), req, 404);
            }

            if (transaction.status === 'success') {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    verified: true,
                    status: 'success',
                    message: 'Transaction is already marked as success'
                });
            }

            // Check if we have razorpay order ID to verify
            const razorpayOrderId = transaction.razorpayOrderId || transaction.gatewayOrderId || transaction.transactionId;

            if (!razorpayOrderId) {
                return httpError(next, new Error('No Razorpay Order ID found for this transaction'), req, 400);
            }

            console.log(razorpayOrderId);

            const payments = await paymentService.razorpay.orders.fetchPayments(razorpayOrderId);

            console.log(payments);
            const successfulPayment = payments.items.find(p => p.status === 'captured');
            console.log(successfulPayment);
            if (successfulPayment) {
                // Payment found and captured! Process it.
                const result = await paymentService.processSuccessfulPayment(transaction.transactionId, {
                    razorpay_order_id: razorpayOrderId,
                    razorpay_payment_id: successfulPayment.id,
                    razorpay_signature: 'manual_admin_verification' // Special signature for manual verification
                });

                // Create Vendor Assignment Request (Same logic as user controller)
                const userSubscription = result.userSubscription;
                const userId = transaction.userId._id || transaction.userId; // Handle populated or ID

                // 1. Promo Code Usage
                if (userSubscription.promoCodeUsed) {
                    await promoCodeService.usePromoCode(userSubscription.promoCodeUsed, userId);
                }

                // 2. Referral Logic
                if (userSubscription.referralDetails && userSubscription.referralDetails.isReferralUsed) {
                    const user = await User.findById(userId);

                    // Check if user already used referral code in another PAID subscription
                    if (user.referral.isReferralUsed && user.referral.usedReferralDetails.usedInSubscription) {
                        // User already used referral in another subscription
                        // Check if that subscription is paid (status = active/expired)
                        const previousSubscription = await UserSubscription.findById(
                            user.referral.usedReferralDetails.usedInSubscription
                        );

                        if (previousSubscription && (previousSubscription.status === 'active' || previousSubscription.status === 'expired')) {
                            console.log('Edge case detected: User already used referral in another paid subscription', {
                                userId,
                                previousSubscriptionId: previousSubscription._id,
                                currentSubscriptionId: userSubscription._id
                            });

                            // Clear referral details from current subscription
                            userSubscription.referralDetails.isReferralUsed = false;
                            userSubscription.referralDetails.referralCode = null;
                            userSubscription.referralDetails.referredBy = null;
                            await userSubscription.save();
                        } else {
                            user.referral.isReferralUsed = true;
                            user.referral.referralUsedAt = TimezoneUtil.now();
                            user.referral.usedReferralDetails = {
                                referralCode: userSubscription.referralDetails.referralCode,
                                referredBy: userSubscription.referralDetails.referredBy,
                                usedInSubscription: userSubscription._id
                            };
                            await user.save();
                        }
                    } else {
                        // First time using referral code
                        user.referral.isReferralUsed = true;
                        user.referral.referralUsedAt = TimezoneUtil.now();
                        user.referral.usedReferralDetails = {
                            referralCode: userSubscription.referralDetails.referralCode,
                            referredBy: userSubscription.referralDetails.referredBy,
                            usedInSubscription: userSubscription._id
                        };
                        await user.save();
                    }
                }

                const subscription = await Subscription.findById(userSubscription.subscriptionId);
                const deliveryZones = await LocationZone.findByPincode(userSubscription.deliveryAddress.zipCode);
                const zone = deliveryZones && deliveryZones.length > 0 ? deliveryZones[0] : null;

                const vendorAssignmentRequest = new VendorAssignmentRequest({
                    userSubscriptionId: userSubscription._id,
                    requestType: 'initial_assignment',
                    userId: userId,
                    currentVendorId: null,
                    reason: 'initial_purchase',
                    description: `Initial vendor assignment needed for new subscription purchase (Admin Verified)`,
                    requestedVendorType: subscription ? subscription.category : 'tiffin', // Fallback if sub not found
                    priority: 'high',
                    deliveryZone: zone?._id || null,
                    status: 'pending'
                });

                await vendorAssignmentRequest.save();

                // 3. Send Notifications
                try {
                    const user = await User.findById(userId);
                    const startDateStr = TimezoneUtil.format(userSubscription.startDate, 'date');
                    const endDateStr = TimezoneUtil.format(userSubscription.endDate, 'date');

                    // Send Email
                    if (user.emailAddress) {
                        await emailService.sendPurchaseSuccessEmail(
                            user.emailAddress,
                            user.name,
                            subscription ? subscription.planName : 'Subscription',
                            startDateStr,
                            endDateStr,
                            transaction.amount,
                            transaction.transactionId
                        );
                    }

                    // Send WhatsApp
                    if (user.phoneNumber && user.phoneNumber.internationalNumber) {
                        await whatsappService.sendPurchaseSuccessMessage(
                            user.phoneNumber.internationalNumber,
                            user.name,
                            subscription ? subscription.planName : 'Subscription',
                            transaction.amount,
                            startDateStr,
                            endDateStr,
                            transaction.transactionId
                        );
                    }
                } catch (notifyError) {
                    console.error("Notification Error:", notifyError);
                }

                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    verified: true,
                    status: 'success',
                    message: 'Payment verified, transaction updated, and vendor assignment request created successfully',
                    data: result,
                    vendorAssignmentRequestId: vendorAssignmentRequest._id
                });
            } else {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    verified: false,
                    status: transaction.status,
                    message: 'No captured payment found for this transaction on Razorpay'
                });
            }

        } catch (error) {
            console.error('Manual payment verification error:', error);
            const errorMessage = error.message || 'Internal server error while verifying payment';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    }
};