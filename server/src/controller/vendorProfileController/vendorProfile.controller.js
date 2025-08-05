import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateVendorProfile, ValidateUpdateVendorProfile, ValidateVendorProfileQuery, ValidateVerifyVendor, ValidateUpdateCapacity, ValidateUpdateRating, ValidateNearbyVendors, ValidateVendorTypeParam, ValidateVendorCuisineParam, ValidateVendorIdParam, ValidateUserIdParam } from '../../util/validationService.js';
import VendorProfile from '../../models/vendorProfile.model.js';
import User from '../../models/user.model.js';

export default {
    // Create vendor profile (Admin only)
    createVendorProfile: async (req, res, next) => {
        try {
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateCreateVendorProfile, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            // Check if user exists and has vendor role
            const user = await User.findById(value.userId);
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (user.role !== 'vendor') {
                return httpError(next, new Error('User must have vendor role'), req, 400);
            }

            // Check if vendor profile already exists
            const existingProfile = await VendorProfile.findOne({ userId: value.userId });
            if (existingProfile) {
                return httpError(next, new Error('Vendor profile already exists for this user'), req, 400);
            }

            const newVendorProfile = new VendorProfile(value);
            const savedProfile = await newVendorProfile.save();

            await savedProfile.populate('userId', 'name emailAddress phoneNumber');

            httpResponse(req, res, 201, responseMessage.SUCCESS, { vendorProfile: savedProfile });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get all vendor profiles with filters
    getAllVendorProfiles: async (req, res, next) => {
        try {
            const { query } = req;
            
            const { error, value } = validateJoiSchema(ValidateVendorProfileQuery, query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { 
                page = 1, 
                limit = 10, 
                vendorType,
                isVerified,
                isAvailable,
                cuisineTypes,
                minRating,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = value;

            const skip = (page - 1) * limit;
            const filter = {};

            if (vendorType) filter.vendorType = vendorType;
            if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
            if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
            if (cuisineTypes) filter['businessInfo.cuisineTypes'] = { $in: cuisineTypes.split(',') };
            if (minRating) filter['rating.average'] = { $gte: parseFloat(minRating) };

            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const vendorProfiles = await VendorProfile.find(filter)
                .populate('userId', 'name emailAddress phoneNumber')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await VendorProfile.countDocuments(filter);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                vendorProfiles,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get single vendor profile by ID
    getVendorProfileById: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const vendorProfile = await VendorProfile.findById(value.id)
                .populate('userId', 'name emailAddress phoneNumber');
            
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { vendorProfile });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get vendor profile by user ID
    getVendorProfileByUserId: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(ValidateUserIdParam, req.params);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const vendorProfile = await VendorProfile.findByUserId(value.userId);
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { vendorProfile });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Update vendor profile
    updateVendorProfile: async (req, res, next) => {
        try {
            const { error: paramError, value: paramValue } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (paramError) {
                return httpError(next, paramError, req, 422);
            }

            const { error, value } = validateJoiSchema(ValidateUpdateVendorProfile, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const updatedProfile = await VendorProfile.findByIdAndUpdate(paramValue.id, value, { 
                new: true, 
                runValidators: true 
            }).populate('userId', 'name emailAddress phoneNumber');

            if (!updatedProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { vendorProfile: updatedProfile });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Delete vendor profile (Admin only)
    deleteVendorProfile: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const deletedProfile = await VendorProfile.findByIdAndDelete(value.id);
            if (!deletedProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Vendor profile deleted successfully' });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },


    // Verify vendor (Admin only)
    verifyVendor: async (req, res, next) => {
        try {
            const { error: paramError, value: paramValue } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (paramError) {
                return httpError(next, paramError, req, 422);
            }

            const { error, value } = validateJoiSchema(ValidateVerifyVendor, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const vendor = await VendorProfile.findById(paramValue.id);
            if (!vendor) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            vendor.isVerified = value.isVerified;
            await vendor.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                vendorProfile: vendor,
                message: `Vendor ${value.isVerified ? 'verified' : 'unverified'} successfully`
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Toggle vendor availability
    toggleAvailability: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const vendor = await VendorProfile.findById(value.id);
            if (!vendor) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            vendor.isAvailable = !vendor.isAvailable;
            await vendor.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                vendorProfile: vendor,
                message: `Vendor ${vendor.isAvailable ? 'is now available' : 'is now unavailable'}`
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Update vendor capacity
    updateCapacity: async (req, res, next) => {
        try {
            const { error: paramError, value: paramValue } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (paramError) {
                return httpError(next, paramError, req, 422);
            }

            const { error, value } = validateJoiSchema(ValidateUpdateCapacity, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const vendor = await VendorProfile.findById(paramValue.id);
            if (!vendor) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            await vendor.updateCapacity(value.orderCount);

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                vendorProfile: vendor,
                message: 'Vendor capacity updated successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Reset daily capacity (Admin only - for daily reset job)
    resetDailyCapacity: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const vendor = await VendorProfile.findById(value.id);
            if (!vendor) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            await vendor.resetDailyCapacity();

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                vendorProfile: vendor,
                message: 'Daily capacity reset successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Update vendor rating
    updateRating: async (req, res, next) => {
        try {
            const { error: paramError, value: paramValue } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (paramError) {
                return httpError(next, paramError, req, 422);
            }

            const { error, value } = validateJoiSchema(ValidateUpdateRating, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const vendor = await VendorProfile.findById(paramValue.id);
            if (!vendor) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            await vendor.updateRating(value.rating);

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                vendorProfile: vendor,
                message: 'Rating updated successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get vendor statistics (Admin only)
    getVendorStats: async (req, res, next) => {
        try {
            const totalVendors = await VendorProfile.countDocuments();
            const verifiedVendors = await VendorProfile.countDocuments({ isVerified: true });
            const availableVendors = await VendorProfile.countDocuments({ isAvailable: true });

            const typeStats = await VendorProfile.aggregate([
                { $group: { _id: '$vendorType', count: { $sum: 1 } } }
            ]);

            const averageRating = await VendorProfile.aggregate([
                { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
            ]);

            const topVendors = await VendorProfile.find({ isVerified: true })
                .populate('userId', 'name')
                .sort({ 'rating.average': -1 })
                .limit(5);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                totalVendors,
                verifiedVendors,
                availableVendors,
                unverifiedVendors: totalVendors - verifiedVendors,
                typeStats,
                averageRating: averageRating[0]?.avgRating || 0,
                topVendors
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    }
};