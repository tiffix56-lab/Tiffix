import mongoose from 'mongoose'
import { EVendorType } from '../constant/application.js'

const subscriptionSchema = new mongoose.Schema(
    {
        planName: {
            type: String,
            required: true,
            maxlength: 100,
            trim: true
        },
        image: {
            type: String,
            trim: true
        },
        duration: {
            type: String,
            enum: ['weekly', 'monthly', 'yearly', 'custom', 'one-day', 'three-day'],
            required: true
        },
        planMenus: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Menu',
            }
        ],
        durationDays: {
            type: Number,
            required: true,
            min: 1
        },
        mealTimings: {
            isLunchAvailable: {
                type: Boolean,
                default: false
            },
            isDinnerAvailable: {
                type: Boolean,
                default: false
            },
            lunchOrderWindow: {
                startTime: {
                    type: String,
                    default: '11:00',
                    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
                },
                endTime: {
                    type: String,
                    default: '16:00',
                    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
                }
            },
            dinnerOrderWindow: {
                startTime: {
                    type: String,
                    default: '19:00',
                    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
                },
                endTime: {
                    type: String,
                    default: '23:00',
                    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
                }
            }
        },
        mealsPerPlan: {
            type: Number,
            required: true,
            min: 1
        },
        userSkipMealPerPlan: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        originalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        discountedPrice: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            enum: [EVendorType.FOOD_VENDOR, EVendorType.HOME_CHEF],
            required: true
        },
        freeDelivery: {
            type: Boolean,
            default: false
        },
        description: {
            type: String,
            maxlength: 3000,
            trim: true
        },
        features: [String],
        terms: {
            type: String,
            maxlength: 5000
        },
        isActive: {
            type: Boolean,
            default: true
        },
        currentPurchases: {
            type: Number,
            default: 0
        },
        tags: [String],

    },
    { timestamps: true }
)

subscriptionSchema.index({ category: 1 })
subscriptionSchema.index({ isActive: 1 })
subscriptionSchema.index({ discountedPrice: 1 })
subscriptionSchema.index({ createdAt: -1 })
subscriptionSchema.index({ duration: 1 })
subscriptionSchema.index({ planName: 'text', description: 'text' })

subscriptionSchema.index({ category: 1, isActive: 1 })
subscriptionSchema.index({ category: 1, duration: 1 })
subscriptionSchema.index({ isActive: 1, discountedPrice: 1 })

subscriptionSchema.pre('save', function (next) {
    if (this.planMenus && this.planMenus.length > 0) {
        const uniqueMenuIds = [...new Set(this.planMenus.map(id => id.toString()))];

        if (uniqueMenuIds.length !== this.planMenus.length) {
            return next(new Error('Duplicate menu items are not allowed in the same subscription plan'));
        }
    }
    // Validate meal timing requirements
    if (!this.mealTimings.isLunchAvailable && !this.mealTimings.isDinnerAvailable) {
        return next(new Error('At least one meal timing (lunch or dinner) must be available'))
    }

    // Validate pricing
    if (this.discountedPrice > this.originalPrice) {
        return next(new Error('Discounted price cannot be greater than original price'))
    }

    next()
})

subscriptionSchema.methods.isValidNow = function () {
    return this.isActive
}

subscriptionSchema.methods.canPurchase = function () {
    return this.isValidNow()
}

subscriptionSchema.methods.incrementPurchases = function () {
    this.currentPurchases += 1
    return this.save()
}

subscriptionSchema.methods.getDiscountAmount = function () {
    return this.originalPrice - this.discountedPrice
}

subscriptionSchema.methods.getDiscountPercentage = function () {
    if (this.originalPrice === 0) return 0
    return ((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100
}


subscriptionSchema.statics.findActive = function () {
    return this.find({
        isActive: true
    }).sort({ createdAt: -1 })
}

subscriptionSchema.statics.findByCategory = function (category) {
    return this.find({ category, isActive: true })
        .sort({ discountedPrice: 1 })
}

subscriptionSchema.statics.findForVendor = function (vendorType) {
    return this.find({
        $or: [
            { category: 'universal' },
            { category: 'both_options' },
            { category: `${vendorType}_specific` }
        ],
        isActive: true
    }).sort({ discountedPrice: 1 })
}

subscriptionSchema.statics.findByPriceRange = function (minPrice, maxPrice) {
    return this.find({
        discountedPrice: { $gte: minPrice, $lte: maxPrice },
        isActive: true
    }).sort({ discountedPrice: 1 })
}

export default mongoose.model('Subscription', subscriptionSchema)