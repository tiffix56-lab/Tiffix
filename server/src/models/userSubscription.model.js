import mongoose from 'mongoose'
import TimezoneUtil from '../util/timezone.js'
import { ESubscriptionStatus, EVendorType } from '../constant/application.js'

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
            enum: [...Object.values(ESubscriptionStatus)],
            default: ESubscriptionStatus.PENDING
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
        skipCreditAvailable: {
            type: Number,
            default: 6
        },
        skipCreditUsed: {
            type: Number,
            default: 0
        },

        vendorDetails: {
            isVendorAssigned: {
                type: Boolean,
                default: false
            },
            vendorSwitchUsed: {
                type: Boolean,
                default: false
            },
            currentVendor: {
                vendorId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'VendorProfile',
                    default: null
                },
                vendorType: {
                    type: String,
                    enum: [...Object.values(EVendorType)],
                    default: null
                },
                assignedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    default: null
                },
                assignedAt: {
                    type: Date,
                    default: null
                }
            },
            vendorsAssignedHistory: [{
                vendorId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'VendorProfile',
                    required: true
                },
                vendorType: {
                    type: String,
                    enum: [...Object.values(EVendorType)],
                    required: true
                },
                assignedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                assignedAt: {
                    type: Date,
                    required: true
                },
                deassignedAt: {
                    type: Date,
                    default: null
                },
                reason: {
                    type: String,
                    enum: ['initial_assignment', 'vendor_switch', 'admin_reassignment', 'vendor_unavailable'],
                    default: 'initial_assignment'
                }
            }]
        },
        mealTiming: {
            lunch: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                time: {
                    type: String,
                    default: '12:00',
                    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
                }
            },
            dinner: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                time: {
                    type: String,
                    default: '19:00',
                    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
                }
            }
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        deliveryAddress: {
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            state: String,
            country: {
                type: String,
                default: 'India'
            },
            zipCode: {
                type: String,
                required: true
            },
            landmark: String,
            coordinates: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point'
                },
                coordinates: {
                    type: [Number],
                    required: true
                }
            }
        },
        endDate: {
            type: Date,
            required: true
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
        isExpired: {
            type: Boolean,
            default: false
        },
        cancellationDetails: {
            isCancel: {
                type: Boolean,
                default: false
            },
            cancelledAt: Date,
            reason: String,
            refundAmount: {
                type: Number,
                default: 0
            }
        },
        referralDetails: {
            isReferralUsed: {
                type: Boolean,
                default: false
            },
            referralCode: {
                type: String,
                default: null
            },
            referredBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            }
        }
    },
    { timestamps: true }
)

userSubscriptionSchema.index({ subscriptionId: 1 })
userSubscriptionSchema.index({ status: 1 })
userSubscriptionSchema.index({ startDate: 1, endDate: 1 })
userSubscriptionSchema.index({ endDate: 1, status: 1 })
userSubscriptionSchema.index({ 'vendorDetails.currentVendor.vendorId': 1 })
userSubscriptionSchema.index({ 'vendorDetails.isVendorAssigned': 1 })
userSubscriptionSchema.index({ 'deliveryAddress.zipCode': 1 })
userSubscriptionSchema.index({ 'deliveryAddress.coordinates': '2dsphere' })

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

userSubscriptionSchema.methods.CheckisExpired = function () {
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



userSubscriptionSchema.methods.activate = function () {
    this.status = 'active'
    return this.save()
}

userSubscriptionSchema.methods.getDaysRemaining = function () {
    const now = TimezoneUtil.now()
    const timeDiff = this.endDate.getTime() - now.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

// Vendor Management Methods
userSubscriptionSchema.methods.assignVendor = function (vendorId, vendorType, assignedBy) {
    // Add current vendor to history if exists
    if (this.vendorDetails.currentVendor.vendorId) {
        this.vendorDetails.vendorsAssignedHistory.push({
            vendorId: this.vendorDetails.currentVendor.vendorId,
            vendorType: this.vendorDetails.currentVendor.vendorType,
            assignedBy: this.vendorDetails.currentVendor.assignedBy,
            assignedAt: this.vendorDetails.currentVendor.assignedAt,
            deassignedAt: new Date(),
            reason: this.vendorDetails.vendorSwitchUsed ? 'vendor_switch' : 'admin_reassignment'
        })
    }

    // Set new vendor
    this.vendorDetails.currentVendor = {
        vendorId: vendorId,
        vendorType: vendorType,
        assignedBy: assignedBy,
        assignedAt: new Date()
    }
    this.vendorDetails.isVendorAssigned = true

    return this.save()
}

userSubscriptionSchema.methods.requestVendorSwitch = function () {
    if (this.vendorDetails.vendorSwitchUsed) {
        throw new Error('Vendor switch already used for this subscription')
    }
    return true
}

userSubscriptionSchema.methods.useVendorSwitch = function () {
    this.vendorDetails.vendorSwitchUsed = true
    return this.save()
}

userSubscriptionSchema.methods.canSwitchVendor = function () {
    return !this.vendorDetails.vendorSwitchUsed &&
        this.isActive() &&
        this.vendorDetails.isVendorAssigned &&
        this.vendorDetails.currentVendor &&
        this.vendorDetails.currentVendor.vendorId
}

userSubscriptionSchema.methods.getDailyMealCount = function () {
    let count = 0
    if (this.mealTiming.lunch.enabled) count++
    if (this.mealTiming.dinner.enabled) count++
    return count
}

userSubscriptionSchema.methods.getMealTypes = function () {
    const types = []
    if (this.mealTiming.lunch.enabled) types.push('lunch')
    if (this.mealTiming.dinner.enabled) types.push('dinner')
    return types
}

userSubscriptionSchema.methods.canSkipMeal = function () {
    return this.skipCreditAvailable > 0 && this.isActive()
}

userSubscriptionSchema.methods.skipMeal = function () {
    if (!this.canSkipMeal()) {
        throw new Error('No skip credits available or subscription not active');
    }

    // Use one skip credit
    this.skipCreditAvailable -= 1;
    this.skipCreditUsed += 1;

    // Calculate if we need to extend subscription
    // 2 skips = 1 day extension
    const totalSkipsUsed = this.skipCreditUsed;

    // If even number of skips, extend by 1 day
    if (totalSkipsUsed % 2 === 0 && totalSkipsUsed > 0) {
        this.endDate = TimezoneUtil.addDays(1, this.endDate);
        console.log(`Extended subscription by 1 day. New end date: ${TimezoneUtil.format(this.endDate, 'date')}`);
    }

    return this.save();
};

userSubscriptionSchema.methods.getSkipInfo = function () {
    const totalSkipsUsed = this.skipCreditUsed
    const daysAlreadyExtended = Math.floor(totalSkipsUsed / 2)
    const pendingSkips = totalSkipsUsed % 2 // 0 or 1

    return {
        skipCreditsAvailable: this.skipCreditAvailable,
        skipCreditsUsed: this.skipCreditUsed,
        daysExtended: daysAlreadyExtended,
        pendingSkips: pendingSkips, // Skips waiting to complete a pair
        nextExtensionAt: pendingSkips === 1 ? 'Next skip will extend by 1 day' : 'Need 2 more skips for 1 day extension'
    }
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

// Vendor-related static methods
userSubscriptionSchema.statics.findByVendor = function (vendorId) {
    return this.find({
        'vendorDetails.currentVendor.vendorId': vendorId,
        'vendorDetails.isVendorAssigned': true
    })
        .populate('userId', 'name emailAddress phoneNumber')
        .populate('subscriptionId', 'planName category')
        .sort({ createdAt: -1 })
}

userSubscriptionSchema.statics.findActiveByVendor = function (vendorId) {
    const now = TimezoneUtil.now()
    return this.find({
        'vendorDetails.currentVendor.vendorId': vendorId,
        'vendorDetails.isVendorAssigned': true,
        status: 'active',
        endDate: { $gte: now }
    })
        .populate('userId', 'name emailAddress phoneNumber')
        .populate('subscriptionId', 'planName category')
        .sort({ startDate: 1 })
}

userSubscriptionSchema.statics.findUnassignedSubscriptions = function () {
    return this.find({
        'vendorDetails.isVendorAssigned': false,
        status: { $in: ['active', 'pending'] }
    })
        .populate('userId', 'name emailAddress phoneNumber')
        .populate('subscriptionId', 'planName category')
        .sort({ createdAt: 1 })
}

userSubscriptionSchema.statics.findPendingVendorSwitches = function () {
    return this.find({
        'vendorDetails.vendorSwitchUsed': true,
        'vendorDetails.isVendorAssigned': false,
        status: 'active'
    })
        .populate('userId', 'name emailAddress phoneNumber')
        .populate('subscriptionId', 'planName category')
        .sort({ createdAt: 1 })
}

userSubscriptionSchema.statics.getVendorCustomerCount = function (vendorId) {
    const now = TimezoneUtil.now()
    return this.countDocuments({
        'vendorDetails.currentVendor.vendorId': vendorId,
        'vendorDetails.isVendorAssigned': true,
        status: 'active',
        endDate: { $gte: now }
    })
}

export default mongoose.model('UserSubscription', userSubscriptionSchema)