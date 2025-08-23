import mongoose from 'mongoose'
import TimezoneUtil from '../util/timezone.js'
import { EPaymentStatus } from '../constant/application.js'

const transactionSchema = new mongoose.Schema(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
            required: true
        },
        userSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserSubscription',
            default: null
        },
        type: {
            type: String,
            enum: ['purchase', 'refund', 'cancellation'],
            default: 'purchase'
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        originalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        finalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'INR'
        },
        paymentMethod: {
            type: String,
            enum: ['razorpay', 'upi', 'card', 'netbanking', 'wallet'],
            required: true
        },
        paymentGateway: {
            type: String,
            default: 'razorpay'
        },
        gatewayTransactionId: {
            type: String,
            required: true
        },
        gatewayPaymentId: {
            type: String,
            default: null
        },
        gatewayOrderId: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: [...Object.values(EPaymentStatus)],
            default: EPaymentStatus.PENDING
        },
        promoCodeUsed: {
            code: String,
            discountAmount: {
                type: Number,
                default: 0
            },
            promoCodeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PromoCode'
            }
        },
        creditsAdded: {
            type: Number,
            default: 0,
            min: 0
        },
        paymentDetails: {
            bankName: String,
            cardLast4: String,
            cardType: String,
            upiId: String,
            walletName: String
        },
        metadata: {
            userAgent: String,
            ipAddress: String,
            deviceInfo: String
        },
        failureReason: {
            type: String,
            default: null
        },
        refundDetails: {
            refundId: String,
            refundAmount: Number,
            refundDate: Date,
            refundReason: String,
            refundStatus: {
                type: String,
                enum: ['pending', 'processed', 'failed']
            }
        },
        webhookData: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        processedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
)

transactionSchema.index({ userId: 1 })
transactionSchema.index({ status: 1 })
transactionSchema.index({ paymentMethod: 1 })
transactionSchema.index({ gatewayTransactionId: 1 })
transactionSchema.index({ createdAt: -1 })
transactionSchema.index({ userId: 1, status: 1 })
transactionSchema.index({ userId: 1, createdAt: -1 })
transactionSchema.index({ status: 1, createdAt: -1 })

transactionSchema.pre('save', function (next) {
    if (this.finalAmount !== (this.originalAmount - this.discountAmount)) {
        next(new Error('Final amount calculation is incorrect'))
    }

    if (this.discountAmount > this.originalAmount) {
        next(new Error('Discount amount cannot exceed original amount'))
    }

    next()
})

transactionSchema.methods.markAsSuccess = function (gatewayPaymentId, creditsAdded = 0) {
    this.status = 'success'
    this.gatewayPaymentId = gatewayPaymentId
    this.creditsAdded = creditsAdded
    this.processedAt = TimezoneUtil.now()
    return this.save()
}

transactionSchema.methods.markAsFailed = function (reason) {
    this.status = 'failed'
    this.failureReason = reason
    this.processedAt = TimezoneUtil.now()
    return this.save()
}

transactionSchema.methods.markAsRefunded = function (refundDetails) {
    this.status = 'refunded'
    this.refundDetails = refundDetails
    return this.save()
}

transactionSchema.methods.isSuccessful = function () {
    return this.status === 'success'
}

transactionSchema.methods.isPending = function () {
    return this.status === 'pending' || this.status === 'processing'
}

transactionSchema.methods.canBeRefunded = function () {
    return this.status === 'success' && !this.refundDetails
}

transactionSchema.statics.generateTransactionId = function () {
    const prefix = 'TXN'
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}_${timestamp}_${random}`
}

transactionSchema.statics.findByUser = function (userId, options = {}) {
    const query = this.find({ userId })
        .populate('subscriptionId', 'planName duration category')
        .populate('promoCodeUsed.promoCodeId', 'code discountType discountValue')
        .sort({ createdAt: -1 })

    if (options.limit) query.limit(options.limit)
    if (options.status) query.where({ status: options.status })

    return query
}

transactionSchema.statics.findByStatus = function (status) {
    return this.find({ status })
        .populate('userId', 'name emailAddress')
        .populate('subscriptionId', 'planName duration')
        .sort({ createdAt: -1 })
}

transactionSchema.statics.getRevenueAnalytics = function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                status: 'success',
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                totalRevenue: { $sum: '$finalAmount' },
                totalTransactions: { $sum: 1 },
                averageAmount: { $avg: '$finalAmount' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ])
}

transactionSchema.statics.getPaymentMethodStats = function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                status: 'success',
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$finalAmount' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ])
}

transactionSchema.statics.getDashboardStats = function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$finalAmount' }
            }
        }
    ])
}

transactionSchema.statics.findPendingTransactions = function (olderThanMinutes = 30) {
    const now = TimezoneUtil.now()
    const cutoffTime = new Date(now.getTime() - (olderThanMinutes * 60 * 1000))

    return this.find({
        status: { $in: ['pending', 'processing'] },
        createdAt: { $lt: cutoffTime }
    })
}

export default mongoose.model('Transaction', transactionSchema)