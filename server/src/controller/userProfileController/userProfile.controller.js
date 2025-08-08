import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateAddAddress, ValidateUserPreferences, ValidateUserIdParam, ValidateUpdateUserProfile } from '../../service/validationService.js';
import UserProfile from '../../models/userProfile.model.js';
import User from '../../models/user.model.js';
import quicker from '../../util/quicker.js';

export default {

    getUserProfile: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;



            const userProfile = await UserProfile.findByUserId(userId).populate("userId");
            if (!userProfile) {
                return httpError(next, new Error('User profile not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { userProfile });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },


    updateUserProfile: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateUpdateUserProfile, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const userFields = {};
            const userProfileFields = {};

            if (value.name !== undefined) userFields.name = value.name;
            if (value.avatar !== undefined) userFields.avatar = value.avatar;
            if (value.isActive !== undefined) userFields.isActive = value.isActive;

            if (value.phoneNumber !== undefined) {
                const { countryCode, isoCode, internationalNumber } = quicker.parsePhoneNumber(`+${value.phoneNumber}`);
                if (!countryCode || !isoCode || !internationalNumber) {
                    return httpError(next, new Error('Invalid phone number format'), req, 422);
                }

                const existingUser = await User.findByPhoneNumber(internationalNumber);
                if (existingUser && existingUser._id.toString() !== userId) {
                    return httpError(next, new Error('Phone number already in use'), req, 409);
                }

                userFields.phoneNumber = { countryCode, isoCode, internationalNumber };

                // Update timezone based on country
                const timezones = quicker.countryTimezone(isoCode);
                if (timezones && timezones.length > 0) {
                    userFields.timezone = timezones[0].name;
                }
            }

            if (value.preferences !== undefined) userProfileFields.preferences = value.preferences;

            if (Object.keys(userFields).length > 0) {
                await User.findByIdAndUpdate(userId, userFields, {
                    new: true,
                    runValidators: true
                });
            }

            const updatedProfile = await UserProfile.findOneAndUpdate(
                { userId },
                userProfileFields,
                {
                    new: true,
                    runValidators: true,
                    upsert: true
                }
            ).populate('userId', 'name emailAddress phoneNumber avatar isActive');

            if (!updatedProfile) {
                return httpError(next, new Error('Failed to update user profile'), req, 500);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                userProfile: updatedProfile,
                message: 'Profile updated successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    addAddress: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;
            const { body } = req;

            const { error: bodyError, value: bodyValue } = validateJoiSchema(ValidateAddAddress, body);
            if (bodyError) {
                return httpError(next, bodyError, req, 422);
            }

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                return httpError(next, new Error('User profile not found'), req, 404);
            }

            await userProfile.addAddress(bodyValue);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                userProfile,
                message: 'Address added successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    updateAddress: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;
            const { addressIndex } = req.params;
            const { body } = req;

            if (!addressIndex || isNaN(parseInt(addressIndex))) {
                return httpError(next, new Error('Valid address index is required'), req, 422);
            }

            const { error: bodyError, value: bodyValue } = validateJoiSchema(ValidateAddAddress, body);
            if (bodyError) {
                return httpError(next, bodyError, req, 422);
            }

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                return httpError(next, new Error('User profile not found'), req, 404);
            }

            const index = parseInt(addressIndex);
            if (index < 0 || index >= userProfile.addresses.length) {
                return httpError(next, new Error('Invalid address index'), req, 400);
            }

            // If setting as default, unset other defaults
            if (bodyValue.isDefault) {
                userProfile.addresses.forEach((addr, idx) => {
                    if (idx !== index) addr.isDefault = false;
                });
            }

            userProfile.addresses[index] = { ...userProfile.addresses[index], ...bodyValue };
            await userProfile.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                userProfile,
                message: 'Address updated successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    deleteAddress: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;
            const { addressIndex } = req.params;

            if (!addressIndex || isNaN(parseInt(addressIndex))) {
                return httpError(next, new Error('Valid address index is required'), req, 422);
            }

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                return httpError(next, new Error('User profile not found'), req, 404);
            }

            const index = parseInt(addressIndex);
            if (index < 0 || index >= userProfile.addresses.length) {
                return httpError(next, new Error('Invalid address index'), req, 400);
            }

            const wasDefault = userProfile.addresses[index].isDefault;
            userProfile.addresses.splice(index, 1);

            if (wasDefault && userProfile.addresses.length > 0) {
                userProfile.addresses[0].isDefault = true;
            }

            await userProfile.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                userProfile,
                message: 'Address deleted successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    getAllAddresses: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                return httpError(next, new Error('User profile not found'), req, 404);
            }

            const addresses = userProfile.addresses || [];

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                addresses,
                totalAddresses: addresses.length
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    updatePreferences: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;
            const { body } = req;

            const { error: bodyError, value: bodyValue } = validateJoiSchema(ValidateUserPreferences, body);
            if (bodyError) {
                return httpError(next, bodyError, req, 422);
            }

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                return httpError(next, new Error('User profile not found'), req, 404);
            }

            userProfile.preferences = { ...userProfile.preferences, ...bodyValue.preferences };
            await userProfile.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                userProfile,
                message: 'Preferences updated successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

};