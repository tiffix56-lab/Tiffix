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
            min: 0,
            validate: {
                validator: function (value) {
                    return value <= this.originalPrice
                },
                message: 'Discounted price cannot be greater than original price'
            }
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
        priority: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
)

subscriptionSchema.index({ category: 1 })
subscriptionSchema.index({ vendorType: 1 })
subscriptionSchema.index({ isActive: 1 })
subscriptionSchema.index({ validFrom: 1, validUntil: 1 })
subscriptionSchema.index({ discountedPrice: 1 })
subscriptionSchema.index({ priority: -1 })
subscriptionSchema.index({ createdAt: -1 })

subscriptionSchema.index({ category: 1, isActive: 1, validFrom: 1, validUntil: 1 })
subscriptionSchema.index({ vendorType: 1, isActive: 1 })

subscriptionSchema.pre('save', function (next) {
    if (this.maxPurchases && this.currentPurchases >= this.maxPurchases) {
        this.isActive = false
    }

    if (this.validUntil && this.validUntil < new Date()) {
        this.isActive = false
    }

    next()
})

subscriptionSchema.methods.isValidNow = function () {
    const now = new Date()
    return this.isActive &&
        (!this.validFrom || this.validFrom <= now) &&
        (!this.validUntil || this.validUntil >= now) &&
        (!this.maxPurchases || this.currentPurchases < this.maxPurchases)
}

subscriptionSchema.methods.canPurchase = function () {
    return this.isValidNow()
}

subscriptionSchema.methods.incrementPurchases = function () {
    this.currentPurchases += 1
    if (this.maxPurchases && this.currentPurchases >= this.maxPurchases) {
        this.isActive = false
    }
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
    const now = new Date()
    return this.find({
        isActive: true,
        $or: [
            { validFrom: { $lte: now }, validUntil: { $gte: now } },
            { validFrom: { $lte: now }, validUntil: null }
        ]
    }).sort({ priority: -1, createdAt: -1 })
}

subscriptionSchema.statics.findByCategory = function (category) {
    return this.find({ category, isActive: true })
        .sort({ priority: -1, discountedPrice: 1 })
}

subscriptionSchema.statics.findForVendor = function (vendorId, vendorType) {
    return this.find({
        $or: [
            { category: 'universal' },
            { category: 'both_options' },
            { category: `${vendorType}_specific`, specificVendor: vendorId }
        ],
        isActive: true
    }).sort({ priority: -1, discountedPrice: 1 })
}

subscriptionSchema.statics.findByPriceRange = function (minPrice, maxPrice) {
    return this.find({
        discountedPrice: { $gte: minPrice, $lte: maxPrice },
        isActive: true
    }).sort({ discountedPrice: 1 })
}

export default mongoose.model('Subscription', subscriptionSchema)