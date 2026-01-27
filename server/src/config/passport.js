import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import userModel from '../models/user.model.js';
import userProfileModel from '../models/userProfile.model.js';
import config from './config.js';
import { EAuthProvider, EUserRole } from '../constant/application.js';
import quicker from '../util/quicker.js';

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Local Strategy
passport.use(new LocalStrategy(
    {
        usernameField: 'emailAddress',
        passwordField: 'password'
    },
    async (emailAddress, password, done) => {
        try {
            const user = await userModel.findByEmail(emailAddress);

            if (!user) {
                return done(null, false, { message: 'Invalid credentials' });
            }

            if (user.provider !== EAuthProvider.LOCAL) {
                return done(null, false, {
                    message: `Account exists with ${user.provider} provider. Please use ${user.provider} login.`
                });
            }

            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return done(null, false, { message: 'Invalid credentials' });
            }

            if (!user.isAccountConfirmed()) {
                return done(null, false, { message: 'Please verify your email address' });
            }

            if (!user.isActive) {
                return done(null, false, { message: 'Account is inactive' });
            }


            user.lastLogin = new Date();
            await user.save();

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Google Strategy
passport.use(new GoogleStrategy(
    {
        clientID: config.auth.google.clientId,
        clientSecret: config.auth.google.clientSecret,
        callbackURL: config.auth.google.callbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await userModel.findByGoogleId(profile.id);

            if (user) {
                if (user.isBanned) {
                    return done(null, false, { message: 'Your Account Is Suspended' });
                }
                if (!user.isActive) {
                    return done(null, false, { message: 'Account is inactive' });
                }
                user.lastLogin = new Date();
                await user.save();
                return done(null, user);
            }

            user = await userModel.findByEmail(profile.emails[0].value);

            if (user) {
                if (user.isBanned) {
                    return done(null, false, { message: 'Your Account Is Suspended' });
                }
                if (!user.isActive) {
                    return done(null, false, { message: 'Account is inactive' });
                }
                user.googleId = profile.id;
                user.lastLogin = new Date();
                await user.save();
                return done(null, user);
            }

            const newUser = new userModel({
                name: profile.displayName,
                emailAddress: profile.emails[0].value,
                avatar: profile.photos[0]?.value,
                googleId: profile.id,
                provider: EAuthProvider.GOOGLE,
                role: EUserRole.USER,
                isActive: true,
                consent: true,
                timezone: 'Asia/Kolkata',
                accountConfirmation: {
                    status: true,
                    otp: '000000',
                    timestamp: new Date()
                },
                referral: {
                    userReferralCode: quicker.generateReferralCode()
                },
                lastLogin: new Date()
            });

            await newUser.save();

            try {
                const newUserProfile = new userProfileModel({
                    userId: newUser._id
                });
                await newUserProfile.save();
            } catch (profileError) {
                console.warn('User profile creation failed for OAuth user:', profileError.message);
            }

            return done(null, newUser);
        } catch (error) {
            return done(error);
        }
    }
));

// Facebook Strategy
passport.use(new FacebookStrategy(
    {
        clientID: config.auth.facebook.appId,
        clientSecret: config.auth.facebook.appSecret,
        callbackURL: config.auth.facebook.callbackURL,
        profileFields: ['id', 'displayName', 'emails', 'photos']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await userModel.findOne({ facebookId: profile.id });

            if (user) {
                if (user.isBanned) {
                    return done(null, false, { message: 'Your Account Is Suspended' });
                }
                if (!user.isActive) {
                    return done(null, false, { message: 'Account is inactive' });
                }
                user.lastLogin = new Date();
                await user.save();
                return done(null, user);
            }

            const email = profile.emails?.[0]?.value;
            if (email) {
                user = await userModel.findByEmail(email);

                if (user) {
                    if (user.isBanned) {
                        return done(null, false, { message: 'Your Account Is Suspended' });
                    }
                    if (!user.isActive) {
                        return done(null, false, { message: 'Account is inactive' });
                    }
                    user.facebookId = profile.id;
                    user.lastLogin = new Date();
                    await user.save();
                    return done(null, user);
                }
            }

            const newUser = new userModel({
                name: profile.displayName,
                emailAddress: email,
                avatar: profile.photos?.[0]?.value,
                facebookId: profile.id,
                provider: EAuthProvider.FACEBOOK,
                role: EUserRole.USER,
                isActive: true,
                consent: true,
                timezone: 'Asia/Kolkata',
                accountConfirmation: {
                    status: true,
                    otp: '000000',
                    timestamp: new Date()
                },
                referral: {
                    userReferralCode: quicker.generateReferralCode()
                },
                lastLogin: new Date()
            });

            await newUser.save();

            try {
                const newUserProfile = new userProfileModel({
                    userId: newUser._id
                });
                await newUserProfile.save();
            } catch (profileError) {
                console.warn('User profile creation failed for OAuth user:', profileError.message);
            }

            return done(null, newUser);
        } catch (error) {
            return done(error);
        }
    }
));

export default passport;