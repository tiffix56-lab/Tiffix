import mongoose from 'mongoose'
import TimezoneUtil from '../util/timezone.js'

const promoCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 20
        },
        description: {
            type: String,
            required: true,
            maxlength: 500,
            trim: true
        },
        discountType: {
            type: String,
            enum: ['percentage', 'flat'],
            required: true
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        minOrderValue: {
            type: Number,
            default: 0,
            min: 0
        },
        maxDiscount: {
            type: Number,
            default: null,
            min: 0
        },
        usageLimit: {
            type: Number,
            required: true,
            min: 1
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0
        },
        validFrom: {
            type: Date,
            required: true
        },
        validUntil: {
            type: Date,
            required: true
        },
        applicableSubscriptions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription'
        }],
        applicableCategories: [{
            type: String,
            enum: ['universal', 'food_vendor_specific', 'home_chef_specific', 'both_options']
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userUsageLimit: {
            type: Number,
            default: 1,
            min: 1
        }
    },
    { timestamps: true }
)

promoCodeSchema.index({ code: 1 }, { unique: true })
promoCodeSchema.index({ isActive: 1 })
promoCodeSchema.index({ validFrom: 1, validUntil: 1 })
promoCodeSchema.index({ applicableCategories: 1 })
promoCodeSchema.index({ usedCount: 1, usageLimit: 1 })

promoCodeSchema.pre('validate', function (next) {
    if (this.validUntil <= this.validFrom) {
        next(new Error('Valid until date must be after valid from date'))
    }
    if (this.discountType === 'percentage' && this.discountValue > 100) {
        next(new Error('Percentage discount cannot exceed 100%'))
    }
    if (this.maxDiscount && this.discountType === 'flat' && this.maxDiscount < this.discountValue) {
        next(new Error('Max discount cannot be less than discount value for flat discounts'))
    }
    next()
})

promoCodeSchema.methods.isValid = function () {
    const now = TimezoneUtil.now()
    return (
        this.isActive &&
        now >= this.validFrom &&
        now <= this.validUntil &&
        this.usedCount < this.usageLimit
    )
}

promoCodeSchema.methods.canBeUsed = function () {
    return this.isValid() && this.usedCount < this.usageLimit
}

promoCodeSchema.methods.incrementUsage = function () {
    this.usedCount += 1
    return this.save()
}

promoCodeSchema.methods.calculateDiscount = function (orderValue) {
    if (!this.isValid()) {
        return { discount: 0, error: 'Promo code is not valid' }
    }

    if (orderValue < this.minOrderValue) {
        return {
            discount: 0,
            error: `Minimum order value of ₹${this.minOrderValue} required`
        }
    }

    let discount = 0

    if (this.discountType === 'percentage') {
        discount = (orderValue * this.discountValue) / 100
        if (this.maxDiscount && discount > this.maxDiscount) {
            discount = this.maxDiscount
        }
    } else {
        discount = this.discountValue
    }

    return { discount: Math.round(discount * 100) / 100, error: null }
}

promoCodeSchema.methods.isApplicableToSubscription = function (subscriptionId, subscriptionCategory) {
    if (this.applicableSubscriptions.length > 0) {
        return this.applicableSubscriptions.some(id => id.toString() === subscriptionId.toString())
    }

    if (this.applicableCategories.length > 0) {
        return this.applicableCategories.includes(subscriptionCategory)
    }

    return true
}

promoCodeSchema.statics.findValidPromoCode = function (code) {
    const now = TimezoneUtil.now()
    return this.findOne({
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        $expr: { $lt: ['$usedCount', '$usageLimit'] }
    })
}

promoCodeSchema.statics.findActivePromoCodes = function () {
    const now = TimezoneUtil.now()
    return this.find({
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        $expr: { $lt: ['$usedCount', '$usageLimit'] }
    }).sort({ createdAt: -1 })
}

export default mongoose.model('PromoCode', promoCodeSchema)