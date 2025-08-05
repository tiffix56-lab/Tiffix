import mongoose from 'mongoose'

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
        credits: {
            type: Number,
            default: 0,
            min: 0
        },


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

userProfileSchema.methods.canAfford = function (credit) {
    return this.credits >= credit
}

userProfileSchema.methods.deductFromCredit = function (credit) {
    if (!this.canAfford(credit)) {
        throw new Error('Insufficient MealCredit balance')
    }
    this.credits -= credit
    return this.save()
}

userProfileSchema.methods.addToMealCredit = function (credit) {
    this.credits += credit
    return this.save()
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