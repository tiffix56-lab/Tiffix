import { Router } from 'express'
import apiController from '../controller/apiController/api.controller.js'
import authController from '../controller/authController/auth.controller.js'
import menuController from '../controller/menuController/menu.controller.js'
import subscriptionController from '../controller/subscriptionController/subscription.controller.js'
import locationZoneController from '../controller/locationZoneController/locationZone.controller.js'
import vendorProfileController from '../controller/vendorProfileController/vendorProfile.controller.js'
import userProfileController from '../controller/userProfileController/userProfile.controller.js'
import referralController from '../controller/referralController/referral.controller.js'
import promoCodeController from '../controller/promoCodeController/promoCode.controller.js'
import subscriptionPurchaseController from '../controller/subscriptionPurchaseController/subscriptionPurchase.controller.js'
import transactionController from '../controller/transactionController/transaction.controller.js'
import userAdminController from '../controller/AdminController/user.admincontroller.js'
import { uploadFiles } from '../middleware/multerHandler.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import passport from '../config/passport.js'
import { EUserRole } from '../constant/application.js'

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
router.route('/auth/location').put(authentication, authController.updateLocation)
router.route('/auth/location').get(authentication, authController.getUserLocation)

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
router.route('/user-profiles/credits').get(authentication, userProfileController.getCreditsBalance)
router.route('/user-profiles/credits/use').post(authentication, userProfileController.useCredits)


// ############### REFERRAL ROUTES ####################
router.route('/referral/validate/:referralCode').get(referralController.validateReferralCode)

// User referral routes
router.route('/referral/generate-link').get(authentication, referralController.generateReferralLink)
router.route('/referral/stats').get(authentication, referralController.getReferralStats)

// Admin referral routes
router.route('/admin/referral/analytics').get(authentication, authorization([EUserRole.ADMIN]), referralController.getReferralAnalytics)
router.route('/admin/referral/leaderboard').get(authentication, authorization([EUserRole.ADMIN]), referralController.getReferralLeaderboard)


// ############### MENU ROUTES ####################
// Public menu routes - Simplified (use query parameters for filtering)
router.route('/menus').get(authentication, menuController.getAllMenus)
router.route('/menus/:id').get(authentication, menuController.getMenuById)

// Admin menu routes
router.route('/admin/menus').post(authentication, authorization([EUserRole.ADMIN]), menuController.createMenu)
router.route('/admin/menus/:id').put(authentication, authorization([EUserRole.ADMIN]), menuController.updateMenu)
router.route('/admin/menus/:id').delete(authentication, authorization([EUserRole.ADMIN]), menuController.deleteMenu)
router.route('/admin/menus/:id/toggle-availability').patch(authentication, authorization([EUserRole.ADMIN]), menuController.toggleAvailability)
router.route('/admin/menus/:id/rating').patch(authentication, authorization([EUserRole.ADMIN]), menuController.updateRating)
router.route('/admin/menus/bulk-availability').patch(authentication, authorization([EUserRole.ADMIN]), menuController.bulkUpdateAvailability)

// ############### SUBSCRIPTION ROUTES ####################

router.route('/subscriptions').get(authentication, subscriptionController.getAllSubscriptions)
router.route('/subscriptions/:id').get(authentication, subscriptionController.getSubscriptionById)

// Admin subscription routes
router.route('/admin/subscriptions').post(authentication, authorization([EUserRole.ADMIN]), subscriptionController.createSubscription)
router.route('/admin/subscriptions/:id').put(authentication, authorization([EUserRole.ADMIN]), subscriptionController.updateSubscription)
router.route('/admin/subscriptions/:id').delete(authentication, authorization([EUserRole.ADMIN]), subscriptionController.deleteSubscription)
router.route('/admin/subscriptions/:id/toggle-status').patch(authentication, authorization([EUserRole.ADMIN]), subscriptionController.toggleSubscriptionStatus)


// ############### LOCATION ZONE ROUTES ####################
router.route('/zones').get(authentication, authorization([EUserRole.ADMIN]), locationZoneController.getAllLocationZones)
router.route('/zones/:id').get(authentication, authorization([EUserRole.ADMIN]), locationZoneController.getLocationZoneById)
router.route('/zones/check-service/:pincode').get(authentication, authorization([EUserRole.ADMIN]), locationZoneController.checkServiceAvailability)
router.route('/zones/:zoneId/delivery-fee').get(authentication, authorization([EUserRole.ADMIN]), locationZoneController.calculateDeliveryFee)


router.route('/admin/zones').post(authentication, authorization([EUserRole.ADMIN]), locationZoneController.createLocationZone)
router.route('/admin/zones/:id').put(authentication, authorization([EUserRole.ADMIN]), locationZoneController.updateLocationZone)
router.route('/admin/zones/:id').delete(authentication, authorization([EUserRole.ADMIN]), locationZoneController.deleteLocationZone)
router.route('/admin/zones/:id/toggle-status').patch(authentication, authorization([EUserRole.ADMIN]), locationZoneController.toggleZoneStatus)

// ############### VENDOR PROFILE ROUTES ####################

// Vendor self-management routes
router.route('/vendors/me').get(authentication, authorization([EUserRole.VENDOR]), vendorProfileController.me)
router.route('/vendors/me/profile').put(authentication, authorization([EUserRole.VENDOR]), vendorProfileController.updateMyProfile)
router.route('/vendors/me/address').put(authentication, authorization([EUserRole.VENDOR]), vendorProfileController.updateMyAddress)
router.route('/vendors/:id/toggle-availability').patch(authentication, authorization([EUserRole.VENDOR, EUserRole.ADMIN]), vendorProfileController.toggleAvailability)
router.route('/vendors/:id/capacity').patch(authentication, authorization([EUserRole.VENDOR, EUserRole.ADMIN]), vendorProfileController.updateCapacity)
router.route('/vendors/:id/rating').patch(authentication, authorization([EUserRole.VENDOR, EUserRole.ADMIN]), vendorProfileController.updateRating)

// Admin vendor routes
router.route('/admin/vendors').get(authentication, authorization([EUserRole.ADMIN]), vendorProfileController.getAllVendorProfiles)
router.route('/admin/vendors').post(authentication, authorization([EUserRole.ADMIN]), vendorProfileController.createVendorWithUser)
router.route('/admin/vendors/:id').put(authentication, authorization([EUserRole.ADMIN]), vendorProfileController.updateVendorProfile)
router.route('/admin/vendors/:id').delete(authentication, authorization([EUserRole.ADMIN]), vendorProfileController.deleteVendorProfile)
router.route('/admin/vendors/:id/address').put(authentication, authorization([EUserRole.ADMIN]), vendorProfileController.updateVendorAddress)
router.route('/admin/vendors/:id/verify').patch(authentication, authorization([EUserRole.ADMIN]), vendorProfileController.verifyVendor)
router.route('/admin/vendors/:id/reset-capacity').patch(authentication, authorization([EUserRole.ADMIN]), vendorProfileController.resetDailyCapacity)

// ############### PROMO CODE ROUTES ####################
// Public promo code routes
router.route('/promo-codes/validate').post(authentication, promoCodeController.validatePromoCode)

// Admin promo code routes
router.route('/admin/promo-codes').get(authentication, authorization([EUserRole.ADMIN]), promoCodeController.getAllPromoCodes)
router.route('/admin/promo-codes').post(authentication, authorization([EUserRole.ADMIN]), promoCodeController.createPromoCode)
router.route('/admin/promo-codes/expiring').get(authentication, authorization([EUserRole.ADMIN]), promoCodeController.getExpiringPromoCodes)
router.route('/admin/promo-codes/bulk-create').post(authentication, authorization([EUserRole.ADMIN]), promoCodeController.bulkCreatePromoCodes)
router.route('/admin/promo-codes/:id').get(authentication, authorization([EUserRole.ADMIN]), promoCodeController.getPromoCodeById)
router.route('/admin/promo-codes/:id').put(authentication, authorization([EUserRole.ADMIN]), promoCodeController.updatePromoCode)
router.route('/admin/promo-codes/:id').delete(authentication, authorization([EUserRole.ADMIN]), promoCodeController.deletePromoCode)
router.route('/admin/promo-codes/:id/toggle-status').patch(authentication, authorization([EUserRole.ADMIN]), promoCodeController.togglePromoCodeStatus)
router.route('/admin/promo-codes/:id/stats').get(authentication, authorization([EUserRole.ADMIN]), promoCodeController.getPromoCodeStats)

// ############### SUBSCRIPTION PURCHASE ROUTES ####################
// User subscription purchase routes
router.route('/purchase/initiate').post(authentication, subscriptionPurchaseController.initiatePurchase)
router.route('/purchase/verify').post(authentication, subscriptionPurchaseController.verifyPayment)
router.route('/purchase/webhook').post(subscriptionPurchaseController.processWebhook) // No auth for webhook

// User subscription management
router.route('/user-subscriptions').get(authentication, subscriptionPurchaseController.getUserSubscriptions)
router.route('/user-subscriptions/active').get(authentication, subscriptionPurchaseController.getActiveSubscriptions)
router.route('/user-subscriptions/:id').get(authentication, subscriptionPurchaseController.getSubscriptionById)

// Transaction status
router.route('/transactions/:transactionId/status').get(authentication, subscriptionPurchaseController.getTransactionStatus)

// ############### TRANSACTION & ANALYTICS ROUTES ####################
// User transaction routes
router.route('/my-transactions').get(authentication, transactionController.getUserTransactions)

// Admin transaction routes
router.route('/admin/transactions').get(authentication, authorization([EUserRole.ADMIN]), transactionController.getAllTransactions)
router.route('/admin/transactions/failed').get(authentication, authorization([EUserRole.ADMIN]), transactionController.getFailedTransactions)
router.route('/admin/transactions/stats').get(authentication, authorization([EUserRole.ADMIN]), transactionController.getTransactionStats)
router.route('/admin/transactions/export').get(authentication, authorization([EUserRole.ADMIN]), transactionController.exportTransactions)
router.route('/admin/transactions/:id').get(authentication, authorization([EUserRole.ADMIN]), transactionController.getTransactionById)
router.route('/admin/transactions/:id/refund').post(authentication, authorization([EUserRole.ADMIN]), transactionController.processRefund)

// ############### ADMIN USER MANAGEMENT ROUTES ####################
// Admin user overview and statistics
router.route('/admin/users/overview').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.getUserOverview)
router.route('/admin/users/activity-stats').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.getUserActivityStats)

// Admin user management
router.route('/admin/users').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.getAllUsers)
router.route('/admin/users/:id').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.getUserById)
router.route('/admin/users/:id').delete(authentication, authorization([EUserRole.ADMIN]), userAdminController.deleteUser)
router.route('/admin/users/:id/ban').post(authentication, authorization([EUserRole.ADMIN]), userAdminController.banUser)
router.route('/admin/users/:id/unban').post(authentication, authorization([EUserRole.ADMIN]), userAdminController.unbanUser)
router.route('/admin/users/:id/toggle-status').put(authentication, authorization([EUserRole.ADMIN]), userAdminController.toggleUserStatus)

export default router