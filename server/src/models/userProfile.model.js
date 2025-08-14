import mongoose from 'mongoose'
import TimezoneUtil from "../util/timezone.js"
const userProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        addresses: [{
            _id: false,
            label: {
                type: String,
                required: true
            },
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            zipCode: {
                type: String,
                required: true
            },
            coordinates: {
                lat: Number,
                lng: Number
            },
            isDefault: {
                type: Boolean,
                default: false
            }
        }],
        preferences: {
            dietary: [{
                type: String,
                enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']
            }],
            cuisineTypes: [String],
            spiceLevel: {
                type: String,
                enum: ['mild', 'medium', 'hot', 'extra-hot'],
                default: 'medium'
            }
        },
        // orderHistory: [{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'Order'
        // }],
        // favoriteVendors: [{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'User'
        // }],
        activeSubscriptions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription'
        }],
        credits: [{
            _id: false,
            subscriptionType: {
                type: String,
                enum: ['universal', 'food_vendor_specific', 'home_chef_specific', 'both_options'],
                required: true
            },
            subscriptionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subscription',
                required: true
            },
            totalCredits: {
                type: Number,
                required: true,
                min: 0
            },
            usedCredits: {
                type: Number,
                default: 0,
                min: 0
            },
            purchasedAt: {
                type: Date,
                required: true
            },
            transactionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Transaction',
                required: true
            }
        }],


    },
    { timestamps: true }
)

// Indexes
userProfileSchema.index({ userId: 1 }, { unique: true })
userProfileSchema.index({ 'addresses.coordinates': '2dsphere' })
userProfileSchema.index({ 'addresses.zipCode': 1 })
userProfileSchema.index({ 'addresses.city': 1 })
userProfileSchema.index({ 'preferences.dietary': 1 })
userProfileSchema.index({ 'preferences.cuisineTypes': 1 })
userProfileSchema.index({ credits: 1 })
userProfileSchema.index({ createdAt: 1 })

userProfileSchema.pre('save', function (next) {
    if (this.addresses && this.addresses.length > 0) {
        const defaultAddresses = this.addresses.filter(addr => addr.isDefault)
        if (defaultAddresses.length > 1) {
            this.addresses.forEach((addr, index) => {
                if (index > 0 && addr.isDefault) {
                    addr.isDefault = false
                }
            })
        }
        if (defaultAddresses.length === 0) {
            this.addresses[0].isDefault = true
        }
    }
    next()
})

// Instance methods
userProfileSchema.methods.getDefaultAddress = function () {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0]
}

userProfileSchema.methods.addAddress = function (addressData) {
    // If this is the first address or marked as default, set as default
    if (this.addresses.length === 0 || addressData.isDefault) {
        this.addresses.forEach(addr => addr.isDefault = false)
        addressData.isDefault = true
    }
    this.addresses.push(addressData)
    return this.save()
}

userProfileSchema.methods.canAfford = function (credits, subscriptionType = null) {
    const availableCredits = this.getTotalAvailableCredits(subscriptionType)
    return availableCredits >= credits
}

userProfileSchema.methods.deductCredits = function (credits, subscriptionType = null, orderDetails = {}) {
    if (!this.canAfford(credits, subscriptionType)) {
        throw new Error('Insufficient MealCredit balance')
    }

    let remaining = credits

    // Sort by purchase date (FIFO - First In, First Out)
    const sortedCredits = this.credits
        .filter(c => {
            const availableCredits = c.totalCredits - c.usedCredits
            return availableCredits > 0 && (
                !subscriptionType ||
                c.subscriptionType === subscriptionType ||
                c.subscriptionType === 'universal'
            )
        })
        .sort((a, b) => new Date(a.purchasedAt) - new Date(b.purchasedAt))

    for (const creditEntry of sortedCredits) {
        if (remaining <= 0) break

        const available = creditEntry.totalCredits - creditEntry.usedCredits
        const toUse = Math.min(remaining, available)

        creditEntry.usedCredits += toUse
        remaining -= toUse
    }

    return this.save()
}

userProfileSchema.methods.addCredits = function (credits, subscriptionId, subscriptionType, transactionId) {


    const creditEntry = {
        subscriptionType,
        subscriptionId,
        totalCredits: credits,
        usedCredits: 0,
        purchasedAt: TimezoneUtil.now(),
        transactionId
    }

    this.credits.push(creditEntry)
    return this.save()
}

userProfileSchema.methods.getTotalAvailableCredits = function (subscriptionType = null) {
    return this.credits
        .filter(c => {
            return !subscriptionType ||
                c.subscriptionType === subscriptionType ||
                c.subscriptionType === 'universal'
        })
        .reduce((total, c) => total + (c.totalCredits - c.usedCredits), 0)
}

userProfileSchema.methods.getCreditsByType = function () {
    const creditsByType = {
        universal: 0,
        food_vendor_specific: 0,
        home_chef_specific: 0,
        both_options: 0
    }

    this.credits.forEach(c => {
        const available = c.totalCredits - c.usedCredits
        creditsByType[c.subscriptionType] += available
    })

    return creditsByType
}

userProfileSchema.methods.getCreditHistory = function () {
    return this.credits
        .map(c => ({
            subscriptionId: c.subscriptionId,
            subscriptionType: c.subscriptionType,
            totalCredits: c.totalCredits,
            usedCredits: c.usedCredits,
            remainingCredits: c.totalCredits - c.usedCredits,
            purchasedAt: c.purchasedAt,
            transactionId: c.transactionId
        }))
        .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
}

userProfileSchema.statics.findByUserId = function (userId) {
    return this.findOne({ userId }).populate('userId', 'name emailAddress')
}

userProfileSchema.statics.findByLocation = function (coordinates, radius = 10) {
    return this.find({
        'addresses.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: radius * 1000 // Convert km to meters
            }
        }
    })
}

export default mongoose.model('UserProfile', userProfileSchema)