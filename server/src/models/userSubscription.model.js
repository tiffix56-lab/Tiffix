import mongoose from 'mongoose'
import TimezoneUtil from '../util/timezone.js'

const userSubscriptionSchema = new mongoose.Schema(
    {
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
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction',
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled', 'pending'],
            default: 'pending'
        },
        creditsGranted: {
            type: Number,
            required: true,
            min: 0
        },
        creditsUsed: {
            type: Number,
            default: 0,
            min: 0
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            required: true
        },
        autoRenew: {
            type: Boolean,
            default: false
        },
        originalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        discountApplied: {
            type: Number,
            default: 0,
            min: 0
        },
        finalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        promoCodeUsed: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PromoCode',
            default: null
        },
        subscriptionDetails: {
            planName: String,
            duration: String,
            category: String,
            features: [String]
        },
        renewalHistory: [{
            renewedAt: {
                type: Date,
                default: Date.now
            },
            newEndDate: Date,
            transactionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Transaction'
            }
        }],
        cancellationDetails: {
            cancelledAt: Date,
            reason: String,
            refundAmount: {
                type: Number,
                default: 0
            }
        }
    },
    { timestamps: true }
)

userSubscriptionSchema.index({ userId: 1 })
userSubscriptionSchema.index({ subscriptionId: 1 })
userSubscriptionSchema.index({ status: 1 })
userSubscriptionSchema.index({ startDate: 1, endDate: 1 })
userSubscriptionSchema.index({ userId: 1, status: 1 })
userSubscriptionSchema.index({ endDate: 1, status: 1 })

userSubscriptionSchema.pre('save', function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'))
    }
    
    if (this.creditsUsed > this.creditsGranted) {
        next(new Error('Credits used cannot exceed credits granted'))
    }
    
    if (this.discountApplied > this.originalPrice) {
        next(new Error('Discount cannot exceed original price'))
    }
    
    next()
})

userSubscriptionSchema.methods.isActive = function () {
    const now = TimezoneUtil.now()
    return this.status === 'active' && now <= this.endDate
}

userSubscriptionSchema.methods.isExpired = function () {
    const now = TimezoneUtil.now()
    return now > this.endDate
}

userSubscriptionSchema.methods.getRemainingCredits = function () {
    return Math.max(0, this.creditsGranted - this.creditsUsed)
}

userSubscriptionSchema.methods.canUseCredits = function (creditsToUse) {
    return this.isActive() && this.getRemainingCredits() >= creditsToUse
}

userSubscriptionSchema.methods.useCredits = function (creditsToUse) {
    if (!this.canUseCredits(creditsToUse)) {
        throw new Error('Insufficient credits or subscription not active')
    }
    
    this.creditsUsed += creditsToUse
    return this.save()
}

userSubscriptionSchema.methods.cancel = function (reason, refundAmount = 0) {
    this.status = 'cancelled'
    this.cancellationDetails = {
        cancelledAt: TimezoneUtil.now(),
        reason: reason,
        refundAmount: refundAmount
    }
    return this.save()
}

userSubscriptionSchema.methods.renew = function (newEndDate, transactionId) {
    this.endDate = newEndDate
    this.renewalHistory.push({
        renewedAt: TimezoneUtil.now(),
        newEndDate: newEndDate,
        transactionId: transactionId
    })
    return this.save()
}

userSubscriptionSchema.methods.activate = function () {
    this.status = 'active'
    return this.save()
}

userSubscriptionSchema.methods.getDaysRemaining = function () {
    const now = TimezoneUtil.now()
    const timeDiff = this.endDate.getTime() - now.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

userSubscriptionSchema.statics.findActiveByUser = function (userId) {
    const now = TimezoneUtil.now()
    return this.find({
        userId: userId,
        status: 'active',
        endDate: { $gte: now }
    }).populate('subscriptionId').sort({ endDate: -1 })
}

userSubscriptionSchema.statics.findByUser = function (userId) {
    return this.find({ userId: userId })
        .populate('subscriptionId')
        .populate('promoCodeUsed')
        .sort({ createdAt: -1 })
}

userSubscriptionSchema.statics.findExpiring = function (days = 3) {
    const now = TimezoneUtil.now()
    const futureDate = TimezoneUtil.addDays(days)
    
    return this.find({
        status: 'active',
        endDate: { $lte: futureDate, $gte: now },
        autoRenew: false
    }).populate('userId subscriptionId')
}

userSubscriptionSchema.statics.findExpired = function () {
    const now = TimezoneUtil.now()
    return this.find({
        status: 'active',
        endDate: { $lt: now }
    })
}

userSubscriptionSchema.statics.getActiveSubscriptionsCount = function () {
    const now = TimezoneUtil.now()
    return this.countDocuments({
        status: 'active',
        endDate: { $gte: now }
    })
}

userSubscriptionSchema.statics.getRevenueStats = function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                status: { $ne: 'cancelled' }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$finalPrice' },
                totalSubscriptions: { $sum: 1 },
                averagePrice: { $avg: '$finalPrice' }
            }
        }
    ])
}

export default mongoose.model('UserSubscription', userSubscriptionSchema)