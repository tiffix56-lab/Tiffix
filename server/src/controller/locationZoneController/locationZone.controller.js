import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateLocationZone, ValidateUpdateLocationZone, ValidateLocationZoneQuery } from '../../util/validationService.js';
import LocationZone from '../../models/locationZone.model.js';
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
            httpError(next, err, req, 500);
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

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                zones,
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
            httpError(next, err, req, 500);
        }
    },

    getLocationZoneById: async (req, res, next) => {
        try {
            const { id } = req.params;

            const zone = await LocationZone.findById(id);
            if (!zone) {
                return httpError(next, new Error('Location zone not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { zone });
        } catch (err) {
            httpError(next, err, req, 500);
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
            httpError(next, err, req, 500);
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
            httpError(next, err, req, 500);
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

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                available: availableZones.length > 0,
                zones: availableZones,
                pincode,
                vendorType: vendorType || 'all'
            });
        } catch (err) {
            httpError(next, err, req, 500);
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
            httpError(next, err, req, 500);
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
            httpError(next, err, req, 500);
        }
    },

};