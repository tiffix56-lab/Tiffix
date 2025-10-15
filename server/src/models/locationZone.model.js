import mongoose from 'mongoose'
import { EVendorType } from '../constant/application.js'
import TimezoneUtil from '../util/timezone.js'

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

locationZoneSchema.methods.isServiceAvailable = function (vendorType = null, skipOperatingHours = false) {
    if (!this.isActive) {
        console.log("Zone not active:", this.zoneName);
        return false;
    }

    // Skip operating hours check for subscription validation (since subscriptions are for future delivery)
    if (!skipOperatingHours) {
        // Check operating hours using IST
        const currentTime = TimezoneUtil.getTimeString();

        if (!TimezoneUtil.isTimeInRange(currentTime, this.operatingHours.start, this.operatingHours.end)) {
            console.log("Outside operating hours:", {
                currentTime,
                operatingHours: this.operatingHours,
                zoneName: this.zoneName
            });
            return false;
        }
    } else {
        console.log("Skipping operating hours check for subscription validation:", this.zoneName);
    }

    if (vendorType && !this.supportedVendorTypes.includes(vendorType)) {
        console.log("Vendor type not supported:", {
            vendorType,
            supportedVendorTypes: this.supportedVendorTypes,
            zoneName: this.zoneName
        });
        return false;
    }

    console.log("Service available for zone:", this.zoneName);
    return true;
}

// New method to validate delivery address
locationZoneSchema.methods.validateDeliveryAddress = function (address) {
    const errors = [];

    // Validate address object
    if (!address || typeof address !== 'object') {
        errors.push('Invalid delivery address format');
        return {
            isValid: false,
            errors: errors
        };
    }

    // Check pincode
    if (!address.zipCode) {
        errors.push('Zip code is required');
    } else if (!this.isPincodeSupported(address.zipCode)) {
        errors.push('Delivery not available to this pincode');
    }

    // Check coordinates if provided
    if (address.coordinates && address.coordinates.coordinates) {
        if (!Array.isArray(address.coordinates.coordinates) || address.coordinates.coordinates.length !== 2) {
            errors.push('Invalid coordinates format');
        } else {
            const coordinates = {
                lat: address.coordinates.coordinates[1],
                lng: address.coordinates.coordinates[0]
            };

            // Validate coordinate values
            if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
                errors.push('Invalid coordinate values');
            } else if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
                errors.push('Coordinates out of valid range');
            } else if (!this.isInServiceRadius(coordinates)) {
                errors.push('Delivery address is outside service area');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Method to check if subscription category is supported
locationZoneSchema.methods.isSubscriptionCategorySupported = function (subscriptionCategory) {
    console.log("Checking subscription category support:", {
        subscriptionCategory,
        supportedVendorTypes: this.supportedVendorTypes,
        serviceType: this.serviceType,
        zoneName: this.zoneName
    });

    // Handle specific subscription categories
    if (subscriptionCategory === 'home_chef') {
        const isSupported = this.supportedVendorTypes.includes('home_chef');
        console.log("Home chef support:", isSupported);
        return isSupported;
    } else if (subscriptionCategory === 'food_vendor') {
        const isSupported = this.supportedVendorTypes.includes('food_vendor');
        console.log("Food vendor support:", isSupported);
        return isSupported;
    }

    // Handle service type mapping for backwards compatibility
    if (subscriptionCategory === 'both_vendor_home_chef') {
        const isSupported = this.serviceType === 'both_vendor_home_chef' ||
            (this.supportedVendorTypes.includes('home_chef') &&
                this.supportedVendorTypes.includes('food_vendor'));
        console.log("Both vendor types support:", isSupported);
        return isSupported;
    }

    // Also check if the subscription category matches the service type directly
    if (this.serviceType === subscriptionCategory) {
        console.log("Direct service type match:", true);
        return true;
    }

    console.log("Unknown subscription category:", subscriptionCategory);
    return false;
}

locationZoneSchema.methods.isPincodeSupported = function (pincode) {
    if (!pincode) return false;

    // Convert to string and ensure it's a valid 6-digit pincode
    const pincodeStr = String(pincode).trim();
    if (!/^[0-9]{6}$/.test(pincodeStr)) return false;

    return this.pincodes.includes(pincodeStr);
}

locationZoneSchema.methods.calculateDeliveryFee = function (distance, orderValue = 0) {
    // Validate inputs
    distance = parseFloat(distance) || 0;
    orderValue = parseFloat(orderValue) || 0;

    if (distance < 0) distance = 0;
    if (orderValue < 0) orderValue = 0;

    // Check for free delivery
    if (this.deliveryFee.freeDeliveryAbove && orderValue >= this.deliveryFee.freeDeliveryAbove) {
        return 0;
    }

    const baseCharge = this.deliveryFee.baseCharge || 0;
    const perKmCharge = this.deliveryFee.perKmCharge || 0;

    return Math.round((baseCharge + (distance * perKmCharge)) * 100) / 100; // Round to 2 decimal places
}

locationZoneSchema.methods.isInServiceRadius = function (coordinates) {
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        return false;
    }

    if (!this.coordinates || !this.coordinates.center) {
        return false;
    }

    const distance = this.calculateDistance(this.coordinates.center, coordinates);
    return distance <= (this.serviceRadius || 0);
}

locationZoneSchema.methods.calculateDistance = function (coord1, coord2) {
    // Validate input coordinates
    if (!coord1 || !coord2 ||
        typeof coord1.lat !== 'number' || typeof coord1.lng !== 'number' ||
        typeof coord2.lat !== 'number' || typeof coord2.lng !== 'number') {
        return Infinity; // Return large distance for invalid coordinates
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

locationZoneSchema.methods.getAvailableVendorTypes = function () {
    if (!Array.isArray(this.supportedVendorTypes)) {
        return [];
    }
    return this.supportedVendorTypes.filter(type => this.isServiceAvailable(type));
}

// Static methods
locationZoneSchema.statics.findByPincode = function (pincode) {
    if (!pincode) return Promise.resolve([]);

    const pincodeStr = String(pincode).trim();
    if (!/^[0-9]{6}$/.test(pincodeStr)) {
        return Promise.resolve([]);
    }

    return this.find({
        pincodes: pincodeStr,
        isActive: true
    }).sort({ priority: -1 });
}

locationZoneSchema.statics.findByCity = function (city) {
    if (!city || typeof city !== 'string') {
        return Promise.resolve([]);
    }

    const cityStr = city.trim();
    if (cityStr.length === 0) {
        return Promise.resolve([]);
    }

    return this.find({
        city: new RegExp(cityStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), // Escape special regex characters
        isActive: true
    }).sort({ priority: -1 });
}

locationZoneSchema.statics.findByCoordinates = function (coordinates, radius = 50) {
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        return Promise.resolve([]);
    }

    // Validate coordinate ranges
    if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
        return Promise.resolve([]);
    }

    const radiusNum = parseFloat(radius);
    if (isNaN(radiusNum) || radiusNum <= 0) {
        return Promise.resolve([]);
    }

    return this.find({
        'coordinates.center': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: radiusNum * 1000 // Convert km to meters
            }
        },
        isActive: true
    }).sort({ priority: -1 });
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
        if (!Array.isArray(zones) || zones.length === 0) {
            return false;
        }
        return zones.some(zone => zone.isServiceAvailable(vendorType));
    }).catch(error => {
        console.error('Error checking service availability:', error);
        return false;
    });
}

// Static method to validate delivery for subscription purchase
locationZoneSchema.statics.validateDeliveryForSubscription = async function (deliveryAddress, subscriptionCategory) {
    try {
        // Validate input parameters
        if (!deliveryAddress || typeof deliveryAddress !== 'object') {
            return {
                isValid: false,
                errors: ['Invalid delivery address provided'],
                suggestedZones: []
            };
        }

        if (!subscriptionCategory || typeof subscriptionCategory !== 'string') {
            return {
                isValid: false,
                errors: ['Invalid subscription category provided'],
                suggestedZones: []
            };
        }

        if (!deliveryAddress.zipCode) {
            return {
                isValid: false,
                errors: ['Zip code is required in delivery address'],
                suggestedZones: []
            };
        }

        console.log("Validating delivery for subscription:", {
            zipCode: deliveryAddress.zipCode,
            subscriptionCategory: subscriptionCategory
        });

        // Find zones by pincode
        const zones = await this.findByPincode(deliveryAddress.zipCode);


        if (!Array.isArray(zones) || zones.length === 0) {
            return {
                isValid: false,
                errors: ['Delivery not available to this pincode'],
                suggestedZones: []
            };
        }

        // Check if any zone supports the subscription category and is available for subscriptions
        // Skip operating hours check since subscriptions are for future delivery
        const validZones = zones.filter(zone => {
            const isServiceAvailable = zone.isServiceAvailable(null, true); // Skip operating hours check
            const isSubscriptionSupported = zone.isSubscriptionCategorySupported(subscriptionCategory);

            console.log("Zone filtering for subscription:", {
                zoneName: zone.zoneName,
                isServiceAvailable,
                isSubscriptionSupported,
                subscriptionCategory,
                supportedVendorTypes: zone.supportedVendorTypes,
                serviceType: zone.serviceType
            });

            return isServiceAvailable && isSubscriptionSupported;
        });

        if (validZones.length === 0) {
            return {
                isValid: false,
                errors: [`${subscriptionCategory} service not available in this area`],
                suggestedZones: zones.map(zone => ({
                    zoneName: zone.zoneName,
                    supportedTypes: Array.isArray(zone.supportedVendorTypes) ? zone.supportedVendorTypes : [],
                    operatingHours: zone.operatingHours,
                    serviceType: zone.serviceType,
                    isActive: zone.isActive
                }))
            };
        }

        // Validate address against the best zone (highest priority)
        const bestZone = validZones[0];
        const addressValidation = bestZone.validateDeliveryAddress(deliveryAddress);

        if (!addressValidation.isValid) {
            return {
                isValid: false,
                errors: addressValidation.errors,
                zone: {
                    zoneName: bestZone.zoneName,
                    supportedTypes: bestZone.supportedVendorTypes,
                    operatingHours: bestZone.operatingHours
                }
            };
        }

        // Calculate delivery fee
        let deliveryFee = 0;
        if (deliveryAddress.coordinates && deliveryAddress.coordinates.coordinates &&
            Array.isArray(deliveryAddress.coordinates.coordinates) &&
            deliveryAddress.coordinates.coordinates.length >= 2) {

            const coordinates = {
                lat: deliveryAddress.coordinates.coordinates[1],
                lng: deliveryAddress.coordinates.coordinates[0]
            };

            if (typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
                const distance = bestZone.calculateDistance(bestZone.coordinates.center, coordinates);
                if (distance !== Infinity) {
                    deliveryFee = bestZone.calculateDeliveryFee(distance, 0); // Order value will be calculated later
                }
            }
        }

        return {
            isValid: true,
            zone: bestZone,
            deliveryFee: deliveryFee,
            supportedVendorTypes: Array.isArray(bestZone.supportedVendorTypes) ? bestZone.supportedVendorTypes : [],
            operatingHours: bestZone.operatingHours
        };
    } catch (error) {
        console.error("Error in validateDeliveryForSubscription:", {
            error: error.message,
            stack: error.stack,
            deliveryAddress,
            subscriptionCategory
        });

        return {
            isValid: false,
            errors: ['Error validating delivery area'],
            error: error.message
        };
    }
}

export default mongoose.model('LocationZone', locationZoneSchema)