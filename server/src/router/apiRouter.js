import { Router } from 'express'
import apiController from '../controller/apiController/api.controller.js'
import authController from '../controller/authController/auth.controller.js'
import menuController from '../controller/menuController/menu.controller.js'
import subscriptionController from '../controller/subscriptionController/subscription.controller.js'
import locationZoneController from '../controller/locationZoneController/locationZone.controller.js'
import vendorProfileController from '../controller/vendorProfileController/vendorProfile.controller.js'
import userProfileController from '../controller/userProfileController/userProfile.controller.js'
import referralController from '../controller/referralController/referral.controller.js'
import { uploadFiles } from '../middleware/multerHandler.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import passport from '../config/passport.js'

const router = Router()

// ############### PUBLIC ROUTES ####################
router.route('/self').get(apiController.self)
router.route('/health').get(apiController.health)
router.route('/upload-file').post(uploadFiles, apiController.uploadFile);

// ############### AUTH ROUTES ####################
router.route('/auth/self').get(authController.self)
router.route('/auth/login').post(authController.login)
router.route('/auth/register').post(authController.register)
router.route('/auth/verify-email').post(authController.verifyEmail)
router.route('/auth/resend-otp').post(authController.resendVerificationOTP)
router.route('/auth/logout').post(authentication, authController.logout)
router.route('/auth/change-password').post(authentication, authController.changePassword)
router.route('/auth/forgot-password').post(authController.forgotPassword)
router.route('/auth/reset-password').post(authController.resetPassword)
router.route('/auth/me').get(authentication, authController.me)
router.route('/auth/init-profile-fill').post(authentication, authController.updatePhoneNumber)

// OAuth routes
router.route('/auth/google').get(passport.authenticate('google', { scope: ['profile', 'email'] }))
router.route('/auth/google/callback').get(
    passport.authenticate('google', { failureRedirect: '/auth/failure' }),
    authController.oauthSuccess
)
router.route('/auth/facebook').get(passport.authenticate('facebook', { scope: ['email'] }))
router.route('/auth/facebook/callback').get(
    passport.authenticate('facebook', { failureRedirect: '/auth/failure' }),
    authController.oauthSuccess
)
router.route('/auth/failure').get(authController.oauthFailure)


// ############### USER PROFILE ROUTES ####################
// User profile routes
router.route('/user-profiles').get(authentication, userProfileController.getUserProfile)
router.route('/user-profiles').put(authentication, userProfileController.updateUserProfile)

// Address management
router.route('/user-profiles/addresses').post(authentication, userProfileController.addAddress)
router.route('/user-profiles/addresses/:addressIndex').put(authentication, userProfileController.updateAddress)
router.route('/user-profiles/addresses/:addressIndex').delete(authentication, userProfileController.deleteAddress)
router.route('/user-profiles/addresses').get(authentication, userProfileController.getAllAddresses)

// Preferences and credits
router.route('/user-profiles/preferences').patch(authentication, userProfileController.updatePreferences)



// ############### MENU ROUTES ####################
// Public menu routes
router.route('/menus').get(menuController.getAllMenus)
router.route('/menus/available').get(menuController.getAvailableMenus)
router.route('/menus/search').get(menuController.searchMenus)
router.route('/menus/category/:category').get(menuController.getMenusByCategory)
router.route('/menus/cuisine/:cuisine').get(menuController.getMenusByCuisine)
router.route('/menus/:id').get(menuController.getMenuById)

// Admin menu routes
router.route('/admin/menus').post(authentication, authorization(['ADMIN']), menuController.createMenu)
router.route('/admin/menus/:id').put(authentication, authorization(['ADMIN']), menuController.updateMenu)
router.route('/admin/menus/:id').delete(authentication, authorization(['ADMIN']), menuController.deleteMenu)
router.route('/admin/menus/:id/toggle-availability').patch(authentication, authorization(['ADMIN']), menuController.toggleAvailability)
router.route('/admin/menus/:id/rating').patch(authentication, authorization(['ADMIN']), menuController.updateRating)

// ############### SUBSCRIPTION ROUTES ####################

router.route('/subscriptions').get(subscriptionController.getAllSubscriptions)
router.route('/subscriptions/:id').get(subscriptionController.getSubscriptionById)
router.route('/subscriptions/:id/validate').get(subscriptionController.validateSubscription)

// Legacy routes (deprecated - use query params instead)
router.route('/subscriptions/active').get(subscriptionController.getActiveSubscriptions)
router.route('/subscriptions/category/:category').get(subscriptionController.getSubscriptionsByCategory)
router.route('/subscriptions/price-range').get(subscriptionController.getSubscriptionsByPriceRange)

// User subscription routes
router.route('/subscriptions/:id/purchase').post(authentication, subscriptionController.purchaseSubscription)

// Admin subscription routes
router.route('/admin/subscriptions').post(authentication, authorization(['ADMIN']), subscriptionController.createSubscription)
router.route('/admin/subscriptions/:id').put(authentication, authorization(['ADMIN']), subscriptionController.updateSubscription)
router.route('/admin/subscriptions/:id').delete(authentication, authorization(['ADMIN']), subscriptionController.deleteSubscription)
router.route('/admin/subscriptions/:id/toggle-status').patch(authentication, authorization(['ADMIN']), subscriptionController.toggleSubscriptionStatus)
router.route('/admin/subscriptions/stats').get(authentication, authorization(['ADMIN']), subscriptionController.getSubscriptionStats)

// ############### LOCATION ZONE ROUTES ####################
// Public location zone routes (consolidated - use query params for filtering)

router.route('/zones').get(locationZoneController.getAllLocationZones)
router.route('/zones/:id').get(locationZoneController.getLocationZoneById)
router.route('/zones/check-service/:pincode').get(locationZoneController.checkServiceAvailability)
router.route('/zones/:zoneId/delivery-fee').get(locationZoneController.calculateDeliveryFee)

// Admin location zone routes
router.route('/admin/zones').post(authentication, authorization(['ADMIN']), locationZoneController.createLocationZone)
router.route('/admin/zones/:id').put(authentication, authorization(['ADMIN']), locationZoneController.updateLocationZone)
router.route('/admin/zones/:id').delete(authentication, authorization(['ADMIN']), locationZoneController.deleteLocationZone)
router.route('/admin/zones/:id/toggle-status').patch(authentication, authorization(['ADMIN']), locationZoneController.toggleZoneStatus)
router.route('/admin/zones/stats').get(authentication, authorization(['ADMIN']), locationZoneController.getZoneStats)

// ############### VENDOR PROFILE ROUTES ####################
// Public vendor routes (consolidated - use query params for filtering)
router.route('/vendors').get(vendorProfileController.getAllVendorProfiles)
router.route('/vendors/:id').get(vendorProfileController.getVendorProfileById)
router.route('/vendors/user/:userId').get(vendorProfileController.getVendorProfileByUserId)

// Vendor routes
router.route('/vendors/:id/toggle-availability').patch(authentication, authorization(['VENDOR', 'ADMIN']), vendorProfileController.toggleAvailability)
router.route('/vendors/:id/capacity').patch(authentication, authorization(['VENDOR', 'ADMIN']), vendorProfileController.updateCapacity)
router.route('/vendors/:id/rating').patch(authentication, authorization(['VENDOR', 'ADMIN']), vendorProfileController.updateRating)

// Admin vendor routes
router.route('/admin/vendors').post(authentication, authorization(['ADMIN']), vendorProfileController.createVendorProfile)
router.route('/admin/vendors/:id').put(authentication, authorization(['ADMIN']), vendorProfileController.updateVendorProfile)
router.route('/admin/vendors/:id').delete(authentication, authorization(['ADMIN']), vendorProfileController.deleteVendorProfile)
router.route('/admin/vendors/:id/verify').patch(authentication, authorization(['ADMIN']), vendorProfileController.verifyVendor)
router.route('/admin/vendors/:id/reset-capacity').patch(authentication, authorization(['ADMIN']), vendorProfileController.resetDailyCapacity)
router.route('/admin/vendors/stats').get(authentication, authorization(['ADMIN']), vendorProfileController.getVendorStats)


// ############### REFERRAL ROUTES ####################
// Public referral routes
router.route('/referral/validate/:referralCode').get(referralController.validateReferralCode)
router.route('/referral/leaderboard').get(referralController.getReferralLeaderboard)

// User referral routes
router.route('/referral/apply').post(authentication, referralController.applyReferralCode)
router.route('/referral/stats').get(authentication, referralController.getReferralStats)
router.route('/referral/generate-link').get(authentication, referralController.generateReferralLink)
router.route('/referral/use-credits').post(authentication, referralController.useReferralCredits)

// Admin referral routes
router.route('/admin/referral/analytics').get(authentication, authorization(['ADMIN']), referralController.getReferralAnalytics)

// ############### PUBLIC ROUTES END ####################

export default router