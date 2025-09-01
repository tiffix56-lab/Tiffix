import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateLocationZone, ValidateUpdateLocationZone, ValidateLocationZoneQuery } from '../../service/validationService.js';
import LocationZone from '../../models/locationZone.model.js';
import User from '../../models/user.model.js';
import VendorProfile from '../../models/vendorProfile.model.js';
import quicker from '../../util/quicker.js';

export default {
    createLocationZone: async (req, res, next) => {
        try {
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateCreateLocationZone, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const newZone = new LocationZone(value);
            const savedZone = await newZone.save();

            httpResponse(req, res, 201, responseMessage.SUCCESS, { zone: savedZone });
        } catch (err) {
            console.error("Create Location Zone Error:", {
                message: err.message,
                stack: err.stack,
                body: req.body
            });

            const errorMessage = err.message || 'Internal server error while creating location zone';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getAllLocationZones: async (req, res, next) => {
        try {
            const { query } = req;

            const { error, value } = validateJoiSchema(ValidateLocationZoneQuery, query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                page = 1,
                limit = 10,
                city,
                state,
                country,
                serviceType,
                isActive,
                pincode,
                lat,
                lng,
                radius = 50,
                sortBy = 'priority',
                sortOrder = 'desc',
                search,
                vendorType
            } = value;

            const skip = (page - 1) * limit;
            const filter = {};

            // Basic filters
            if (city) filter.city = new RegExp(city, 'i');
            if (state) filter.state = new RegExp(state, 'i');
            if (country) filter.country = new RegExp(country, 'i');
            if (serviceType) filter.serviceType = serviceType;
            if (isActive !== undefined) filter.isActive = isActive === 'true';

            // Pincode filter
            if (pincode) {
                filter.pincodes = { $in: [pincode] };
            }

            // Service type based on vendor type
            if (vendorType) {
                if (vendorType === 'vendor') {
                    filter.serviceType = { $in: ['vendor_only', 'both_vendor_home_chef'] };
                } else if (vendorType === 'home_chef') {
                    filter.serviceType = { $in: ['home_chef_only', 'both_vendor_home_chef'] };
                }
            }

            // Text search across multiple fields
            if (search) {
                filter.$or = [
                    { zoneName: new RegExp(search, 'i') },
                    { city: new RegExp(search, 'i') },
                    { state: new RegExp(search, 'i') },
                    { notes: new RegExp(search, 'i') }
                ];
            }

            let zones;
            let total;

            // Geographic search using coordinates
            if (lat && lng) {
                const coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };

                // Use MongoDB geospatial query if available, otherwise calculate distance
                const allZones = await LocationZone.find(filter);
                zones = allZones.filter(zone => {
                    if (zone.coordinates && zone.coordinates.center) {
                        const distance = quicker.calculateDistance(
                            coordinates,
                            zone.coordinates.center
                        );
                        return distance <= parseFloat(radius);
                    }
                    return false;
                });

                total = zones.length;

                // Apply pagination to filtered results
                zones = zones.slice(skip, skip + parseInt(limit));
            } else {
                // Regular query without geographic filtering
                const sortObj = {};
                sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

                zones = await LocationZone.find(filter)
                    .sort(sortObj)
                    .skip(skip)
                    .limit(parseInt(limit));

                total = await LocationZone.countDocuments(filter);
            }

            // Add distance information if coordinates provided
            if (lat && lng) {
                zones = zones.map(zone => {
                    const zoneObj = zone.toObject ? zone.toObject() : zone;
                    if (zone.coordinates && zone.coordinates.center) {
                        zoneObj.distance = quicker.calculateDistance(
                            { lat: parseFloat(lat), lng: parseFloat(lng) },
                            zone.coordinates.center
                        );
                    }
                    return zoneObj;
                });
            }

            // Add zone-specific statistics for each zone
            const zonesWithStats = await Promise.all(zones.map(async (zone) => {
                const zoneObj = zone.toObject ? zone.toObject() : zone;

                // Get statistics for this specific zone
                const zoneStats = await Promise.all([
                    // Users in this zone (based on location pincode)
                    User.aggregate([
                        {
                            $match: {
                                'location.pincode': { $in: zoneObj.pincodes || [] },
                                role: 'USER'
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalUsers: { $sum: 1 },
                                activeUsers: {
                                    $sum: {
                                        $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                                    }
                                },
                                recentlyActiveUsers: {
                                    $sum: {
                                        $cond: [{
                                            $and: [
                                                { $eq: ['$isActive', true] },
                                                { $gte: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }
                                            ]
                                        }, 1, 0]
                                    }
                                }
                            }
                        }
                    ]),

                    // Vendors in this zone
                    VendorProfile.aggregate([
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        {
                            $match: {
                                'user.location.pincode': { $in: zoneObj.pincodes || [] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalVendors: { $sum: 1 },
                                totalChefs: {
                                    $sum: {
                                        $cond: [{ $eq: ['$vendorType', 'home_chef'] }, 1, 0]
                                    }
                                },
                                totalFoodVendors: {
                                    $sum: {
                                        $cond: [{ $eq: ['$vendorType', 'food_vendor'] }, 1, 0]
                                    }
                                },
                                verifiedVendors: {
                                    $sum: {
                                        $cond: [{ $eq: ['$isVerified', true] }, 1, 0]
                                    }
                                },
                                availableVendors: {
                                    $sum: {
                                        $cond: [{ $eq: ['$isAvailable', true] }, 1, 0]
                                    }
                                }
                            }
                        }
                    ])
                ]);

                // Add stats to zone object
                zoneObj.stats = {
                    users: {
                        totalUsers: zoneStats[0][0]?.totalUsers || 0,
                        activeUsers: zoneStats[0][0]?.activeUsers || 0,
                        recentlyActiveUsers: zoneStats[0][0]?.recentlyActiveUsers || 0
                    },
                    vendors: {
                        totalVendors: zoneStats[1][0]?.totalVendors || 0,
                        totalChefs: zoneStats[1][0]?.totalChefs || 0,
                        totalFoodVendors: zoneStats[1][0]?.totalFoodVendors || 0,
                        verifiedVendors: zoneStats[1][0]?.verifiedVendors || 0,
                        availableVendors: zoneStats[1][0]?.availableVendors || 0
                    }
                };

                return zoneObj;
            }));

            // Add global aggregated stats for all zones and users/vendors in the system
            const stats = await Promise.all([
                // Total zones
                LocationZone.countDocuments(),
                LocationZone.countDocuments({ isActive: true }),

                // Global user statistics
                User.aggregate([
                    {
                        $match: {
                            role: 'USER'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalUsers: { $sum: 1 },
                            activeUsers: {
                                $sum: {
                                    $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                                }
                            },
                            recentlyActiveUsers: {
                                $sum: {
                                    $cond: [{
                                        $and: [
                                            { $eq: ['$isActive', true] },
                                            { $gte: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }
                                        ]
                                    }, 1, 0]
                                }
                            }
                        }
                    }
                ]),

                // Global vendor statistics
                VendorProfile.aggregate([
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalVendors: { $sum: 1 },
                            totalChefs: {
                                $sum: {
                                    $cond: [{ $eq: ['$vendorType', 'home_chef'] }, 1, 0]
                                }
                            },
                            totalFoodVendors: {
                                $sum: {
                                    $cond: [{ $eq: ['$vendorType', 'food_vendor'] }, 1, 0]
                                }
                            },
                            verifiedVendors: {
                                $sum: {
                                    $cond: [{ $eq: ['$isVerified', true] }, 1, 0]
                                }
                            },
                            availableVendors: {
                                $sum: {
                                    $cond: [{ $eq: ['$isAvailable', true] }, 1, 0]
                                }
                            }
                        }
                    }
                ])
            ]);

            const globalStats = {
                zones: {
                    totalZones: stats[0],
                    activeZones: stats[1]
                },
                users: {
                    totalUsers: stats[2][0]?.totalUsers || 0,
                    activeUsers: stats[2][0]?.activeUsers || 0,
                    recentlyActiveUsers: stats[2][0]?.recentlyActiveUsers || 0
                },
                vendors: {
                    totalVendors: stats[3][0]?.totalVendors || 0,
                    totalChefs: stats[3][0]?.totalChefs || 0,
                    totalFoodVendors: stats[3][0]?.totalFoodVendors || 0,
                    verifiedVendors: stats[3][0]?.verifiedVendors || 0,
                    availableVendors: stats[3][0]?.availableVendors || 0
                }
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                zones: zonesWithStats,
                globalStats: globalStats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                filters: {
                    city,
                    state,
                    country,
                    serviceType,
                    isActive,
                    pincode,
                    coordinates: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseFloat(radius) } : null,
                    search,
                    vendorType
                }
            });
        } catch (err) {
            console.error("Get All Location Zones Error:", {
                message: err.message,
                stack: err.stack,
                query: req.query
            });

            const errorMessage = err.message || 'Internal server error while fetching location zones';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getLocationZoneById: async (req, res, next) => {
        try {
            const { id } = req.params;

            const zone = await LocationZone.findById(id);
            if (!zone) {
                return httpError(next, new Error('Location zone not found'), req, 404);
            }

            // Get aggregated stats for this specific zone
            const stats = await Promise.all([
                // Users in this zone (based on location pincode)
                User.aggregate([
                    {
                        $match: {
                            'location.pincode': { $in: zone.pincodes || [] },
                            role: 'USER'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalUsers: { $sum: 1 },
                            activeUsers: {
                                $sum: {
                                    $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                                }
                            }
                        }
                    }
                ]),

                // Vendors in this zone
                VendorProfile.aggregate([
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    {
                        $match: {
                            'user.location.pincode': { $in: zone.pincodes || [] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalVendors: { $sum: 1 },
                            totalChefs: {
                                $sum: {
                                    $cond: [{ $eq: ['$vendorType', 'home_chef'] }, 1, 0]
                                }
                            },
                            verifiedVendors: {
                                $sum: {
                                    $cond: [{ $eq: ['$isVerified', true] }, 1, 0]
                                }
                            },
                            availableVendors: {
                                $sum: {
                                    $cond: [{ $eq: ['$isAvailable', true] }, 1, 0]
                                }
                            }
                        }
                    }
                ])
            ]);

            const zoneStats = {
                totalUsers: stats[0][0]?.totalUsers || 0,
                activeUsers: stats[0][0]?.activeUsers || 0,
                totalVendors: stats[1][0]?.totalVendors || 0,
                totalChefs: stats[1][0]?.totalChefs || 0,
                verifiedVendors: stats[1][0]?.verifiedVendors || 0,
                availableVendors: stats[1][0]?.availableVendors || 0
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                zone: zone.toObject(),
                stats: zoneStats
            });
        } catch (err) {
            console.error("Get Location Zone By ID Error:", {
                message: err.message,
                stack: err.stack,
                zoneId: req.params.id
            });

            const errorMessage = err.message || 'Internal server error while fetching location zone details';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    updateLocationZone: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateUpdateLocationZone, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const updatedZone = await LocationZone.findByIdAndUpdate(id, value, {
                new: true,
                runValidators: true
            });

            if (!updatedZone) {
                return httpError(next, new Error('Location zone not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { zone: updatedZone });
        } catch (err) {
            console.error("Update Location Zone Error:", {
                message: err.message,
                stack: err.stack,
                zoneId: req.params.id,
                body: req.body
            });

            const errorMessage = err.message || 'Internal server error while updating location zone';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    deleteLocationZone: async (req, res, next) => {
        try {
            const { id } = req.params;

            const deletedZone = await LocationZone.findByIdAndDelete(id);
            if (!deletedZone) {
                return httpError(next, new Error('Location zone not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Location zone deleted successfully' });
        } catch (err) {
            console.error("Delete Location Zone Error:", {
                message: err.message,
                stack: err.stack,
                zoneId: req.params.id
            });

            const errorMessage = err.message || 'Internal server error while deleting location zone';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },


    checkServiceAvailability: async (req, res, next) => {
        try {
            const { pincode } = req.params;
            const { vendorType } = req.query;

            if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
                return httpError(next, new Error('Valid 6-digit pincode is required'), req, 400);
            }

            const zones = await LocationZone.findByPincode(pincode);

            if (zones.length === 0) {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    available: false,
                    message: 'Service not available in this pincode',
                    pincode
                });
            }

            const availableZones = zones.filter(zone => zone.isServiceAvailable(vendorType));

            // Add enhanced response with zone details
            const zoneDetails = availableZones.map(zone => ({
                _id: zone._id,
                zoneName: zone.zoneName,
                city: zone.city,
                serviceType: zone.serviceType,
                supportedVendorTypes: zone.supportedVendorTypes,
                operatingHours: zone.operatingHours,
                deliveryFee: zone.deliveryFee,
                isActive: zone.isActive
            }));

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                available: availableZones.length > 0,
                zones: zoneDetails,
                totalZones: zones.length,
                availableZones: availableZones.length,
                pincode,
                vendorType: vendorType || 'all',
                message: availableZones.length > 0 ? 'Service available' : 'Service temporarily unavailable'
            });
        } catch (err) {
            console.error("Check Service Availability Error:", {
                message: err.message,
                stack: err.stack,
                pincode: req.params.pincode,
                vendorType: req.query.vendorType
            });

            const errorMessage = err.message || 'Internal server error while checking service availability';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // New method to validate delivery for subscription
    validateDeliveryForSubscription: async (req, res, next) => {
        try {
            const { body } = req;
            const { deliveryAddress, subscriptionCategory } = body;

            if (!deliveryAddress || !subscriptionCategory) {
                return httpError(next, new Error('Delivery address and subscription category are required'), req, 400);
            }

            const validation = await LocationZone.validateDeliveryForSubscription(deliveryAddress, subscriptionCategory);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                ...validation,
                requestData: {
                    deliveryAddress,
                    subscriptionCategory
                }
            });
        } catch (err) {
            console.error("Validate Delivery For Subscription Error:", {
                message: err.message,
                stack: err.stack,
                body: req.body
            });

            const errorMessage = err.message || 'Internal server error while validating delivery for subscription';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },


    // Calculate delivery fee
    calculateDeliveryFee: async (req, res, next) => {
        try {
            const { zoneId } = req.params;
            const { distance, orderValue } = req.query;

            if (!distance || !orderValue) {
                return httpError(next, new Error('Distance and order value are required'), req, 400);
            }

            const zone = await LocationZone.findById(zoneId);
            if (!zone) {
                return httpError(next, new Error('Location zone not found'), req, 404);
            }

            const deliveryFee = zone.calculateDeliveryFee(parseFloat(distance), parseFloat(orderValue));

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                deliveryFee,
                distance: parseFloat(distance),
                orderValue: parseFloat(orderValue),
                zone: {
                    _id: zone._id,
                    zoneName: zone.zoneName,
                    city: zone.city
                }
            });
        } catch (err) {
            console.error("Calculate Delivery Fee Error:", {
                message: err.message,
                stack: err.stack,
                zoneId: req.params.zoneId,
                distance: req.query.distance,
                orderValue: req.query.orderValue
            });

            const errorMessage = err.message || 'Internal server error while calculating delivery fee';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    toggleZoneStatus: async (req, res, next) => {
        try {
            const { id } = req.params;

            const zone = await LocationZone.findById(id);
            if (!zone) {
                return httpError(next, new Error('Location zone not found'), req, 404);
            }

            zone.isActive = !zone.isActive;
            await zone.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                zone,
                message: `Zone ${zone.isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (err) {
            console.error("Toggle Zone Status Error:", {
                message: err.message,
                stack: err.stack,
                zoneId: req.params.id
            });

            const errorMessage = err.message || 'Internal server error while toggling zone status';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

};