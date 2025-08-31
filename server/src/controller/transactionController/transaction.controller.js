import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import { validateJoiSchema } from '../../service/validationService.js'
import Transaction from '../../models/transaction.model.js'
import UserSubscription from '../../models/userSubscription.model.js'
import { ValidateTransactionQuery, ValidateRefundTransaction } from '../../service/validationService.js'
import paymentService from '../../service/paymentService.js'
import TimezoneUtil from "../../util/timezone.js"
export default {
    // Admin: Get all transactions with advanced filtering
    getAllTransactions: async (req, res, next) => {
        try {
            const { query } = req

            const { error, value } = validateJoiSchema(ValidateTransactionQuery, query)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const {
                page = 1,
                limit = 10,
                status,
                paymentMethod,
                type,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search,
                userId,
                subscriptionId
            } = value

            const skip = (page - 1) * limit
            const filter = {}

            // Apply filters
            if (status) filter.status = status
            if (paymentMethod) filter.paymentMethod = paymentMethod
            if (type) filter.type = type
            if (userId) filter.userId = userId
            if (subscriptionId) filter.subscriptionId = subscriptionId

            // Date range filter
            if (startDate || endDate) {
                filter.createdAt = {}
                if (startDate) filter.createdAt.$gte = new Date(startDate)
                if (endDate) {
                    const endDateTime = new Date(endDate)
                    endDateTime.setHours(23, 59, 59, 999)
                    filter.createdAt.$lte = endDateTime
                }
            }

            // Search filter
            if (search) {
                filter.$or = [
                    { transactionId: { $regex: search, $options: 'i' } },
                    { gatewayTransactionId: { $regex: search, $options: 'i' } },
                    { gatewayPaymentId: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const transactions = await Transaction.find(filter)
                .populate('userId', 'name emailAddress phoneNumber')
                .populate('subscriptionId', 'planName duration category mealsPerPlan originalPrice discountedPrice')
                .populate('promoCodeUsed', 'code discountType discountValue')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))

            const total = await Transaction.countDocuments(filter)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                transactions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                filters: {
                    status,
                    paymentMethod,
                    type,
                    startDate,
                    endDate,
                    search,
                    userId,
                    subscriptionId
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Admin: Get transaction by ID
    getTransactionById: async (req, res, next) => {
        try {
            const { id } = req.params

            const transaction = await Transaction.findById(id)
                .populate('userId', 'name emailAddress phoneNumber')
                .populate('subscriptionId', 'planName duration category mealsPerPlan features')
                .populate('userSubscriptionId')
                .populate('promoCodeUsed', 'code description discountType discountValue')

            if (!transaction) {
                return httpError(next, new Error('Transaction not found'), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { transaction })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // User: Get user's transactions
    getUserTransactions: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser
            const {
                page = 1,
                limit = 10,
                status,
                startDate,
                endDate,
                type
            } = req.query

            const skip = (page - 1) * limit
            const filter = { userId }

            if (status) filter.status = status
            if (type) filter.type = type

            // Date range filter
            if (startDate || endDate) {
                filter.createdAt = {}
                if (startDate) filter.createdAt.$gte = new Date(startDate)
                if (endDate) {
                    const endDateTime = new Date(endDate)
                    endDateTime.setHours(23, 59, 59, 999)
                    filter.createdAt.$lte = endDateTime
                }
            }

            const transactions = await Transaction.find(filter)
                .populate('subscriptionId', 'planName duration category mealsPerPlan')
                .populate('promoCodeUsed', 'code discountType discountValue')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))

            const total = await Transaction.countDocuments(filter)

            // Calculate user statistics
            const userStats = await Transaction.aggregate([
                { $match: { userId: userId.toString() } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$finalAmount' }
                    }
                }
            ])

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                transactions,
                userStats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Admin: Combined Transaction Statistics
    getTransactionStats: async (req, res, next) => {
        try {
            const { startDate, endDate, groupBy = 'day' } = req.query




            const start = startDate ? TimezoneUtil.toIST(startDate) : TimezoneUtil.addDays(-30)
            const end = endDate ? TimezoneUtil.endOfDay(endDate) : TimezoneUtil.endOfDay()

            // Get overall transaction statistics
            const dashboardStats = await Transaction.getDashboardStats(start, end)

            const stats = {
                total: { count: 0, amount: 0 },
                successful: { count: 0, amount: 0 },
                failed: { count: 0, amount: 0 },
                pending: { count: 0, amount: 0 },
                refunded: { count: 0, amount: 0 }
            }

            dashboardStats.forEach(stat => {
                const status = stat._id
                stats[status] = { count: stat.count, amount: stat.totalAmount }
                stats.total.count += stat.count
                stats.total.amount += stat.totalAmount
            })

            // Get revenue analytics with grouping
            let groupByField
            switch (groupBy) {
                case 'month':
                    groupByField = {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    }
                    break
                case 'week':
                    groupByField = {
                        year: { $year: '$createdAt' },
                        week: { $week: '$createdAt' }
                    }
                    break
                default: // day
                    groupByField = {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    }
            }

            const revenueAnalytics = await Transaction.aggregate([
                {
                    $match: {
                        status: 'success',
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: groupByField,
                        totalRevenue: { $sum: '$finalAmount' },
                        totalTransactions: { $sum: 1 },
                        averageAmount: { $avg: '$finalAmount' },
                        totalDiscount: { $sum: '$discountAmount' }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
                }
            ])

            // Get payment method statistics
            const paymentMethodStats = await Transaction.getPaymentMethodStats(start, end)

            // Get subscription type breakdown
            const subscriptionBreakdown = await Transaction.aggregate([
                {
                    $match: {
                        status: 'success',
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $lookup: {
                        from: 'subscriptions',
                        localField: 'subscriptionId',
                        foreignField: '_id',
                        as: 'subscription'
                    }
                },
                {
                    $unwind: '$subscription'
                },
                {
                    $group: {
                        _id: {
                            category: '$subscription.category',
                            duration: '$subscription.duration'
                        },
                        count: { $sum: 1 },
                        totalRevenue: { $sum: '$finalAmount' },
                        averageAmount: { $avg: '$finalAmount' }
                    }
                },
                {
                    $sort: { totalRevenue: -1 }
                }
            ])

            // Calculate growth percentage (compare with previous period)
            const previousPeriodStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
            const previousStats = await Transaction.getDashboardStats(previousPeriodStart, start)

            let previousRevenue = 0
            previousStats.forEach(stat => {
                if (stat._id === 'success') {
                    previousRevenue = stat.totalAmount
                }
            })

            const currentRevenue = stats.successful.amount
            const growthPercentage = previousRevenue > 0
                ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
                : 0

            // Get recent transactions
            const recentTransactions = await Transaction.find({
                createdAt: { $gte: start, $lte: end }
            })
                .populate('userId', 'name emailAddress')
                .populate('subscriptionId', 'planName duration category')
                .sort({ createdAt: -1 })
                .limit(10)

            // Get failure analysis
            const failureAnalysis = await Transaction.aggregate([
                {
                    $match: {
                        status: 'failed',
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: '$failureReason',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$finalAmount' }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ])

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                overview: stats,
                revenueAnalytics,
                paymentMethodStats,
                subscriptionBreakdown,
                failureAnalysis,
                recentTransactions,
                growthPercentage: Math.round(growthPercentage * 100) / 100,
                dateRange: {
                    startDate: TimezoneUtil.format(start, 'datetime'),
                    endDate: TimezoneUtil.format(end, 'datetime')
                },
                generatedAt: TimezoneUtil.format(TimezoneUtil.now(), 'datetime')
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },


    // Admin: Process refund
    processRefund: async (req, res, next) => {
        try {
            const { id } = req.params
            const { body } = req

            const { error, value } = validateJoiSchema(ValidateRefundTransaction, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { reason, amount } = value

            const transaction = await Transaction.findById(id)
            if (!transaction) {
                return httpError(next, new Error('Transaction not found'), req, 404)
            }

            if (!transaction.canBeRefunded()) {
                return httpError(next, new Error('Transaction cannot be refunded'), req, 400)
            }

            const refundResult = await paymentService.createRefund(transaction.transactionId, {
                amount: amount || transaction.finalAmount,
                reason: reason
            })

            if (!refundResult.success) {
                return httpError(next, new Error('Failed to process refund'), req, 500)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                transaction: refundResult.transaction,
                refund: refundResult.refund,
                message: 'Refund processed successfully'
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },


    // Admin: Get failed transactions for review
    getFailedTransactions: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, startDate, endDate } = req.query

            const skip = (page - 1) * limit
            const filter = { status: 'failed' }

            if (startDate || endDate) {
                filter.createdAt = {}
                if (startDate) filter.createdAt.$gte = new Date(startDate)
                if (endDate) {
                    const endDateTime = new Date(endDate)
                    endDateTime.setHours(23, 59, 59, 999)
                    filter.createdAt.$lte = endDateTime
                }
            }

            const failedTransactions = await Transaction.find(filter)
                .populate('userId', 'name emailAddress phoneNumber')
                .populate('subscriptionId', 'planName duration originalPrice discountedPrice')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))

            const total = await Transaction.countDocuments(filter)

            // Group by failure reasons
            const failureReasons = await Transaction.aggregate([
                {
                    $match: filter
                },
                {
                    $group: {
                        _id: '$failureReason',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$finalAmount' }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ])

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                failedTransactions,
                failureReasons,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Admin: Export transactions
    exportTransactions: async (req, res, next) => {
        try {
            const { startDate, endDate, status, format = 'json' } = req.query

            const filter = {}
            if (status) filter.status = status

            if (startDate || endDate) {
                filter.createdAt = {}
                if (startDate) filter.createdAt.$gte = new Date(startDate)
                if (endDate) {
                    const endDateTime = new Date(endDate)
                    endDateTime.setHours(23, 59, 59, 999)
                    filter.createdAt.$lte = endDateTime
                }
            }

            const transactions = await Transaction.find(filter)
                .populate('userId', 'name emailAddress phoneNumber')
                .populate('subscriptionId', 'planName duration category')
                .sort({ createdAt: -1 })
                .lean()

            if (format === 'csv') {
                // Convert to CSV format
                const csvData = transactions.map(t => ({
                    'Transaction ID': t.transactionId,
                    'User Name': t.userId?.name || 'N/A',
                    'User Email': t.userId?.emailAddress || 'N/A',
                    'Subscription': t.subscriptionId?.planName || 'N/A',
                    'Amount': t.finalAmount,
                    'Original Amount': t.originalAmount,
                    'Discount': t.discountAmount,
                    'Payment Method': t.paymentMethod,
                    'Status': t.status,
                    'Date': new Date(t.createdAt).toISOString(),
                    'Gateway Transaction ID': t.gatewayTransactionId
                }))

                res.setHeader('Content-Type', 'text/csv')
                res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv')

                // Simple CSV conversion (in production, use proper CSV library)
                const csvHeaders = Object.keys(csvData[0] || {}).join(',')
                const csvRows = csvData.map(row => Object.values(row).join(','))
                const csvContent = [csvHeaders, ...csvRows].join('\n')

                res.send(csvContent)
            } else {
                httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    transactions,
                    totalCount: transactions.length,
                    exportedAt: new Date(),
                    filters: { startDate, endDate, status }
                })
            }
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
}