import mongoose from 'mongoose'

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
        serviceRadius: {
            type: Number,
            default: 10,
            min: 1,
            max: 50
        },
        coordinates: {
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
        isActive: {
            type: Boolean,
            default: true
        },
    },
    { timestamps: true }
)

locationZoneSchema.index({ city: 1 })
locationZoneSchema.index({ pincodes: 1 })
locationZoneSchema.index({ isActive: 1 })
locationZoneSchema.index({ createdAt: -1 })

locationZoneSchema.index({ city: 1, isActive: 1 })
locationZoneSchema.index({ pincodes: 1, isActive: 1 })

locationZoneSchema.pre('save', function (next) {
    // Ensure pincodes are unique
    this.pincodes = [...new Set(this.pincodes)]
    next()
})

locationZoneSchema.methods.isServiceAvailable = function () {
    if (!this.isActive) {
        console.log("Zone not active:", this.zoneName);
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
            } else {
                // Calculate distance from zone coordinates
                const distance = this.calculateDistance(this.coordinates, coordinates);
                if (distance > this.serviceRadius) {
                    errors.push('Delivery address is outside service area');
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}


locationZoneSchema.methods.isPincodeSupported = function (pincode) {
    if (!pincode) return false;

    // Convert to string and ensure it's a valid 6-digit pincode
    const pincodeStr = String(pincode).trim();
    if (!/^[0-9]{6}$/.test(pincodeStr)) return false;

    return this.pincodes.includes(pincodeStr);
}


locationZoneSchema.methods.isInServiceRadius = function (coordinates) {
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        return false;
    }

    if (!this.coordinates) {
        return false;
    }

    const distance = this.calculateDistance(this.coordinates, coordinates);
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

locationZoneSchema.statics.findByPincode = function (pincode) {
    if (!pincode) return Promise.resolve([]);

    const pincodeStr = String(pincode).trim();
    if (!/^[0-9]{6}$/.test(pincodeStr)) {
        return Promise.resolve([]);
    }

    return this.find({
        pincodes: pincodeStr,
        isActive: true
    });
}

locationZoneSchema.statics.checkServiceAvailability = function (pincode) {
    return this.findByPincode(pincode).then(zones => {
        if (!Array.isArray(zones) || zones.length === 0) {
            return false;
        }
        return zones.some(zone => zone.isServiceAvailable());
    }).catch(error => {
        console.error('Error checking service availability:', error);
        return false;
    });
}

export default mongoose.model('LocationZone', locationZoneSchema)