import mongoose from 'mongoose'
import { EVendorType } from '../constant/application.js'

const locationZoneSchema = new mongoose.Schema(
    {
        zoneName: {
            type: String,
            required: true,
            maxlength: 100,
            trim: true
        },
        city: {
            type: String,
            required: true,
            maxlength: 50,
            trim: true
        },
        state: {
            type: String,
            maxlength: 50,
            trim: true
        },
        country: {
            type: String,
            default: 'India',
            maxlength: 50,
            trim: true
        },
        pincodes: [{
            type: String,
            required: true,
            match: /^[0-9]{6}$/
        }],
        serviceType: {
            type: String,
            enum: ['vendor_only', 'home_chef_only', 'both_vendor_home_chef'],
            required: true
        },
        serviceRadius: {
            type: Number,
            default: 10,
            min: 1,
            max: 50
        },
        coordinates: {
            center: {
                lat: {
                    type: Number,
                    required: true,
                    min: -90,
                    max: 90
                },
                lng: {
                    type: Number,
                    required: true,
                    min: -180,
                    max: 180
                }
            },
            boundaries: [{
                _id: false,
                lat: {
                    type: Number,
                    required: true
                },
                lng: {
                    type: Number,
                    required: true
                }
            }]
        },
        isActive: {
            type: Boolean,
            default: true
        },
        deliveryFee: {
            baseCharge: {
                type: Number,
                default: 0,
                min: 0
            },
            perKmCharge: {
                type: Number,
                default: 0,
                min: 0
            },
            freeDeliveryAbove: {
                type: Number,
                default: null,
                min: 0
            }
        },
        operatingHours: {
            start: {
                type: String,
                default: '06:00',
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            },
            end: {
                type: String,
                default: '23:59',
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            }
        },
        supportedVendorTypes: [{
            type: String,
            enum: [...Object.values(EVendorType)]
        }],
        restrictions: {
            maxOrdersPerDay: {
                type: Number,
                default: null
            },
            minOrderValue: {
                type: Number,
                default: 0,
                min: 0
            },
            maxOrderValue: {
                type: Number,
                default: null
            }
        },
        priority: {
            type: Number,
            default: 0
        },
        notes: {
            type: String,
            maxlength: 500
        }
    },
    { timestamps: true }
)

locationZoneSchema.index({ city: 1 })
locationZoneSchema.index({ pincodes: 1 })
locationZoneSchema.index({ serviceType: 1 })
locationZoneSchema.index({ isActive: 1 })
locationZoneSchema.index({ 'coordinates.center': '2dsphere' })
locationZoneSchema.index({ priority: -1 })
locationZoneSchema.index({ createdAt: -1 })

locationZoneSchema.index({ city: 1, isActive: 1 })
locationZoneSchema.index({ pincodes: 1, isActive: 1 })
locationZoneSchema.index({ serviceType: 1, isActive: 1 })
locationZoneSchema.index({ supportedVendorTypes: 1, isActive: 1 })

locationZoneSchema.pre('save', function (next) {
    // Ensure pincodes are unique
    this.pincodes = [...new Set(this.pincodes)]

    // Set supported vendor types based on service type
    if (this.serviceType === 'vendor_only') {
        this.supportedVendorTypes = ['food_vendor']
    } else if (this.serviceType === 'home_chef_only') {
        this.supportedVendorTypes = ['home_chef']
    } else if (this.serviceType === 'both_vendor_home_chef') {
        this.supportedVendorTypes = ['food_vendor', 'home_chef']
    }

    next()
})

locationZoneSchema.methods.isServiceAvailable = function (vendorType = null) {
    if (!this.isActive) return false

    const now = new Date()
    const currentTime = now.toTimeString().substr(0, 5)

    if (currentTime < this.operatingHours.start || currentTime > this.operatingHours.end) {
        return false
    }

    if (vendorType && !this.supportedVendorTypes.includes(vendorType)) {
        return false
    }

    return true
}

locationZoneSchema.methods.isPincodeSupported = function (pincode) {
    return this.pincodes.includes(pincode)
}

locationZoneSchema.methods.calculateDeliveryFee = function (distance, orderValue) {
    if (this.deliveryFee.freeDeliveryAbove && orderValue >= this.deliveryFee.freeDeliveryAbove) {
        return 0
    }

    return this.deliveryFee.baseCharge + (distance * this.deliveryFee.perKmCharge)
}

locationZoneSchema.methods.isInServiceRadius = function (coordinates) {
    const distance = this.calculateDistance(this.coordinates.center, coordinates)
    return distance <= this.serviceRadius
}

locationZoneSchema.methods.calculateDistance = function (coord1, coord2) {
    const R = 6371
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

locationZoneSchema.methods.getAvailableVendorTypes = function () {
    return this.supportedVendorTypes.filter(type => this.isServiceAvailable(type))
}

// Static methods
locationZoneSchema.statics.findByPincode = function (pincode) {
    return this.find({
        pincodes: pincode,
        isActive: true
    }).sort({ priority: -1 })
}

locationZoneSchema.statics.findByCity = function (city) {
    return this.find({
        city: new RegExp(city, 'i'),
        isActive: true
    }).sort({ priority: -1 })
}

locationZoneSchema.statics.findByCoordinates = function (coordinates, radius = 50) {
    return this.find({
        'coordinates.center': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: radius * 1000 // Convert km to meters
            }
        },
        isActive: true
    }).sort({ priority: -1 })
}

locationZoneSchema.statics.findActiveZones = function () {
    return this.find({ isActive: true })
        .sort({ priority: -1, city: 1, zoneName: 1 })
}

locationZoneSchema.statics.findByServiceType = function (serviceType) {
    return this.find({
        serviceType,
        isActive: true
    }).sort({ priority: -1 })
}

locationZoneSchema.statics.findSupportingVendorType = function (vendorType) {
    return this.find({
        supportedVendorTypes: vendorType,
        isActive: true
    }).sort({ priority: -1 })
}

locationZoneSchema.statics.checkServiceAvailability = function (pincode, vendorType = null) {
    return this.findByPincode(pincode).then(zones => {
        return zones.some(zone => zone.isServiceAvailable(vendorType))
    })
}

export default mongoose.model('LocationZone', locationZoneSchema)