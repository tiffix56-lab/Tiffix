import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateLogin, ValidateRegister, ValidateChangePassword, ValidateForgotPassword, ValidateUpdateLocation } from '../../service/validationService.js';
import config from '../../config/config.js';
import { EApplicationEnvironment, EAuthProvider, EUserRole } from '../../constant/application.js';
import userModel from '../../models/user.model.js';
import userProfileModel from '../../models/userProfile.model.js';
import quicker from '../../util/quicker.js';
import whatsappService, { sendTwilioMessage } from '../../service/whatsappService.js';
import TimezoneUtil from '../../util/timezone.js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';


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

            const user = await userModel.findOne({ emailAddress, isDeleted: false });
            if (!user) {
                return httpError(next, new Error(responseMessage.AUTH.ACCOUNT_NOT_FOUND), req, 401);
            }

            if (user?.isBanned) {
                return httpError(next, new Error(responseMessage.customMessage("Your Account Is Suspended")), req, 401)
            }

            const isPasswordValid = await user.comparePassword(password);


            if (!isPasswordValid) {
                return httpError(next, new Error(responseMessage.customMessage("Invalid Credentials")), req, 401);
            }

            if (!user.isAccountConfirmed()) {
                return httpResponse(req, res, 403, responseMessage.customMessage('Account not verified'), {
                    isVerified: false,
                    requiresVerification: true,
                    message: 'Please verify your account to continue',
                    user: {
                        id: user._id,
                        email: user.emailAddress,
                        phoneNumber: user.phoneNumber?.internationalNumber || null,
                        name: user.name
                    }
                });
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

            const { error, value } = validateJoiSchema(ValidateRegister, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { emailAddress, password, name, phoneNumber } = value;

            const existingUser = await userModel.findOne({ emailAddress, isDeleted: false });
            if (existingUser) {
                return httpError(next, new Error('User already exists with this email'), req, 409);
            }

            const { countryCode, isoCode, internationalNumber } = quicker.parsePhoneNumber(`+${phoneNumber}`)
            if (!countryCode || !isoCode || !internationalNumber) {
                return httpError(next, new Error(responseMessage.AUTH.INVALID_PHONE_NUMBER), req, 422)
            }

            const existingUserByEmail = await userModel.findActiveByEmail(emailAddress);
            const existingUserByPhone = await userModel.findActiveByPhoneNumber(internationalNumber);

            if (existingUserByEmail) {
                return httpError(next, new Error('An active account already exists with this email'), req, 409);
            }

            if (existingUserByPhone) {
                return httpError(next, new Error('An active account already exists with this phone number'), req, 409);
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
                isDeleted: false,
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


            const userProfile = new userProfileModel({
                userId: savedUser._id,
                addresses: [],
                preferences: {}
            });
            await userProfile.save();
            console.log('✅ Created user profile for new user:', savedUser._id);




            try {
                await whatsappService.sendVerificationMessage(userData.phoneNumber.internationalNumber, userData.name, otp);
            } catch (whatsappError) {
                console.warn('Verification WhatsApp failed:', whatsappError.message);
            }

            httpResponse(req, res, 201, responseMessage.SUCCESS, {
                message: `Registration successful! Please check your WhatsApp for verification code.`,
                user: {
                    id: savedUser._id,
                    email: savedUser.emailAddress,
                    name: savedUser.name,
                    role: savedUser.role,
                    isAccountConfirmed: false,
                },
                requiresVerification: true
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    verifyAccount: async (req, res, next) => {
        try {
            const { body } = req;
            const { otp, emailAddress, phoneNumber } = body;

            if (!otp || (!emailAddress && !phoneNumber)) {
                return httpError(next, new Error('OTP and either email address or phone number are required'), req, 400);
            }

            let user;

            if (emailAddress) {
                user = await userModel.findOne({ emailAddress, isDeleted: false });
            } else if (phoneNumber) {
                const { internationalNumber } = quicker.parsePhoneNumber(`+${phoneNumber}`);
                user = await userModel.findActiveByPhoneNumber(internationalNumber);
            }

            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            const isOTPValid = await quicker.comparePassword(otp, user.accountConfirmation.otp);
            if (!isOTPValid) {
                return httpError(next, new Error('Invalid OTP'), req, 400);
            }

            const otpAge = Date.now() - user.accountConfirmation.timestamp.getTime();
            if (otpAge > 10 * 60 * 1000) {
                return httpError(next, new Error('OTP expired. Please request a new one'), req, 400);
            }

            if (user.accountConfirmation.status) {
                return httpError(next, new Error('Account already verified'), req, 400);
            }

            user.accountConfirmation.status = true;
            user.isActive = true;
            await user.save();

            try {
                let existingProfile = await userProfileModel.findOne({ userId: user._id });
                if (!existingProfile) {
                    const newUserProfile = new userProfileModel({
                        userId: user._id
                    });
                    await newUserProfile.save();
                    console.log('✅ Created user profile during verification:', user._id);
                } else {
                    console.log('✅ User profile already exists for user:', user._id);
                }
            } catch (profileError) {
                console.warn('User profile creation failed:', profileError.message);
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
                message: `Account verified successfully!`,
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
            });
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    resendVerificationOTP: async (req, res, next) => {
        try {
            const { emailAddress, phoneNumber } = req.body;

            if (!emailAddress && !phoneNumber) {
                return httpError(next, new Error('Either email address or phone number is required'), req, 400);
            }

            let user;

            if (emailAddress) {
                user = await userModel.findOne({ emailAddress });
            } else if (phoneNumber) {
                const { internationalNumber } = quicker.parsePhoneNumber(`+${phoneNumber}`);
                user = await userModel.findActiveByPhoneNumber(internationalNumber);
            }

            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (user?.isBanned) {
                return httpError(next, new Error(responseMessage.customMessage("Your Account Is Suspended")), req, 401)
            }

            if (user.accountConfirmation.status) {
                return httpError(next, new Error('Account already verified'), req, 400);
            }

            if (!user.phoneNumber?.internationalNumber) {
                return httpError(next, new Error('Phone number not found for this user. Cannot send verification code.'), req, 400);
            }

            const newOTP = quicker.generateOTP();
            const hashedNewOTP = await quicker.hashPassword(newOTP);
            user.accountConfirmation.otp = hashedNewOTP;
            user.accountConfirmation.timestamp = TimezoneUtil.now();
            await user.save();

            try {
                await whatsappService.sendVerificationMessage(
                    user.phoneNumber.internationalNumber,
                    user.name,
                    newOTP
                );
            } catch (whatsappError) {
                return httpError(next, new Error('Failed to send verification WhatsApp'), req, 500);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'New verification code sent to your WhatsApp',
                phoneNumber: user.phoneNumber.internationalNumber
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
                await whatsappService.sendPasswordResetMessage(user.phoneNumber.internationalNumber, user.name, resetOTP);
            } catch (whatsappError) {
                console.warn('Password reset WhatsApp failed:', whatsappError.message);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Password reset code sent to your WhatsApp'
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

    deleteAccount: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser;

            const user = await userModel.findById(userId);
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (user.isDeleted) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (user?.isBanned) {
                return httpError(next, new Error(responseMessage.customMessage("Your Account Is Suspended")), req, 401)
            }


            await user.softDelete('User requested account deletion');

            res.clearCookie('accessToken');

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Account deleted successfully. We hope to see you again!',
                deleted: true
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

            const existingUserWithPhone = await userModel.findActiveByPhoneNumber(internationalNumber);
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
    },

    googleMobileAuth: async (req, res, next) => {
        try {
            const { idToken } = req.body;
            console.log(config.auth.google.clientId);

            if (!idToken) {
                return httpError(next, new Error('ID token is required'), req, 400);
            }

            // Initialize Google OAuth2 client
            const client = new OAuth2Client(config.auth.google.clientId);

            // Verify the ID token
            let ticket;
            try {
                ticket = await client.verifyIdToken({
                    idToken: idToken,
                    audience: config.auth.google.clientId,
                });
            } catch (verifyError) {
                console.error('Google token verification failed:', verifyError);
                return httpError(next, new Error('Invalid Google token'), req, 401);
            }

            const payload = ticket.getPayload();
            const { email, name, sub: googleId, picture } = payload;

            if (!email) {
                return httpError(next, new Error('Email not provided by Google'), req, 400);
            }

            // Check if user exists
            let user = await userModel.findOne({ emailAddress: email, isDeleted: false });

            if (user) {
                // Existing user - log them in
                if (user.isBanned) {
                    return httpError(next, new Error('Your account is suspended'), req, 401);
                }

                // Update provider info if it was a local account
                if (user.provider === EAuthProvider.LOCAL) {
                    user.provider = EAuthProvider.GOOGLE;
                    user.googleId = googleId;
                    user.accountConfirmation.status = true;
                    user.isActive = true;
                }

                // Update last login
                user.lastLogin = TimezoneUtil.now();
                await user.save();
            } else {
                // New user - create account
                const userData = {
                    name,
                    emailAddress: email,
                    avatar: picture,
                    googleId: googleId,
                    provider: EAuthProvider.GOOGLE,
                    role: EUserRole.USER,
                    consent: true,
                    isActive: true,
                    isDeleted: false,
                    accountConfirmation: {
                        status: true,
                        timestamp: TimezoneUtil.now()
                    },
                    referral: {
                        userReferralCode: await userModel.generateUniqueReferralCode(),
                        referralCodeGeneratedAt: TimezoneUtil.now(),
                        canRefer: true
                    },
                    lastLogin: TimezoneUtil.now()
                };

                user = new userModel(userData);
                await user.save();

                // Create user profile
                try {
                    const userProfile = new userProfileModel({
                        userId: user._id,
                        addresses: [],
                        preferences: {}
                    });
                    await userProfile.save();
                } catch (profileError) {
                    console.warn('User profile creation failed for OAuth user:', profileError.message);
                }
            }

            const needsProfileCompletion = !user.phoneNumber?.internationalNumber;

            // Generate JWT token
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
                    name: user.name,
                    userType: user.role,
                    role: user.role
                },
                needsProfileCompletion,
                message: needsProfileCompletion
                    ? 'Please complete your profile by adding phone number'
                    : 'Login successful'
            });

        } catch (err) {
            console.error('Google mobile auth error:', err);
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    testTwilio: async (req, res, next) => {
        try {

            const phoneNumber = "+919653092873";
            const message = "Hello from Tiffix!";


            const result = await sendTwilioMessage(phoneNumber, message);

            if (result) {
                httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    message: 'Twilio message sent successfully',
                    sid: result.sid
                });
            } else {
                httpError(next, new Error('Failed to send Twilio message. Check logs/credentials.'), req, 500);
            }
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },


    appleMobileAuth: async (req, res, next) => {
        try {
            const { idToken, firstName, lastName } = req.body;

            if (!idToken) {
                return httpError(next, new Error('Identity token is required'), req, 400);
            }

            let appleIdTokenClaims;
            try {
                appleIdTokenClaims = await appleSignin.verifyIdToken(idToken, {
                    audience: config.auth.apple.bundleId,
                    ignoreExpiration: true,
                });
            } catch (err) {
                console.error('Apple token verification failed:', err);
                return httpError(next, new Error('Invalid Apple token'), req, 401);
            }

            const { email, sub: appleId } = appleIdTokenClaims;

            let user = await userModel.findOne({
                $or: [
                    { emailAddress: email, isDeleted: false },
                    { appleId: appleId, isDeleted: false }
                ]
            });

            if (user) {
                if (user.isBanned) {
                    return httpError(next, new Error('Your account is suspended'), req, 401);
                }

                if (user.provider === EAuthProvider.LOCAL) {
                    user.provider = EAuthProvider.APPLE;
                    user.appleId = appleId;
                    user.accountConfirmation.status = true;
                    user.isActive = true;
                } else if (!user.appleId) {
                    user.appleId = appleId;
                }

                user.lastLogin = TimezoneUtil.now();
                await user.save();
            } else {
                if (!email) {
                    return httpError(next, new Error('Email not provided by Apple. Please try again or check your Apple ID settings.'), req, 400);
                }

                const name = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || 'Apple User');

                const userData = {
                    name,
                    emailAddress: email,
                    appleId: appleId,
                    provider: EAuthProvider.APPLE,
                    role: EUserRole.USER,
                    consent: true,
                    isActive: true,
                    isDeleted: false,
                    accountConfirmation: {
                        status: true,
                        timestamp: TimezoneUtil.now()
                    },
                    referral: {
                        userReferralCode: await userModel.generateUniqueReferralCode(),
                        referralCodeGeneratedAt: TimezoneUtil.now(),
                        canRefer: true
                    },
                    lastLogin: TimezoneUtil.now()
                };

                user = new userModel(userData);
                await user.save();

                try {
                    const userProfile = new userProfileModel({
                        userId: user._id,
                        addresses: [],
                        preferences: {}
                    });
                    await userProfile.save();
                } catch (profileError) {
                    console.warn('User profile creation failed for Apple OAuth user:', profileError.message);
                }
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
                    name: user.name,
                    userType: user.role,
                    role: user.role
                },
                needsProfileCompletion,
                message: needsProfileCompletion
                    ? 'Please complete your profile by adding phone number'
                    : 'Login successful'
            });

        } catch (err) {
            console.error('Apple mobile auth error:', err);
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};