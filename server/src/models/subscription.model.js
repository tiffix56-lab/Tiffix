import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
    {
        planName: {
            type: String,
            required: true,
            maxlength: 100,
            trim: true
        },
        duration: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'custom'],
            required: true
        },
        customDurationDays: {
            type: Number,
            required: function () {
                return this.duration === 'custom'
            },
            min: 1
        },
        mealsPerPlan: {
            type: Number,
            required: true,
            min: 1
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
            enum: ['universal', 'food_vendor_specific', 'home_chef_specific', 'both_options'],
            required: true
        },
        freeDelivery: {
            type: Boolean,
            default: false
        },
        description: {
            type: String,
            maxlength: 500,
            trim: true
        },
        features: [String],
        terms: {
            type: String,
            maxlength: 1000
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

subscriptionSchema.methods.calculateCredits = function () {
    return this.mealsPerPlan
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