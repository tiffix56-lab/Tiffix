import { Router } from 'express'
import apiController from '../controller/apiController/api.controller.js'
import authController from '../controller/authController/auth.controller.js'
import menuController from '../controller/menuController/menu.controller.js'
import subscriptionController from '../controller/subscriptionController/subscription.controller.js'
import locationZoneController from '../controller/locationZoneController/locationZone.controller.js'
import vendorProfileController from '../controller/vendorProfileController/vendorProfile.controller.js'
import userProfileController from '../controller/userProfileController/userProfile.controller.js'
import promoCodeController from '../controller/promoCodeController/promoCode.controller.js'
import subscriptionPurchaseController from '../controller/subscriptionPurchaseController/subscriptionPurchase.controller.js'
import adminSubscriptionPurchaseController from '../controller/subscriptionPurchaseController/admin-subscriptionPurchase.controller.js'
import vendorCustomerManagementController from '../controller/subscriptionPurchaseController/customer-management-vendor.controller.js'
import transactionController from '../controller/transactionController/transaction.controller.js'
import userAdminController from '../controller/AdminController/user.admincontroller.js'
import vendorAssignmentController from '../controller/vendorAssignmentController/vendorAssignment.controller.js'
import dailyMealController from '../controller/orderController/dailyMeal.controller.js'
import orderController from '../controller/orderController/order.controller.js'
import reviewController from '../controller/reviewController/review.controller.js'
import adminController from '../controller/AdminController/admin.controller.js'
import referralController from '../controller/referralController/referral.controller.js'
import mapsController from '../controller/mapsController/maps.controller.js'
import complainController from '../controller/complainController/complain.controller.js'
import { uploadFiles } from '../middleware/multerHandler.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import passport from '../config/passport.js'
import { EUserRole } from '../constant/application.js'
import contactController from '../controller/contactController/contact.controller.js'
import notificationController from '../controller/notificationController/notification.controller.js'

const router = Router()

// ############### PUBLIC ROUTES ####################
router.route('/self').get(apiController.self)
router.route('/health').get(apiController.health)
router.route('/upload-file').post(uploadFiles, apiController.uploadFile);

// ############### AUTH ROUTES ####################
router.route('/auth/self').get(authController.self)
router.route('/auth/login').post(authController.login)
router.route('/auth/register').post(authController.register)
router.route('/auth/verify-email').post(authController.verifyAccount)
router.route('/auth/resend-otp').post(authController.resendVerificationOTP)
router.route('/auth/logout').post(authentication, authController.logout)
router.route('/auth/change-password').post(authentication, authController.changePassword)
router.route('/auth/forgot-password').post(authController.forgotPassword)
router.route('/auth/reset-password').post(authController.resetPassword)
router.route('/auth/me').get(authentication, authController.me)
router.route('/auth/init-profile-fill').post(authentication, authController.updatePhoneNumber)
router.route('/auth/location').put(authentication, authController.updateLocation)
router.route('/auth/location').get(authentication, authController.getUserLocation)
router.route('/auth/delete-account').post(authentication, authController.deleteAccount);


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

// Mobile OAuth routes
router.route('/auth/google/mobile').post(authController.googleMobileAuth)
router.route('/auth/apple/mobile').post(authController.appleMobileAuth)


// ############### USER PROFILE ROUTES ####################
// User profile routes
router.route('/user-profiles').get(authentication, userProfileController.getUserProfile)
router.route('/user-profiles').put(authentication, userProfileController.updateUserProfile)
router.route('/users/fcm-token').post(authentication, userProfileController.addFCMToken);

// Address management
router.route('/user-profiles/addresses').post(authentication, userProfileController.addAddress)
router.route('/user-profiles/addresses/:addressIndex').put(authentication, userProfileController.updateAddress)
router.route('/user-profiles/addresses/:addressIndex').delete(authentication, userProfileController.deleteAddress)
router.route('/user-profiles/addresses').get(authentication, userProfileController.getAllAddresses)

// Preferences and credits
router.route('/user-profiles/preferences').patch(authentication, userProfileController.updatePreferences)


// ############### REFERRAL ROUTES ####################
// Admin referral management - view users who used referral codes
router.route('/referral/stats').get(authentication, referralController.getStats)
router.route('/admin/referrals/used-users').get(authentication, authorization([EUserRole.ADMIN]), referralController.getReferralUsedUsers)
router.route('/admin/referrals/user/:userId').get(authentication, authorization([EUserRole.ADMIN]), referralController.getReferralDetailsById)

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
// Public subscription routes - for users to view available plans
router.route('/subscriptions').get(authentication, subscriptionController.getActiveSubscriptions)
router.route('/subscriptions/:subscriptionId').get(authentication, subscriptionController.getSubscriptionForUser)

// Admin subscription routes - for managing subscription plans
router.route('/admin/subscriptions').get(authentication, authorization([EUserRole.ADMIN]), subscriptionController.getAllSubscriptions)
router.route('/admin/subscriptions').post(authentication, authorization([EUserRole.ADMIN]), subscriptionController.createSubscription)
router.route('/admin/subscriptions/:subscriptionId').get(authentication, authorization([EUserRole.ADMIN]), subscriptionController.getSubscriptionById)
router.route('/admin/subscriptions/:subscriptionId').put(authentication, authorization([EUserRole.ADMIN]), subscriptionController.updateSubscription)
router.route('/admin/subscriptions/:subscriptionId').delete(authentication, authorization([EUserRole.ADMIN]), subscriptionController.deleteSubscription)
router.route('/admin/subscriptions/:subscriptionId/toggle-status').patch(authentication, authorization([EUserRole.ADMIN]), subscriptionController.toggleSubscriptionStatus)
router.route('/admin/subscriptions/stats').get(authentication, authorization([EUserRole.ADMIN]), subscriptionController.getSubscriptionStats)

// ############### LOCATION ZONE ROUTES ####################
router.route('/zones').get(authentication, authorization([EUserRole.ADMIN]), locationZoneController.getAllLocationZones)
router.route('/zones/:id').get(authentication, authorization([EUserRole.ADMIN]), locationZoneController.getLocationZoneById)
router.route('/zones/check-service/:pincode').get(authentication, authorization([EUserRole.ADMIN]), locationZoneController.checkServiceAvailability)


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
router.route('/subscription-purchase/initiate').post(authentication, subscriptionPurchaseController.initiatePurchase)
router.route('/subscription-purchase/verify-payment').post(authentication, subscriptionPurchaseController.verifyPayment)
router.route('/subscription-purchase/check-payment-status/:orderId').get(authentication, subscriptionPurchaseController.checkPaymentStatus)
router.route('/subscription-purchase/subscription-status/:userSubscriptionId').get(authentication, subscriptionPurchaseController.getSubscriptionStatus)

// Razorpay webhook route (for future use if webhooks are enabled)
router.route('/payments/razorpay/webhook').post(subscriptionPurchaseController.razorpayWebhook)

// User subscription management
router.route('/my-subscriptions').get(authentication, subscriptionPurchaseController.getUserSubscriptions)
router.route('/my-subscriptions/:subscriptionId').get(authentication, subscriptionPurchaseController.getSubscriptionById)
router.route('/my-subscriptions/:subscriptionId/cancel').post(authentication, subscriptionPurchaseController.cancelSubscription)
router.route('/my-subscriptions/:subscriptionId/request-vendor-switch').post(authentication, subscriptionPurchaseController.requestVendorSwitch)

// ############### ADMIN SUBSCRIPTION PURCHASE ROUTES ####################
// Admin subscription purchase management with comprehensive filters
router.route('/admin/subscription-purchases').get(authentication, authorization([EUserRole.ADMIN]), adminSubscriptionPurchaseController.getAllPurchaseSubscriptions)
router.route('/admin/subscription-purchases/stats').get(authentication, authorization([EUserRole.ADMIN]), adminSubscriptionPurchaseController.getPurchaseSubscriptionStats)
router.route('/admin/subscription-purchases/:subscriptionId').get(authentication, authorization([EUserRole.ADMIN]), adminSubscriptionPurchaseController.getPurchaseSubscriptionById)
router.route('/admin/subscription-purchases/:transactionId/verify-payment').post(authentication, authorization([EUserRole.ADMIN]), adminSubscriptionPurchaseController.verifyPaymentStatus)

// ############### VENDOR CUSTOMER MANAGEMENT ROUTES ####################
// Vendor customer management - view and manage assigned customers
router.route('/vendor/customers').get(authentication, authorization([EUserRole.VENDOR]), vendorCustomerManagementController.getAllMyCustomers)
router.route('/vendor/customers/analytics').get(authentication, authorization([EUserRole.VENDOR]), vendorCustomerManagementController.getCustomerAnalytics)
router.route('/vendor/customers/:subscriptionId').get(authentication, authorization([EUserRole.VENDOR]), vendorCustomerManagementController.getCustomerSubscriptionById)

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

// ############### VENDOR ASSIGNMENT ROUTES ####################
// Admin vendor assignment management
router.route('/admin/vendor-assignments').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getAllRequests)
router.route('/admin/vendor-assignments/pending').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getAllPendingRequests)
router.route('/admin/vendor-assignments/initial-assignments').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getPendingInitialAssignments)
router.route('/admin/vendor-assignments/vendor-switches').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getPendingVendorSwitches)
router.route('/admin/vendor-assignments/urgent').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getUrgentRequests)
router.route('/admin/vendor-assignments/export').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.exportAssignmentsCSV)
router.route('/admin/vendor-assignments/stats').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getAssignmentStats)

// Individual request management
router.route('/admin/vendor-assignments/:requestId').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getRequestDetails)
router.route('/admin/vendor-assignments/:requestId/available-vendors').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getAvailableVendors)
router.route('/admin/vendor-assignments/:requestId/assign').post(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.assignVendor)
router.route('/admin/vendor-assignments/:requestId/reject').post(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.rejectRequest)
router.route('/admin/vendor-assignments/:requestId/priority').patch(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.updatePriority)

// Zone-based requests
router.route('/admin/vendor-assignments/zone/:zoneId').get(authentication, authorization([EUserRole.ADMIN]), vendorAssignmentController.getRequestsByZone)

// ############### ADMIN USER MANAGEMENT ROUTES ####################
// Admin user overview and statistics
router.route('/admin/users/overview').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.getUserOverview)
router.route('/admin/users/activity-stats').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.getUserActivityStats)

// Admin user management
router.route('/admin/users').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.getAllUsers)
router.route('/admin/users/export').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.exportUsers)
router.route('/admin/users/:id').get(authentication, authorization([EUserRole.ADMIN]), userAdminController.getUserById)
router.route('/admin/users/:id').delete(authentication, authorization([EUserRole.ADMIN]), userAdminController.deleteUser)
router.route('/admin/users/:id/ban').post(authentication, authorization([EUserRole.ADMIN]), userAdminController.banUser)
router.route('/admin/users/:id/unban').post(authentication, authorization([EUserRole.ADMIN]), userAdminController.unbanUser)
router.route('/admin/users/:id/toggle-status').put(authentication, authorization([EUserRole.ADMIN]), userAdminController.toggleUserStatus)

// ############### ORDER MANAGEMENT ROUTES ####################

// ############### DAILY MEAL MANAGEMENT ROUTES (ADMIN ONLY) ####################
// Admin daily meal management - for setting daily menus for subscriptions
router.route('/admin/daily-meals/set-today').post(authentication, authorization([EUserRole.ADMIN]), dailyMealController.setTodayMeal)
router.route('/admin/daily-meals/refresh').post(authentication, authorization([EUserRole.ADMIN]), dailyMealController.refreshTodayMealOrders)
router.route('/admin/daily-meals').get(authentication, authorization([EUserRole.ADMIN]), dailyMealController.getMeals)
router.route('/admin/daily-meals/subscription/:subscriptionId/menus').get(authentication, authorization([EUserRole.ADMIN]), dailyMealController.getAvailableMenusForSubscription)

// Order creation logs and management
router.route('/admin/order-creation-logs').get(authentication, authorization([EUserRole.ADMIN]), dailyMealController.getOrderCreationLogs)
router.route('/admin/order-creation-logs/:logId/retry/:failedOrderIndex').post(authentication, authorization([EUserRole.ADMIN]), dailyMealController.retryFailedOrder)
router.route('/admin/orders/manual-create').post(authentication, authorization([EUserRole.ADMIN]), dailyMealController.createManualOrder)

// ############### ORDER ROUTES ####################

// User order management (role checked in controller)
router.route('/my-orders').get(authentication, orderController.getUserOrders)
router.route('/orders/:orderId/skip').post(authentication, orderController.skipOrder)
router.route('/orders/:orderId/cancel').post(authentication, orderController.cancelOrder)

// Vendor order management (role checked in controller)
router.route('/vendor/orders').get(authentication, authorization([EUserRole.VENDOR]), orderController.getVendorOrders)
router.route('/orders/:orderId/status').patch(authentication, orderController.updateOrderStatus)
router.route('/orders/bulk-status').patch(authentication, orderController.bulkUpdateOrderStatus)

// Admin order management (role checked in controller)
router.route('/admin/orders').get(authentication, authorization([EUserRole.ADMIN]), orderController.getAdminOrders)
router.route('/admin/orders/:orderId/confirm-delivery').post(authentication, orderController.confirmDelivery)
router.route('/admin/orders/bulk-confirm-delivery').post(authentication, authorization([EUserRole.ADMIN]), orderController.bulkConfirmDelivery)

// Common route (role checked in controller)
router.route('/orders/:orderId').get(authentication, orderController.getOrderById)

// ############### REVIEW ROUTES ####################
// User review routes
router.route('/reviews').post(authentication, authorization([EUserRole.USER]), reviewController.createReview)
router.route('/my-reviews').get(authentication, authorization([EUserRole.USER]), reviewController.getUserReviews)
router.route('/reviews/:reviewId').patch(authentication, authorization([EUserRole.USER]), reviewController.updateReview)
router.route('/reviews/:reviewId').delete(authentication, authorization([EUserRole.USER]), reviewController.deleteReview)

// Vendor review routes
router.route('/vendor/reviews').get(authentication, authorization([EUserRole.VENDOR]), reviewController.getVendorReviews)

// Admin review routes
router.route('/admin/reviews').get(authentication, authorization([EUserRole.ADMIN]), reviewController.getAllReviews)
router.route('/admin/reviews/:reviewId/moderate').patch(authentication, authorization([EUserRole.ADMIN]), reviewController.moderateReview)
router.route('/admin/reviews/stats').get(authentication, authorization([EUserRole.ADMIN]), reviewController.getReviewStats)

// Public review routes (no authentication required)
router.route('/public/subscriptions/:subscriptionId/reviews').get(reviewController.getSubscriptionReviews)
router.route('/public/vendors/:vendorId/reviews').get(reviewController.getPublicVendorReviews)
router.route('/public/orders/:orderId/review').get(reviewController.getOrderReview)

// ############### ADMIN DASHBOARD & ANALYTICS ROUTES ####################
// Comprehensive dashboard statistics and analytics for admin panel
router.route('/admin/dashboard/stats').get(authentication, authorization([EUserRole.ADMIN]), adminController.getDashboardStats)
router.route('/admin/analytics/users').get(authentication, authorization([EUserRole.ADMIN]), adminController.getUserAnalytics)
router.route('/admin/analytics/orders').get(authentication, authorization([EUserRole.ADMIN]), adminController.getOrderAnalytics)
router.route('/admin/analytics/revenue').get(authentication, authorization([EUserRole.ADMIN]), adminController.getRevenueAnalytics)
router.route('/admin/analytics/vendors').get(authentication, authorization([EUserRole.ADMIN]), adminController.getVendorAnalytics)
router.route('/admin/analytics/zones').get(authentication, authorization([EUserRole.ADMIN]), adminController.getZoneAnalytics)

// ############### TEST ROUTES ####################
router.route('/admin/test/twilio').post(authController.testTwilio)

// ############### MAPS & LOCATION SERVICES ROUTES ####################
// Ola Maps API proxy routes - authenticated to prevent abuse
router.route('/maps/autocomplete').post(authentication, mapsController.autocomplete)
router.route('/maps/reverse-geocode').post(authentication, mapsController.reverseGeocode)
router.route('/maps/place-details').post(authentication, mapsController.placeDetails)
router.route('/maps/session-token').get(authentication, mapsController.generateSessionToken)
router.route('/maps/test-connection').get(authentication, authorization([EUserRole.ADMIN]), mapsController.testConnection)

// ############### COMPLAIN ROUTES ####################
// Public/User complain routes
router.route('/complains').post(complainController.createComplain)
router.route('/complains/:complainId').get(complainController.getComplainById)
router.route('/complains/phone').get(complainController.getComplainsByPhoneNumber)

// Admin complain routes
router.route('/admin/complains').get(authentication, authorization([EUserRole.ADMIN]), complainController.getAllComplains)
router.route('/admin/complains/:complainId').put(authentication, authorization([EUserRole.ADMIN]), complainController.updateComplain)
router.route('/admin/complains/:complainId').delete(authentication, authorization([EUserRole.ADMIN]), complainController.deleteComplain)



// ############### CONTACT ROUTES ####################
// Public/User contact routes
router.route('/contacts').post(contactController.createContact)

// Admin contact routes
router.route('/admin/contacts').get(authentication, authorization([EUserRole.ADMIN]), contactController.getAllContacts)
router.route('/admin/contacts/:contactId').put(authentication, authorization([EUserRole.ADMIN]), contactController.updateContact)
router.route('/admin/contacts/:contactId').delete(authentication, authorization([EUserRole.ADMIN]), contactController.deleteContact)

// ############### NOTIFICATION ROUTES ####################
router.route('/admin/notifications/broadcast').post(authentication, authorization([EUserRole.ADMIN]), notificationController.sendBroadcastNotification)

export default router