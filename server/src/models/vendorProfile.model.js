import mongoose from 'mongoose'
import { EVendorType } from '../constant/application.js'

const vendorProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        vendorType: {
            type: String,
            enum: [...Object.values(EVendorType)],
            required: true
        },
        businessInfo: {
            businessName: {
                type: String,
                required: true
            },
            description: {
                type: String,
                maxlength: 500
            },
            cuisineTypes: [String],
            serviceArea: {
                radius: {
                    type: Number,
                    default: 5
                },
                coordinates: {
                    lat: {
                        type: Number,
                        required: true
                    },
                    lng: {
                        type: Number,
                        required: true
                    }
                }
            },
            address: {
                street: {
                    type: String,
                    default: null
                },
                city: {
                    type: String,
                    default: null
                },
                state: {
                    type: String,
                    default: null
                },
                country: {
                    type: String,
                    default: null
                },
                zipCode: {
                    type: String,
                    default: null
                },
                coordinates: {
                    type: {
                        type: String,
                        enum: ['Point'],
                        default: 'Point'
                    },
                    coordinates: {
                        type: [Number],
                        default: [0, 0]
                    }
                }
            }
        },
        operatingHours: [{
            _id: false,
            day: {
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                required: true
            },
            isOpen: {
                type: Boolean,
                default: true
            },
            openTime: String,
            closeTime: String
        }],
        rating: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            totalReviews: {
                type: Number,
                default: 0
            }
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        capacity: {
            dailyOrders: {
                type: Number,
                default: 50
            },
            currentLoad: {
                type: Number,
                default: 0
            }
        },
        documents: {
            businessLicense: String,
            foodSafetyLicense: String,
            taxId: String
        }
    },
    { timestamps: true }
)

// Indexes
vendorProfileSchema.index({ userId: 1 }, { unique: true })
vendorProfileSchema.index({ vendorType: 1 })
vendorProfileSchema.index({ 'businessInfo.serviceArea.coordinates': '2dsphere' })
vendorProfileSchema.index({ 'businessInfo.address.coordinates': '2dsphere' })
vendorProfileSchema.index({ 'businessInfo.cuisineTypes': 1 })
vendorProfileSchema.index({ 'rating.average': -1 })
vendorProfileSchema.index({ isVerified: 1 })
vendorProfileSchema.index({ isAvailable: 1 })
vendorProfileSchema.index({ 'capacity.currentLoad': 1 })
vendorProfileSchema.index({ createdAt: 1 })

// Compound indexes for common queries
vendorProfileSchema.index({ vendorType: 1, isVerified: 1, isAvailable: 1 })
vendorProfileSchema.index({ 'businessInfo.cuisineTypes': 1, 'rating.average': -1 })

// Pre-save hook for capacity validation
vendorProfileSchema.pre('save', function (next) {
    if (this.capacity.currentLoad > this.capacity.dailyOrders) {
        this.capacity.currentLoad = this.capacity.dailyOrders
    }
    if (this.capacity.currentLoad < 0) {
        this.capacity.currentLoad = 0
    }
    next()
})

// Instance methods
vendorProfileSchema.methods.isOpenNow = function () {
    const now = new Date()
    const currentDay = now.toLocaleLowerCase().substr(0, 3) + now.toLocaleLowerCase().substr(3)
    const daySchedule = this.operatingHours.find(schedule => schedule.day === currentDay)

    if (!daySchedule || !daySchedule.isOpen) return false

    const currentTime = now.toTimeString().substr(0, 5)
    return currentTime >= daySchedule.openTime && currentTime <= daySchedule.closeTime
}

vendorProfileSchema.methods.hasCapacity = function (ordersToAdd = 1) {
    return (this.capacity.currentLoad + ordersToAdd) <= this.capacity.dailyOrders
}

vendorProfileSchema.methods.updateCapacity = function (orderCount) {
    this.capacity.currentLoad += orderCount
    if (this.capacity.currentLoad >= this.capacity.dailyOrders) {
        this.isAvailable = false
    }
    return this.save()
}

vendorProfileSchema.methods.resetDailyCapacity = function () {
    this.capacity.currentLoad = 0
    this.isAvailable = true
    return this.save()
}

vendorProfileSchema.methods.updateRating = function (newRating) {
    const totalRating = this.rating.average * this.rating.totalReviews
    this.rating.totalReviews += 1
    this.rating.average = (totalRating + newRating) / this.rating.totalReviews
    return this.save()
}

vendorProfileSchema.methods.isInServiceArea = function (coordinates) {
    const distance = this.calculateDistance(
        this.businessInfo.serviceArea.coordinates,
        coordinates
    )
    return distance <= this.businessInfo.serviceArea.radius
}

vendorProfileSchema.methods.calculateDistance = function (coord1, coord2) {
    const R = 6371 // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

vendorProfileSchema.methods.updateAddress = function (addressData) {
    const { street, city, state, country, zipCode, lat, lng } = addressData

    this.businessInfo.address = {
        street: street || null,
        city: city || null,
        state: state || null,
        country: country || null,
        zipCode: zipCode || null,
        coordinates: {
            type: 'Point',
            coordinates: [lng || 0, lat || 0]
        }
    }

    // Also update service area coordinates if provided
    if (lat && lng) {
        this.businessInfo.serviceArea.coordinates = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        }
    }

    return this.save()
}

// Static methods
vendorProfileSchema.statics.findByUserId = function (userId) {
    return this.findOne({ userId }).populate('userId', 'name emailAddress phoneNumber')
}

vendorProfileSchema.statics.findByType = function (vendorType) {
    return this.find({ vendorType, isVerified: true, isAvailable: true })
}

vendorProfileSchema.statics.findNearby = function (coordinates, radius = 10) {
    return this.find({
        'businessInfo.serviceArea.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: radius * 1000
            }
        },
        isVerified: true,
        isAvailable: true
    })
}

vendorProfileSchema.statics.findByCuisine = function (cuisineType) {
    return this.find({
        'businessInfo.cuisineTypes': cuisineType,
        isVerified: true,
        isAvailable: true
    }).sort({ 'rating.average': -1 })
}

vendorProfileSchema.statics.findAvailableVendors = function (coordinates, cuisineTypes = []) {
    const query = {
        isVerified: true,
        isAvailable: true,
        'capacity.currentLoad': { $lt: this.schema.path('capacity.dailyOrders') }
    }

    if (cuisineTypes.length > 0) {
        query['businessInfo.cuisineTypes'] = { $in: cuisineTypes }
    }

    return this.find(query).sort({ 'rating.average': -1 })
}

export default mongoose.model('VendorProfile', vendorProfileSchema)