import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateVendorProfile, ValidateUpdateVendorProfile, ValidateVendorProfileQuery, ValidateVerifyVendor, ValidateUpdateCapacity, ValidateUpdateRating, ValidateNearbyVendors, ValidateVendorTypeParam, ValidateVendorCuisineParam, ValidateVendorIdParam, ValidateUserIdParam, ValidateCreateVendorWithUser, ValidateUpdateVendorWithUserInfo } from '../../util/validationService.js';
import VendorProfile from '../../models/vendorProfile.model.js';
import User from '../../models/user.model.js';
import { EUserRole } from '../../constant/application.js';
import quicker from '../../util/quicker.js';

export default {

    createVendorWithUser: async (req, res, next) => {
        try {
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateCreateVendorWithUser, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const existingUser = await User.findByEmail(value.user.emailAddress);
            if (existingUser) {
                return httpError(next, new Error('User with this email already exists'), req, 400);
            }

            // Parse phone number like in register function
            const { countryCode, isoCode, internationalNumber } = quicker.parsePhoneNumber(`+${value.user.phoneNumber}`);
            if (!countryCode || !isoCode || !internationalNumber) {
                return httpError(next, new Error('Invalid phone number format'), req, 422);
            }

            const userData = {
                name: value.user.name,
                emailAddress: value.user.emailAddress,
                phoneNumber: {
                    isoCode,
                    countryCode,
                    internationalNumber
                },
                password: value.user.password,
                role: EUserRole.VENDOR,
                isActive: true,
                accountConfirmation: {
                    status: true,
                    otp: '000000'
                },
                consent: true,
                timezone: value.user.timezone || 'UTC'
            };

            const newUser = new User(userData);
            const savedUser = await newUser.save();

            // Create vendor profile
            const vendorProfileData = {
                ...value.vendorProfile,
                userId: savedUser._id
            };

            const newVendorProfile = new VendorProfile(vendorProfileData);
            const savedProfile = await newVendorProfile.save();

            await savedProfile.populate('userId', 'name emailAddress phoneNumber role');

            httpResponse(req, res, 201, responseMessage.SUCCESS, {
                user: savedUser,
                vendorProfile: savedProfile,
                message: 'Vendor created successfully with user account'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

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
                sortOrder = 'desc',
                search
            } = value;

            const skip = (page - 1) * limit;
            const filter = {};

            // Apply filters
            if (vendorType) filter.vendorType = vendorType;
            if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
            if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
            if (cuisineTypes) filter['businessInfo.cuisineTypes'] = { $in: cuisineTypes.split(',') };
            if (minRating) filter['rating.average'] = { $gte: parseFloat(minRating) };

            // Search functionality
            if (search) {
                filter.$or = [
                    { 'businessInfo.businessName': { $regex: search, $options: 'i' } },
                    { 'businessInfo.description': { $regex: search, $options: 'i' } },
                    { 'businessInfo.cuisineTypes': { $regex: search, $options: 'i' } }
                ];
            }

            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const vendorProfiles = await VendorProfile.find(filter)
                .populate('userId', 'name emailAddress phoneNumber role isActive')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await VendorProfile.countDocuments(filter);

            // Calculate stats for the current query
            const stats = {
                totalVendors: total,
                verifiedVendors: await VendorProfile.countDocuments({ ...filter, isVerified: true }),
                availableVendors: await VendorProfile.countDocuments({ ...filter, isAvailable: true }),
                homeChefs: await VendorProfile.countDocuments({ ...filter, vendorType: 'home_chef' }),
                foodVendors: await VendorProfile.countDocuments({ ...filter, vendorType: 'food_vendor' })
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                vendorProfiles,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                },
                filters: {
                    vendorType,
                    isVerified,
                    isAvailable,
                    cuisineTypes,
                    minRating,
                    search
                },
                stats
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

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
                runValidators: false
            }).populate('userId', 'name emailAddress phoneNumber');

            if (!updatedProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { vendorProfile: updatedProfile });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    deleteVendorProfile: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(ValidateVendorIdParam, req.params);
            if (error) {
                return httpError(next, error, req, 422);


            }

            const isVendorExist = await VendorProfile.findById(value.id)

            if (!isVendorExist) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            const deletedProfile = await VendorProfile.findByIdAndDelete(value.id);
            if (!deletedProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            await User.findByIdAndDelete(isVendorExist.userId)

            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Vendor profile deleted successfully' });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

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

    me: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;

            const vendorProfile = await VendorProfile.findByUserId(userId).populate("userId", "-password");
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { vendorProfile });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },
    updateMyProfile: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateUpdateVendorWithUserInfo, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const vendorProfile = await VendorProfile.findOne({ userId });
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            // Update user info if provided
            if (value.user && Object.keys(value.user).length > 0) {
                // Check if email is being updated and if it already exists
                if (value.user.emailAddress) {
                    const existingUser = await User.findOne({
                        emailAddress: value.user.emailAddress,
                        _id: { $ne: userId }
                    });
                    if (existingUser) {
                        return httpError(next, new Error('Email already exists'), req, 400);
                    }
                }

                await User.findByIdAndUpdate(userId, value.user, { new: true });
            }

            // Update vendor profile if provided
            let updatedProfile = vendorProfile;
            if (value.vendorProfile && Object.keys(value.vendorProfile).length > 0) {
                updatedProfile = await VendorProfile.findByIdAndUpdate(vendorProfile._id, value.vendorProfile, {
                    new: true,
                    runValidators: false
                });
            }

            // Populate with updated user info
            await updatedProfile.populate('userId', 'name emailAddress phoneNumber');

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                vendorProfile: updatedProfile,
                message: 'Profile updated successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },


};