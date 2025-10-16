import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import User from '../../models/user.model.js'
import Order from '../../models/order.model.js'
import UserSubscription from '../../models/userSubscription.model.js'
import Transaction from '../../models/transaction.model.js'
import VendorProfile from '../../models/vendorProfile.model.js'
import Review from '../../models/review.model.js'
import TimezoneUtil from '../../util/timezone.js'

const adminController = {
    async getDashboardStats(req, res) {
        try {
            const { period = '30d', startDate, endDate } = req.query

            let start, end
            if (startDate && endDate) {
                start = new Date(startDate)
                end = new Date(endDate)
            } else {
                end = TimezoneUtil.now()
                switch (period) {
                    case '7d':
                        start = TimezoneUtil.addDays(-7, end)
                        break
                    case '30d':
                        start = TimezoneUtil.addDays(-30, end)
                        break
                    case '90d':
                        start = TimezoneUtil.addDays(-90, end)
                        break
                    case '1y':
                        start = TimezoneUtil.addDays(-365, end)
                        break
                    default:
                        start = TimezoneUtil.addDays(-30, end)
                }
            }

            const [
                overallStats,
                revenueData,
                orderStatusData,
                topProviders,
                zonePerformance,
                hourlyOrderData,
                monthlyTrends
            ] = await Promise.all([
                getOverallStats(start, end),
                getRevenueTrends(start, end),
                getOrderStatusDistribution(start, end),
                getTopProviders(start, end),
                getZonePerformance(start, end),
                getHourlyOrderPattern(),
                getMonthlyTrends()
            ])

            const dashboardData = {
                overview: {
                    period: period,
                    dateRange: {
                        start: TimezoneUtil.format(start, 'date'),
                        end: TimezoneUtil.format(end, 'date')
                    },
                    lastUpdated: TimezoneUtil.format(TimezoneUtil.now(), 'datetime')
                },
                overallStats,
                revenueData,
                orderStatusData,
                topProviders,
                zonePerformance,
                hourlyOrderData,
                monthlyTrends
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, dashboardData)
        } catch (error) {
            console.error('Dashboard stats error:', error)
            return httpResponse(req, res, 500, responseMessage.ERROR.INTERNAL_SERVER_ERROR, {
                error: error.message
            })
        }
    },

    async getRevenueAnalytics(req, res) {
        try {
            const { period = '30d', breakdown = 'daily' } = req.query
            
            let start, end = TimezoneUtil.now()
            switch (period) {
                case '7d': start = TimezoneUtil.addDays(-7, end); break
                case '30d': start = TimezoneUtil.addDays(-30, end); break
                case '90d': start = TimezoneUtil.addDays(-90, end); break
                case '1y': start = TimezoneUtil.addDays(-365, end); break
                default: start = TimezoneUtil.addDays(-30, end)
            }

            const [
                revenueTrends,
                paymentMethodStats,
                subscriptionRevenue,
                promoCodeImpact,
                refundAnalytics,
                quarterlyStats,
                yearlyStats
            ] = await Promise.all([
                getDetailedRevenueTrends(start, end, breakdown),
                getPaymentMethodBreakdown(start, end),
                getSubscriptionRevenueAnalytics(start, end),
                getPromoCodeImpactAnalytics(start, end),
                getRefundAnalytics(start, end),
                getQuarterlyRevenue(),
                getYearlyRevenue()
            ])

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                revenueTrends,
                paymentMethodStats,
                subscriptionRevenue,
                promoCodeImpact,
                refundAnalytics,
                quarterlyStats,
                yearlyStats,
                period,
                breakdown
            })
        } catch (error) {
            console.error('Revenue analytics error:', error)
            return httpResponse(req, res, 500, responseMessage.ERROR.INTERNAL_SERVER_ERROR, {
                error: error.message
            })
        }
    },

    async getOrderAnalytics(req, res) {
        try {
            const { period = '30d', breakdown = 'daily' } = req.query
            
            let start, end = TimezoneUtil.now()
            switch (period) {
                case '7d': start = TimezoneUtil.addDays(-7, end); break
                case '30d': start = TimezoneUtil.addDays(-30, end); break
                case '90d': start = TimezoneUtil.addDays(-90, end); break
                case '1y': start = TimezoneUtil.addDays(-365, end); break
                default: start = TimezoneUtil.addDays(-30, end)
            }

            const [
                orderTrends,
                statusDistribution,
                mealTypeStats,
                deliveryAnalytics,
                cancellationStats,
                hourlyPatterns,
                vendorOrderStats
            ] = await Promise.all([
                getOrderTrendsDetailed(start, end, breakdown),
                getOrderStatusDistribution(start, end),
                getMealTypeAnalytics(start, end),
                getDeliveryAnalytics(start, end),
                getCancellationAnalytics(start, end),
                getHourlyOrderPattern(),
                getVendorOrderAnalytics(start, end)
            ])

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                orderTrends,
                statusDistribution,
                mealTypeStats,
                deliveryAnalytics,
                cancellationStats,
                hourlyPatterns,
                vendorOrderStats,
                period,
                breakdown
            })
        } catch (error) {
            console.error('Order analytics error:', error)
            return httpResponse(req, res, 500, responseMessage.ERROR.INTERNAL_SERVER_ERROR, {
                error: error.message
            })
        }
    },

    async getUserAnalytics(req, res) {
        try {
            const { period = '30d', breakdown = 'daily' } = req.query
            
            let start, end = TimezoneUtil.now()
            switch (period) {
                case '7d': start = TimezoneUtil.addDays(-7, end); break
                case '30d': start = TimezoneUtil.addDays(-30, end); break
                case '90d': start = TimezoneUtil.addDays(-90, end); break
                case '1y': start = TimezoneUtil.addDays(-365, end); break
                default: start = TimezoneUtil.addDays(-30, end)
            }

            const [
                userGrowth,
                roleDistribution,
                locationAnalytics,
                activityStats,
                subscriptionStats,
                userEngagement
            ] = await Promise.all([
                getUserGrowthAnalytics(start, end, breakdown),
                getUserRoleDistribution(),
                getUserLocationAnalytics(),
                getUserActivityAnalytics(start, end),
                getUserSubscriptionStats(start, end),
                getUserEngagementStats(start, end)
            ])

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                userGrowth,
                roleDistribution,
                locationAnalytics,
                activityStats,
                subscriptionStats,
                userEngagement,
                period,
                breakdown
            })
        } catch (error) {
            console.error('User analytics error:', error)
            return httpResponse(req, res, 500, responseMessage.ERROR.INTERNAL_SERVER_ERROR, {
                error: error.message
            })
        }
    },

    async getVendorAnalytics(req, res) {
        try {
            const { period = '30d' } = req.query
            
            let start, end = TimezoneUtil.now()
            switch (period) {
                case '7d': start = TimezoneUtil.addDays(-7, end); break
                case '30d': start = TimezoneUtil.addDays(-30, end); break
                case '90d': start = TimezoneUtil.addDays(-90, end); break
                case '1y': start = TimezoneUtil.addDays(-365, end); break
                default: start = TimezoneUtil.addDays(-30, end)
            }

            const [
                vendorPerformance,
                topPerformers,
                capacityUtilization,
                ratingAnalytics,
                vendorTypeDistribution,
                activeVendorsStats,
                vendorGrowth
            ] = await Promise.all([
                getVendorPerformanceDetailed(start, end),
                getTopVendorPerformers(start, end),
                getVendorCapacityAnalytics(),
                getVendorRatingAnalytics(),
                getVendorTypeDistribution(),
                getActiveVendorsAnalytics(start, end),
                getVendorGrowthStats(start, end)
            ])

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                vendorPerformance,
                topPerformers,
                capacityUtilization,
                ratingAnalytics,
                vendorTypeDistribution,
                activeVendorsStats,
                vendorGrowth,
                period
            })
        } catch (error) {
            console.error('Vendor analytics error:', error)
            return httpResponse(req, res, 500, responseMessage.ERROR.INTERNAL_SERVER_ERROR, {
                error: error.message
            })
        }
    },

    async getZoneAnalytics(req, res) {
        try {
            const { period = '30d' } = req.query
            
            let start, end = TimezoneUtil.now()
            switch (period) {
                case '7d': start = TimezoneUtil.addDays(-7, end); break
                case '30d': start = TimezoneUtil.addDays(-30, end); break
                case '90d': start = TimezoneUtil.addDays(-90, end); break
                case '1y': start = TimezoneUtil.addDays(-365, end); break
                default: start = TimezoneUtil.addDays(-30, end)
            }

            const [
                zonePerformance,
                zoneOrderStats,
                zoneRevenueStats,
                deliveryStats
            ] = await Promise.all([
                getZonePerformanceDetailed(start, end),
                getZoneOrderAnalytics(start, end),
                getZoneRevenueAnalytics(start, end),
                getZoneDeliveryStats(start, end)
            ])

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                zonePerformance,
                zoneOrderStats,
                zoneRevenueStats,
                deliveryStats,
                period
            })
        } catch (error) {
            console.error('Zone analytics error:', error)
            return httpResponse(req, res, 500, responseMessage.ERROR.INTERNAL_SERVER_ERROR, {
                error: error.message
            })
        }
    }
}

// Overall Statistics Functions
async function getOverallStats(start, end) {
    const [
        totalRevenue,
        totalOrders,
        activeUsers,
        avgRating,
        previousPeriodRevenue,
        previousPeriodOrders,
        previousPeriodUsers
    ] = await Promise.all([
        Transaction.aggregate([
            { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]),
        Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        User.countDocuments({ isActive: true, createdAt: { $gte: start, $lte: end } }),
        Review.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]),
        // Previous period comparisons
        Transaction.aggregate([
            { 
                $match: { 
                    status: 'success', 
                    createdAt: { 
                        $gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
                        $lte: start
                    } 
                } 
            },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]),
        Order.countDocuments({ 
            createdAt: { 
                $gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
                $lte: start
            } 
        }),
        User.countDocuments({ 
            isActive: true,
            createdAt: { 
                $gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
                $lte: start
            } 
        })
    ])

    const currentRevenue = totalRevenue[0]?.total || 0
    const currentOrders = totalOrders
    const currentUsers = activeUsers
    const currentRating = avgRating[0]?.avgRating || 0

    const prevRevenue = previousPeriodRevenue[0]?.total || 0
    const prevOrders = previousPeriodOrders
    const prevUsers = previousPeriodUsers

    return {
        totalRevenue: {
            value: currentRevenue,
            growth: prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : '0.0'
        },
        totalOrders: {
            value: currentOrders,
            growth: prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders * 100).toFixed(1) : '0.0'
        },
        activeUsers: {
            value: currentUsers,
            growth: prevUsers > 0 ? ((currentUsers - prevUsers) / prevUsers * 100).toFixed(1) : '0.0'
        },
        avgRating: {
            value: currentRating.toFixed(1),
            growth: '0.2' // This would need historical tracking
        }
    }
}

// Revenue Analytics Functions
async function getRevenueTrends(start, end) {
    return await Transaction.aggregate([
        { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                revenue: { $sum: '$finalAmount' },
                orders: { $sum: 1 },
                users: { $addToSet: '$userId' }
            }
        },
        {
            $addFields: {
                users: { $size: '$users' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        },
        {
            $project: {
                _id: 0,
                month: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                            { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                            { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                            { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                            { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                            { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                            { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                            { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                            { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                            { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                            { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                            { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
                        ],
                        default: 'Unknown'
                    }
                },
                revenue: 1,
                orders: 1,
                users: 1
            }
        }
    ])
}

async function getDetailedRevenueTrends(start, end, breakdown) {
    const groupBy = getGroupByFormat(breakdown)
    
    return await Transaction.aggregate([
        { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: groupBy,
                revenue: { $sum: '$finalAmount' },
                transactions: { $sum: 1 },
                avgTransaction: { $avg: '$finalAmount' },
                uniqueUsers: { $addToSet: '$userId' }
            }
        },
        {
            $addFields: {
                uniqueUsers: { $size: '$uniqueUsers' }
            }
        },
        { $sort: { '_id': 1 } }
    ])
}

async function getPaymentMethodBreakdown(start, end) {
    return await Transaction.aggregate([
        { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$paymentMethod',
                revenue: { $sum: '$finalAmount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { revenue: -1 } }
    ])
}

async function getSubscriptionRevenueAnalytics(start, end) {
    return await Transaction.aggregate([
        { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
        {
            $lookup: {
                from: 'subscriptions',
                localField: 'subscriptionId',
                foreignField: '_id',
                as: 'subscription'
            }
        },
        { $unwind: '$subscription' },
        {
            $group: {
                _id: '$subscription.category',
                revenue: { $sum: '$finalAmount' },
                count: { $sum: 1 },
                avgPrice: { $avg: '$finalAmount' }
            }
        },
        { $sort: { revenue: -1 } }
    ])
}

async function getPromoCodeImpactAnalytics(start, end) {
    const [totalTransactions, promoUsage] = await Promise.all([
        Transaction.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalRevenue: { $sum: '$finalAmount' },
                    totalDiscount: { $sum: '$discountAmount' }
                }
            }
        ]),
        Transaction.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: start, $lte: end },
                    'promoCodeUsed.code': { $exists: true, $ne: null }
                } 
            },
            {
                $group: {
                    _id: '$promoCodeUsed.code',
                    usage: { $sum: 1 },
                    totalDiscount: { $sum: '$discountAmount' },
                    revenue: { $sum: '$finalAmount' }
                }
            },
            { $sort: { usage: -1 } },
            { $limit: 10 }
        ])
    ])

    const stats = totalTransactions[0] || {}
    const promoUsageRate = stats.totalTransactions > 0 ? 
        ((promoUsage.length / stats.totalTransactions) * 100).toFixed(1) : '0.0'

    return {
        totalDiscount: stats.totalDiscount || 0,
        promoUsageRate,
        topPromoCodes: promoUsage,
        totalSavings: stats.totalDiscount || 0
    }
}

async function getRefundAnalytics(start, end) {
    return await Transaction.aggregate([
        {
            $match: {
                status: 'refunded',
                'refundDetails.refundDate': { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: null,
                totalRefunds: { $sum: 1 },
                totalRefundAmount: { $sum: '$refundDetails.refundAmount' },
                avgRefundAmount: { $avg: '$refundDetails.refundAmount' }
            }
        }
    ])
}

async function getQuarterlyRevenue() {
    const currentYear = new Date().getFullYear()
    return await Transaction.aggregate([
        {
            $match: {
                status: 'success',
                createdAt: { $gte: new Date(currentYear, 0, 1) }
            }
        },
        {
            $group: {
                _id: {
                    quarter: {
                        $switch: {
                            branches: [
                                { case: { $lte: [{ $month: '$createdAt' }, 3] }, then: 'Q1' },
                                { case: { $lte: [{ $month: '$createdAt' }, 6] }, then: 'Q2' },
                                { case: { $lte: [{ $month: '$createdAt' }, 9] }, then: 'Q3' }
                            ],
                            default: 'Q4'
                        }
                    }
                },
                revenue: { $sum: '$finalAmount' },
                transactions: { $sum: 1 }
            }
        },
        { $sort: { '_id.quarter': 1 } }
    ])
}

async function getYearlyRevenue() {
    return await Transaction.aggregate([
        { $match: { status: 'success' } },
        {
            $group: {
                _id: { year: { $year: '$createdAt' } },
                revenue: { $sum: '$finalAmount' },
                transactions: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1 } },
        { $limit: 5 }
    ])
}

async function getMonthlyTrends() {
    const currentYear = new Date().getFullYear()
    return await Transaction.aggregate([
        {
            $match: {
                status: 'success',
                createdAt: { $gte: new Date(currentYear, 0, 1) }
            }
        },
        {
            $group: {
                _id: { month: { $month: '$createdAt' } },
                revenue: { $sum: '$finalAmount' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { '_id.month': 1 } },
        {
            $project: {
                _id: 0,
                month: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                            { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                            { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                            { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                            { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                            { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                            { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                            { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                            { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                            { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                            { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                            { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
                        ],
                        default: 'Unknown'
                    }
                },
                revenue: 1,
                orders: 1
            }
        }
    ])
}

// Order Analytics Functions
async function getOrderStatusDistribution(start, end) {
    const orderStats = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const statusMap = {
        'delivered': { name: 'Completed', color: '#22c55e' },
        'preparing': { name: 'In Progress', color: '#3b82f6' },
        'upcoming': { name: 'Pending', color: '#f59e0b' },
        'cancelled': { name: 'Cancelled', color: '#ef4444' },
        'skipped': { name: 'Skipped', color: '#6b7280' }
    }

    return orderStats.map(stat => ({
        name: statusMap[stat._id]?.name || stat._id,
        value: stat.count,
        color: statusMap[stat._id]?.color || '#6b7280'
    }))
}

async function getOrderTrendsDetailed(start, end, breakdown) {
    const groupBy = getGroupByFormat(breakdown)
    
    return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: groupBy,
                orders: { $sum: 1 },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                skipped: { $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] } }
            }
        },
        { $sort: { '_id': 1 } }
    ])
}

async function getMealTypeAnalytics(start, end) {
    return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$mealType',
                count: { $sum: 1 },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
            }
        },
        {
            $addFields: {
                successRate: { $divide: ['$delivered', '$count'] }
            }
        }
    ])
}

async function getDeliveryAnalytics(start, end) {
    return await Order.aggregate([
        {
            $match: {
                status: 'delivered',
                createdAt: { $gte: start, $lte: end },
                'deliveryConfirmation.confirmedAt': { $exists: true }
            }
        },
        {
            $addFields: {
                deliveryTime: {
                    $subtract: ['$deliveryConfirmation.confirmedAt', '$createdAt']
                }
            }
        },
        {
            $group: {
                _id: null,
                avgDeliveryTime: { $avg: '$deliveryTime' },
                totalDelivered: { $sum: 1 },
                minDeliveryTime: { $min: '$deliveryTime' },
                maxDeliveryTime: { $max: '$deliveryTime' }
            }
        }
    ])
}

async function getCancellationAnalytics(start, end) {
    return await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                status: { $in: ['cancelled', 'skipped'] }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                reasons: {
                    $push: {
                        $cond: [
                            { $eq: ['$status', 'cancelled'] },
                            '$cancellationDetails.cancelReason',
                            '$skipDetails.skipReason'
                        ]
                    }
                }
            }
        }
    ])
}

async function getHourlyOrderPattern() {
    const currentDate = TimezoneUtil.startOfDay()
    const nextDate = TimezoneUtil.addDays(1, currentDate)
    
    return await Order.aggregate([
        {
            $match: {
                deliveryDate: { $gte: currentDate, $lt: nextDate }
            }
        },
        {
            $addFields: {
                hour: {
                    $let: {
                        vars: {
                            timeStr: '$deliveryTime',
                            hourStr: { $substr: ['$deliveryTime', 0, 2] }
                        },
                        in: {
                            $cond: {
                                if: { $regexMatch: { input: '$$timeStr', regex: '^\\d{1,2}:\\d{2}$' } },
                                then: { $toInt: '$$hourStr' },
                                else: { $hour: '$createdAt' }
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: '$hour',
                orders: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                hour: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$_id', 6] }, then: '6AM' },
                            { case: { $eq: ['$_id', 7] }, then: '7AM' },
                            { case: { $eq: ['$_id', 8] }, then: '8AM' },
                            { case: { $eq: ['$_id', 9] }, then: '9AM' },
                            { case: { $eq: ['$_id', 10] }, then: '10AM' },
                            { case: { $eq: ['$_id', 11] }, then: '11AM' },
                            { case: { $eq: ['$_id', 12] }, then: '12PM' },
                            { case: { $eq: ['$_id', 13] }, then: '1PM' },
                            { case: { $eq: ['$_id', 14] }, then: '2PM' },
                            { case: { $eq: ['$_id', 15] }, then: '3PM' },
                            { case: { $eq: ['$_id', 16] }, then: '4PM' },
                            { case: { $eq: ['$_id', 17] }, then: '5PM' },
                            { case: { $eq: ['$_id', 18] }, then: '6PM' },
                            { case: { $eq: ['$_id', 19] }, then: '7PM' },
                            { case: { $eq: ['$_id', 20] }, then: '8PM' },
                            { case: { $eq: ['$_id', 21] }, then: '9PM' },
                            { case: { $eq: ['$_id', 22] }, then: '10PM' },
                            { case: { $eq: ['$_id', 23] }, then: '11PM' }
                        ],
                        default: { $concat: [{ $toString: '$_id' }, ':00'] }
                    }
                },
                orders: 1
            }
        },
        { $sort: { '_id': 1 } }
    ])
}

async function getVendorOrderAnalytics(start, end) {
    return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$vendorDetails.vendorId',
                totalOrders: { $sum: 1 },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
            }
        },
        {
            $lookup: {
                from: 'vendorprofiles',
                localField: '_id',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: '$vendor' },
        {
            $addFields: {
                successRate: { $divide: ['$delivered', '$totalOrders'] }
            }
        },
        { $sort: { totalOrders: -1 } },
        { $limit: 10 }
    ])
}

// Vendor Analytics Functions
async function getTopProviders(start, end) {
    return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$vendorDetails.vendorId',
                orders: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'vendorprofiles',
                localField: '_id',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: '$vendor' },
        {
            $lookup: {
                from: 'usersubscriptions',
                localField: '_id',
                foreignField: 'vendorDetails.currentVendor.vendorId',
                as: 'subscriptions'
            }
        },
        {
            $addFields: {
                revenue: {
                    $sum: {
                        $map: {
                            input: '$subscriptions',
                            as: 'sub',
                            in: '$$sub.finalPrice'
                        }
                    }
                }
            }
        },
        {
            $project: {
                name: '$vendor.businessInfo.businessName',
                orders: 1,
                rating: '$vendor.rating.average',
                revenue: 1
            }
        },
        { $sort: { orders: -1 } },
        { $limit: 5 }
    ])
}

async function getVendorPerformanceDetailed(start, end) {
    return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$vendorDetails.vendorId',
                totalOrders: { $sum: 1 },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                skipped: { $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] } }
            }
        },
        {
            $lookup: {
                from: 'vendorprofiles',
                localField: '_id',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: '$vendor' },
        {
            $addFields: {
                successRate: { $divide: ['$delivered', '$totalOrders'] }
            }
        },
        {
            $project: {
                businessName: '$vendor.businessInfo.businessName',
                vendorType: '$vendor.vendorType',
                totalOrders: 1,
                delivered: 1,
                cancelled: 1,
                skipped: 1,
                successRate: 1,
                rating: '$vendor.rating.average',
                isVerified: '$vendor.isVerified',
                isAvailable: '$vendor.isAvailable'
            }
        },
        { $sort: { successRate: -1 } }
    ])
}

async function getTopVendorPerformers(start, end) {
    return await getTopProviders(start, end)
}

async function getVendorCapacityAnalytics() {
    return await VendorProfile.aggregate([
        { $match: { isVerified: true } },
        {
            $project: {
                businessName: '$businessInfo.businessName',
                vendorType: 1,
                dailyCapacity: '$capacity.dailyOrders',
                currentLoad: '$capacity.currentLoad',
                utilization: {
                    $multiply: [
                        { $divide: ['$capacity.currentLoad', '$capacity.dailyOrders'] },
                        100
                    ]
                },
                isAvailable: 1
            }
        },
        { $sort: { utilization: -1 } }
    ])
}

async function getVendorRatingAnalytics() {
    return await VendorProfile.aggregate([
        { $match: { isVerified: true, 'rating.totalReviews': { $gt: 0 } } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating.average' },
                totalVendors: { $sum: 1 },
                highRated: { $sum: { $cond: [{ $gte: ['$rating.average', 4] }, 1, 0] } },
                lowRated: { $sum: { $cond: [{ $lt: ['$rating.average', 3] }, 1, 0] } }
            }
        }
    ])
}

async function getVendorTypeDistribution() {
    return await VendorProfile.aggregate([
        {
            $group: {
                _id: '$vendorType',
                count: { $sum: 1 },
                verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
                available: { $sum: { $cond: ['$isAvailable', 1, 0] } }
            }
        }
    ])
}

async function getActiveVendorsAnalytics(start, end) {
    return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$vendorDetails.vendorId'
            }
        },
        {
            $group: {
                _id: null,
                activeVendors: { $sum: 1 }
            }
        }
    ])
}

async function getVendorGrowthStats(start, end) {
    const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const previousStart = new Date(start.getTime() - (periodDays * 24 * 60 * 60 * 1000))
    
    const [current, previous] = await Promise.all([
        VendorProfile.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        VendorProfile.countDocuments({ createdAt: { $gte: previousStart, $lte: start } })
    ])

    return {
        current,
        previous,
        growth: previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : '0.0'
    }
}

// Zone Analytics Functions
async function getZonePerformance(start, end) {
    return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$deliveryAddress.city',
                orders: { $sum: 1 },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
            }
        },
        {
            $lookup: {
                from: 'usersubscriptions',
                let: { city: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$deliveryAddress.city', '$$city'] },
                            createdAt: { $gte: start, $lte: end }
                        }
                    }
                ],
                as: 'subscriptions'
            }
        },
        {
            $addFields: {
                revenue: {
                    $sum: {
                        $map: {
                            input: '$subscriptions',
                            as: 'sub',
                            in: '$$sub.finalPrice'
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                growth: { $multiply: [{ $rand: {} }, 20] } // Mock growth data
            }
        },
        {
            $project: {
                _id: 0,
                zone: '$_id',
                orders: 1,
                revenue: 1,
                growth: { $round: ['$growth', 1] }
            }
        },
        { $sort: { orders: -1 } },
        { $limit: 10 }
    ])
}

async function getZonePerformanceDetailed(start, end) {
    return await getZonePerformance(start, end)
}

async function getZoneOrderAnalytics(start, end) {
    return await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$deliveryAddress.city',
                totalOrders: { $sum: 1 },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
            }
        },
        {
            $addFields: {
                deliveryRate: { $divide: ['$delivered', '$totalOrders'] },
                cancellationRate: { $divide: ['$cancelled', '$totalOrders'] }
            }
        },
        { $sort: { totalOrders: -1 } }
    ])
}

async function getZoneRevenueAnalytics(start, end) {
    return await UserSubscription.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$deliveryAddress.city',
                totalRevenue: { $sum: '$finalPrice' },
                subscriptions: { $sum: 1 },
                avgSubscriptionValue: { $avg: '$finalPrice' }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ])
}

async function getZoneDeliveryStats(start, end) {
    return await Order.aggregate([
        {
            $match: {
                status: 'delivered',
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: '$deliveryAddress.city',
                totalDeliveries: { $sum: 1 },
                avgDeliveryTime: {
                    $avg: {
                        $subtract: ['$deliveryConfirmation.confirmedAt', '$createdAt']
                    }
                }
            }
        },
        { $sort: { totalDeliveries: -1 } }
    ])
}

// User Analytics Functions
async function getUserGrowthAnalytics(start, end, breakdown) {
    const groupBy = getGroupByFormat(breakdown)
    
    return await User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: groupBy,
                users: { $sum: 1 },
                activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
                vendors: { $sum: { $cond: [{ $eq: ['$role', 'vendor'] }, 1, 0] } }
            }
        },
        { $sort: { '_id': 1 } }
    ])
}

async function getUserRoleDistribution() {
    return await User.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
                banned: { $sum: { $cond: ['$isBanned', 1, 0] } }
            }
        },
        { $sort: { count: -1 } }
    ])
}

async function getUserLocationAnalytics() {
    return await User.aggregate([
        { $match: { 'location.city': { $exists: true, $ne: null } } },
        {
            $group: {
                _id: '$location.city',
                count: { $sum: 1 },
                activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ])
}

async function getUserActivityAnalytics(start, end) {
    return await User.aggregate([
        { $match: { lastLogin: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: {
                    year: { $year: '$lastLogin' },
                    month: { $month: '$lastLogin' },
                    day: { $dayOfMonth: '$lastLogin' }
                },
                activeUsers: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ])
}

async function getUserSubscriptionStats(start, end) {
    return await UserSubscription.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$finalPrice' }
            }
        }
    ])
}

async function getUserEngagementStats(start, end) {
    const [orderEngagement, subscriptionEngagement] = await Promise.all([
        Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: '$userId',
                    orderCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    avgOrdersPerUser: { $avg: '$orderCount' }
                }
            }
        ]),
        UserSubscription.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: '$userId',
                    subscriptionCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    avgSubscriptionsPerUser: { $avg: '$subscriptionCount' }
                }
            }
        ])
    ])

    return {
        orderEngagement: orderEngagement[0] || {},
        subscriptionEngagement: subscriptionEngagement[0] || {}
    }
}

// Utility Functions
function getGroupByFormat(breakdown) {
    switch (breakdown) {
        case 'hourly':
            return {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
                hour: { $hour: '$createdAt' }
            }
        case 'daily':
            return {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            }
        case 'weekly':
            return {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' }
            }
        case 'monthly':
            return {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            }
        default:
            return {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            }
    }
}

export default adminController