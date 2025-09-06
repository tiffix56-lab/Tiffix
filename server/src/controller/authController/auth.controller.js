import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateLogin, ValidateRegister, ValidateChangePassword, ValidateForgotPassword, ValidateUpdateLocation } from '../../service/validationService.js';
import config from '../../config/config.js';
import { EApplicationEnvironment, EAuthProvider, EUserRole } from '../../constant/application.js';
import userModel from '../../models/user.model.js';
import userProfileModel from '../../models/userProfile.model.js';
import quicker from '../../util/quicker.js';
import emailService from '../../service/emailService.js';
import referralService from '../../service/referralService.js';
import TimezoneUtil from '../../util/timezone.js';


export default {
    self: (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS);
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    login: async (req, res, next) => {
        try {
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateLogin, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { emailAddress, password } = value;

            const user = await userModel.findOne({ emailAddress });
            if (!user) {
                return httpError(next, new Error(responseMessage.AUTH.ACCOUNT_NOT_FOUND), req, 401);
            }

            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                return httpError(next, new Error(responseMessage.customMessage("Invalid Credentials")), req, 401);
            }

            if (!user.isAccountConfirmed()) {
                return httpError(next, new Error('Account not verified'), req, 403);
            }

            const accessToken = quicker.generateToken(
                {
                    userId: user._id,
                    email: user.emailAddress,
                    userType: user.role,
                    role: user.role
                },
                config.auth.jwtSecret,
                config.auth.jwtExpiresIn
            );

            res.cookie('accessToken', accessToken, {
                sameSite: 'strict',
                maxAge: 1000 * 3600 * 24 * 365,
                httpOnly: true,
                secure: !(config.env === EApplicationEnvironment.DEVELOPMENT)
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                accessToken,
                user: {
                    id: user._id,
                    email: user.emailAddress,
                    userType: user.role,
                    role: user.role
                }
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    register: async (req, res, next) => {
        try {
            const { body } = req;
            const { referralCode } = body;

            const { error, value } = validateJoiSchema(ValidateRegister, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { emailAddress, password, name, phoneNumber } = value;

            const existingUser = await userModel.findOne({ emailAddress });
            if (existingUser) {
                return httpError(next, new Error('User already exists with this email'), req, 409);
            }

            const { countryCode, isoCode, internationalNumber } = quicker.parsePhoneNumber(`+${phoneNumber}`)
            if (!countryCode || !isoCode || !internationalNumber) {
                return httpError(next, new Error(responseMessage.AUTH.INVALID_PHONE_NUMBER), req, 422)
            }

            const timezones = quicker.countryTimezone(isoCode)
            if (!timezones || timezones.length === 0) {
                return httpError(next, new Error(responseMessage.AUTH.INVALID_PHONE_NUMBER), req, 422)
            }
            const timezone = timezones[0].name;

            const otp = quicker.generateOTP();
            const hashedOTP = await quicker.hashPassword(otp);

            const userData = {
                name,
                emailAddress,
                password: password,
                phoneNumber: { countryCode, isoCode, internationalNumber },
                role: EUserRole.USER,
                provider: EAuthProvider.LOCAL,
                timezone: timezone,
                consent: true,
                isActive: false,
                accountConfirmation: {
                    status: false,
                    otp: hashedOTP,
                    timestamp: TimezoneUtil.now()
                },
                referral: {
                    userReferralCode: await userModel.generateUniqueReferralCode(),
                    referralCodeGeneratedAt: TimezoneUtil.now(),
                    canRefer: true
                }
            };

            const newUser = new userModel(userData);
            const savedUser = await newUser.save();


            let referralMessage = '';
            if (referralCode) {
                try {
                    const referralResult = await referralService.validateAndLinkReferral(referralCode, savedUser._id);
                    if (referralResult.success) {
                        referralMessage = ` You've been referred by ${referralResult.referrerName}!`;
                    }
                } catch (referralError) {
                    console.warn('Referral linking failed:', referralError.message);
                }
            }

            try {
                await emailService.sendVerificationEmail(emailAddress, userData.name, otp);
            } catch (emailError) {
                console.warn('Verification email failed:', emailError.message);
            }

            httpResponse(req, res, 201, responseMessage.SUCCESS, {
                message: `Registration successful! Please check your email for verification code.${referralMessage}`,
                user: {
                    id: savedUser._id,
                    email: savedUser.emailAddress,
                    name: savedUser.name,
                    role: savedUser.role,
                    isAccountConfirmed: false,
                    referralCode: savedUser.referral.userReferralCode
                },
                requiresVerification: true
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    logout: (req, res, next) => {
        try {
            res.clearCookie('accessToken');
            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Logged out successfully' });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    changePassword: async (req, res, next) => {
        try {
            const { body } = req;
            const { userId } = req.authenticatedUser;

            const { error, value } = validateJoiSchema(ValidateChangePassword, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { currentPassword, newPassword } = value;

            const user = await userModel.findById(userId);
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            const isCurrentPasswordValid = await quicker.comparePassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return httpError(next, new Error('Current password is incorrect'), req, 400);
            }

            const hashedNewPassword = await quicker.hashPassword(newPassword);
            await userModel.findByIdAndUpdate(userId, { password: hashedNewPassword });

            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Password changed successfully' });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    verifyEmail: async (req, res, next) => {
        try {
            const { body } = req;
            const { otp, emailAddress } = body;

            if (!otp || !emailAddress) {
                return httpError(next, new Error('OTP and email address are required'), req, 400);
            }

            const user = await userModel.findOne({ emailAddress });
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (user.accountConfirmation.status) {
                return httpError(next, new Error('Email already verified'), req, 400);
            }

            const isOTPValid = await quicker.comparePassword(otp, user.accountConfirmation.otp);
            if (!isOTPValid) {
                return httpError(next, new Error('Invalid OTP'), req, 400);
            }

            const otpAge = Date.now() - user.accountConfirmation.timestamp.getTime();
            if (otpAge > 10 * 60 * 1000) {
                return httpError(next, new Error('OTP expired. Please request a new one'), req, 400);
            }

            user.accountConfirmation.status = true;
            user.isActive = true;
            await user.save();

            try {
                const newUserProfile = new userProfileModel({
                    userId: user._id
                });
                await newUserProfile.save();
            } catch (profileError) {
                console.warn('User profile creation failed:', profileError.message);
            }

            let referralRewardMessage = '';
            if (user.referral.referredBy && !user.referral.isReferralUsed) {
                try {
                    const referralResult = await referralService.processReferralReward(user._id);
                    if (referralResult.success) {
                        referralRewardMessage = ` 🎉 Referral bonus: You got ${referralResult.newUserCredits} credits and your referrer got ${referralResult.referrerCredits} credits!`;
                    }
                } catch (referralError) {
                    console.warn('Referral reward processing failed:', referralError.message);
                }
            }

            try {
                await emailService.sendWelcomeEmail(user.emailAddress, user.name, user.role);
            } catch (emailError) {
                console.warn('Welcome email failed:', emailError.message);
            }

            const accessToken = quicker.generateToken(
                {
                    userId: user._id,
                    email: user.emailAddress,
                    userType: user.role,
                    role: user.role
                },
                config.auth.jwtSecret,
                config.auth.jwtExpiresIn
            );

            res.cookie('accessToken', accessToken, {
                sameSite: 'strict',
                maxAge: 1000 * 3600 * 24 * 365,
                httpOnly: true,
                secure: !(config.env === EApplicationEnvironment.DEVELOPMENT)
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: `Email verified successfully!${referralRewardMessage}`,
                user: {
                    id: user._id,
                    email: user.emailAddress,
                    name: user.name,
                    role: user.role,
                    isAccountConfirmed: true,
                    referralCode: user.referral.userReferralCode,
                    canRefer: user.referral.canRefer
                },
                accessToken,
                hasReferralReward: !!referralRewardMessage
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    resendVerificationOTP: async (req, res, next) => {
        try {
            const { emailAddress } = req.body;

            if (!emailAddress) {
                return httpError(next, new Error('Email address is required'), req, 400);
            }

            const user = await userModel.findOne({ emailAddress });
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (user.accountConfirmation.status) {
                return httpError(next, new Error('Email already verified'), req, 400);
            }

            const newOTP = quicker.generateOTP();
            const hashedNewOTP = await quicker.hashPassword(newOTP);
            user.accountConfirmation.otp = hashedNewOTP;
            user.accountConfirmation.timestamp = TimezoneUtil.now();
            await user.save();

            try {
                await emailService.sendVerificationEmail(emailAddress, user.name, newOTP);
            } catch (emailError) {
                return httpError(next, new Error('Failed to send verification email'), req, 500);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'New verification code sent to your email'
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { body } = req;
            const { error, value } = validateJoiSchema(ValidateForgotPassword, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { emailAddress } = value;
            const user = await userModel.findOne({ emailAddress });

            if (!user) {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    message: 'If email exists, reset instructions have been sent'
                });
            }

            const resetOTP = quicker.generateOTP();
            const hashedResetOTP = await quicker.hashPassword(resetOTP);
            const expiryTime = Date.now() + (60 * 60 * 1000);

            user.passwordReset.otp = hashedResetOTP;
            user.passwordReset.expiry = expiryTime;
            user.passwordReset.lastResetAt = TimezoneUtil.now();
            await user.save();

            try {
                await emailService.sendPasswordResetEmail(user.emailAddress, user.name, resetOTP);
            } catch (emailError) {
                console.warn('Password reset email failed:', emailError.message);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Password reset code sent to your email'
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { emailAddress, otp, newPassword } = req.body;

            if (!emailAddress || !otp || !newPassword) {
                return httpError(next, new Error('Email, OTP, and new password are required'), req, 400);
            }

            const user = await userModel.findOne({ emailAddress });
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (!user.isPasswordResetValid()) {
                return httpError(next, new Error('Invalid or expired reset code'), req, 400);
            }

            const isResetOTPValid = await quicker.comparePassword(otp, user.passwordReset.otp);
            if (!isResetOTPValid) {
                return httpError(next, new Error('Invalid reset code'), req, 400);
            }

            user.password = newPassword;
            user.passwordReset.otp = null;
            user.passwordReset.expiry = null;
            await user.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Password reset successfully'
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    me: async (req, res, next) => {
        try {
            const user = req.authenticatedUser;
            console.log(user);


            if (!user) {
                return httpError(next, new Error('Invalid token'), req, 401);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                valid: true,
                user: {
                    id: user._id,
                    email: user.emailAddress,
                    name: user.name,
                    role: user.role,
                    isAccountConfirmed: user.accountConfirmation.status
                }
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    oauthSuccess: async (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                return httpError(next, new Error('OAuth authentication failed'), req, 401);
            }

            const needsProfileCompletion = !user.phoneNumber?.internationalNumber;

            const accessToken = quicker.generateToken(
                {
                    userId: user._id,
                    email: user.emailAddress,
                    userType: user.role,
                    role: user.role
                },
                config.auth.jwtSecret,
                config.auth.jwtExpiresIn
            );

            res.cookie('accessToken', accessToken, {
                sameSite: 'strict',
                maxAge: 1000 * 3600 * 24 * 365,
                httpOnly: true,
                secure: !(config.env === EApplicationEnvironment.DEVELOPMENT)
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                accessToken,
                user: {
                    id: user._id,
                    email: user.emailAddress,
                    userType: user.role,
                    role: user.role
                },
                needsProfileCompletion,
                message: needsProfileCompletion ? 'Please complete your profile by adding phone number' : 'Login successful'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getUserLocation: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;

            const user = await userModel.findById(userId).select('location');
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (!user.location || !user.location.coordinates || user.location.coordinates[0] === 0) {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    hasLocation: false,
                    message: 'No location set for user'
                });
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                hasLocation: true,
                location: {
                    latitude: user.location.coordinates[1],
                    longitude: user.location.coordinates[0],
                    address: user.location.address,
                    city: user.location.city,
                    state: user.location.state,
                    country: user.location.country,
                    pincode: user.location.pincode,
                    lastUpdated: user.location.lastUpdated ? TimezoneUtil.format(user.location.lastUpdated, 'datetime') : null
                }
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    oauthFailure: (req, res, next) => {
        try {
            httpResponse(req, res, 400, 'Authentication failed', {
                status: false,
                message: "Failed Authentication"
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    updatePhoneNumber: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;
            const { phoneNumber } = req.body;

            if (!phoneNumber) {
                return httpError(next, new Error('Phone number is required'), req, 400);
            }

            const user = await userModel.findById(userId);
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }


            const { countryCode, isoCode, internationalNumber } = quicker.parsePhoneNumber(`+${phoneNumber}`);
            if (!countryCode || !isoCode || !internationalNumber) {
                return httpError(next, new Error(responseMessage.AUTH.INVALID_PHONE_NUMBER), req, 422);
            }

            const existingUserWithPhone = await userModel.findByPhoneNumber(internationalNumber);
            if (existingUserWithPhone) {
                return httpError(next, new Error('Phone number already in use'), req, 409);
            }

            const timezones = quicker.countryTimezone(isoCode);
            if (!timezones || timezones.length === 0) {
                return httpError(next, new Error(responseMessage.AUTH.INVALID_PHONE_NUMBER), req, 422);
            }
            const timezone = timezones[0].name;

            user.phoneNumber = { countryCode, isoCode, internationalNumber };
            user.timezone = timezone;
            await user.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Profile completed successfully',
                user: {
                    id: user._id,
                    email: user.emailAddress,
                    name: user.name,
                    role: user.role,
                    phoneNumber: user.phoneNumber,
                    profileComplete: true
                }
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    updateLocation: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateUpdateLocation, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { latitude, longitude, address, city, state, country, pincode } = value;

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            const user = await userModel.findById(userId);
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            const locationData = {
                type: 'Point',
                coordinates: [lng, lat],
                address: address || null,
                city: city || null,
                state: state || null,
                country: country || null,
                pincode: pincode || null
            };

            await user.updateLocation(locationData);

            let userProfile = await userProfileModel.findOne({ userId });
            if (userProfile) {
                const hasDefaultAddress = userProfile.addresses && userProfile.addresses.some(addr => addr.isDefault);

                if (!hasDefaultAddress || userProfile.addresses.length === 0) {
                    const newAddress = {
                        label: 'Default Address',
                        street: address || 'Not specified',
                        city: city || 'Not specified',
                        state: state || 'Not specified',
                        zipCode: pincode || '000000',
                        coordinates: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        isDefault: true
                    };

                    if (userProfile.addresses && userProfile.addresses.length > 0) {
                        userProfile.addresses.forEach(addr => {
                            addr.isDefault = false;
                        });
                    }

                    userProfile.addresses.push(newAddress);
                    await userProfile.save();
                }
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Location updated successfully',
                location: {
                    latitude: lat,
                    longitude: lng,
                    address,
                    city,
                    state,
                    country,
                    pincode,
                    lastUpdated: TimezoneUtil.format(TimezoneUtil.now(), 'datetime')
                }
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};