
import { servicesAxiosInstance } from "./config"


// AUTHENTICATION

export const signInApi = async (body) => {
    const response = await servicesAxiosInstance.post('/auth/login', body);
    return response.data;
}


// MENU

export const createMenuApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/menus', body);
    return response.data;
}

export const updateMenuApi = async (menuId, body) => {
    const response = await servicesAxiosInstance.put(`/admin/menus/${menuId}`, body);
    return response.data;
}

export const deleteMenuApi = async (menuId) => {
    const response = await servicesAxiosInstance.delete(`/admin/menus/${menuId}`);
    return response.data;
}

export const toggleMenuAvailabilityApi = async (menuId) => {
    const response = await servicesAxiosInstance.patch(`/admin/menus/${menuId}/toggle-availability`);
    return response.data;
}

export const updateMenuRatingApi = async (menuId, rating) => {
    const response = await servicesAxiosInstance.patch(`/admin/menus/${menuId}/rating`, { rating });
    return response.data;
}

export const bulkUpdateMenuAvailabilityApi = async (menuIds, isAvailable) => {
    const response = await servicesAxiosInstance.patch('/admin/menus/bulk-availability', { menuIds, isAvailable });
    return response.data;
}

export const getMenusApi = async (params) => {
    const response = await servicesAxiosInstance.get('/menus', {
        params
    });
    return response.data;
}

export const getMenuByIdApi = async (menuId) => {
    const response = await servicesAxiosInstance.get(`/menus/${menuId}`);
    return response.data;
}


// LOCATION ZONES

export const createZoneApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/zones', body);
    return response.data;
}

export const getZonesApi = async (params) => {
    const response = await servicesAxiosInstance.get('/zones', {
        params
    });
    return response.data;
}

export const getZoneByIdApi = async (zoneId) => {
    const response = await servicesAxiosInstance.get(`/zones/${zoneId}`);
    return response.data;
}

export const updateZoneApi = async (zoneId, body) => {
    const response = await servicesAxiosInstance.put(`/admin/zones/${zoneId}`, body);
    return response.data;
}

export const deleteZoneApi = async (zoneId) => {
    const response = await servicesAxiosInstance.delete(`/admin/zones/${zoneId}`);
    return response.data;
}

export const toggleZoneStatusApi = async (zoneId) => {
    const response = await servicesAxiosInstance.patch(`/admin/zones/${zoneId}/toggle-status`);
    return response.data;
}

export const checkServiceByPincodeApi = async (pincode, vendorType) => {
    const response = await servicesAxiosInstance.get(`/zones/check-service/${pincode}`, {
        params: { vendorType }
    });
    return response.data;
}

export const calculateDeliveryFeeApi = async (zoneId, distance, orderValue) => {
    const response = await servicesAxiosInstance.get(`/zones/${zoneId}/delivery-fee`, {
        params: { distance, orderValue }
    });
    return response.data;
}


// SUBSCRIPTION

export const createSubscriptionApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/subscriptions', body);
    return response.data;
}

export const getSubscriptionsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/subscriptions', {
        params
    });
    return response.data;
}

export const getSubscriptionByIdApi = async (subscriptionId) => {
    const response = await servicesAxiosInstance.get(`/admin/subscriptions/${subscriptionId}`);
    return response.data;
}

export const updateSubscriptionApi = async (subscriptionId, body) => {
    const response = await servicesAxiosInstance.put(`/admin/subscriptions/${subscriptionId}`, body);
    return response.data;
}

export const deleteSubscriptionApi = async (subscriptionId) => {
    const response = await servicesAxiosInstance.delete(`/admin/subscriptions/${subscriptionId}`);
    return response.data;
}

export const toggleSubscriptionStatusApi = async (subscriptionId) => {
    const response = await servicesAxiosInstance.patch(`/admin/subscriptions/${subscriptionId}/toggle-status`);
    return response.data;
}

export const getSubscriptionStatsApi = async () => {
    const response = await servicesAxiosInstance.get('/admin/subscriptions/stats');
    return response.data;
}


// VENDOR

export const getVendorsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/vendors', {
        params
    });
    return response.data;
}

export const createVendorApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/vendors', body);
    return response.data;
}

export const updateVendorApi = async (vendorId, body) => {
    const response = await servicesAxiosInstance.put(`/admin/vendors/${vendorId}`, body);
    return response.data;
}

export const deleteVendorApi = async (vendorId) => {
    const response = await servicesAxiosInstance.delete(`/admin/vendors/${vendorId}`);
    return response.data;
}

export const verifyVendorApi = async (vendorId, isVerified) => {
    const response = await servicesAxiosInstance.patch(`/admin/vendors/${vendorId}/verify`, {
        isVerified
    });
    return response.data;
}

export const updateVendorRatingApi = async (vendorId, rating) => {
    const response = await servicesAxiosInstance.patch(`/vendors/${vendorId}/rating`, {
        rating
    });
    return response.data;
}

export const resetVendorCapacityApi = async (vendorId) => {
    const response = await servicesAxiosInstance.patch(`/admin/vendors/${vendorId}/reset-capacity`);
    return response.data;
}

export const updateVendorAddressApi = async (vendorId, address) => {
    const response = await servicesAxiosInstance.put(`/admin/vendors/${vendorId}/address`, address);
    return response.data;
}


// USER MANAGEMENT

export const getUserOverviewApi = async () => {
    const response = await servicesAxiosInstance.get('/admin/users/overview');
    return response.data;
}

export const getAllUsersApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/users', {
        params
    });
    return response.data;
}

export const getUserByIdApi = async (userId) => {
    const response = await servicesAxiosInstance.get(`/admin/users/${userId}`);
    return response.data;
}

export const banUserApi = async (userId, reason) => {
    const response = await servicesAxiosInstance.post(`/admin/users/${userId}/ban`, {
        reason
    });
    return response.data;
}

export const unbanUserApi = async (userId) => {
    const response = await servicesAxiosInstance.post(`/admin/users/${userId}/unban`);
    return response.data;
}

export const toggleUserStatusApi = async (userId) => {
    const response = await servicesAxiosInstance.put(`/admin/users/${userId}/toggle-status`);
    return response.data;
}

export const deleteUserApi = async (userId) => {
    const response = await servicesAxiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
}

export const getUserActivityStatsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/users/activity-stats', {
        params
    });
    return response.data;
}

export const searchUsersApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/users/search', {
        params
    });
    return response.data;
}


// VENDOR CUSTOMER MANAGEMENT

export const getVendorCustomersApi = async (params) => {
    const response = await servicesAxiosInstance.get('/vendor/customers', {
        params
    });
    return response.data;
}

export const getVendorCustomerByIdApi = async (subscriptionId) => {
    const response = await servicesAxiosInstance.get(`/vendor/customers/${subscriptionId}`);
    return response.data;
}

export const getVendorCustomerAnalyticsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/vendor/customers/analytics', {
        params
    });
    return response.data;
}


// ADMIN VENDOR ASSIGNMENT MANAGEMENT

export const getVendorAssignmentsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/vendor-assignments', {
        params
    });
    return response.data;
}

export const getPendingVendorAssignmentsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/vendor-assignments/pending', {
        params
    });
    return response.data;
}

export const getInitialAssignmentRequestsApi = async () => {
    const response = await servicesAxiosInstance.get('/admin/vendor-assignments/initial-assignments');
    return response.data;
}

export const getVendorSwitchRequestsApi = async () => {
    const response = await servicesAxiosInstance.get('/admin/vendor-assignments/vendor-switches');
    return response.data;
}

export const getUrgentVendorAssignmentsApi = async () => {
    const response = await servicesAxiosInstance.get('/admin/vendor-assignments/urgent');
    return response.data;
}

export const getVendorAssignmentsByZoneApi = async (zoneId) => {
    const response = await servicesAxiosInstance.get(`/admin/vendor-assignments/zone/${zoneId}`);
    return response.data;
}

export const getAvailableVendorsApi = async (requestId) => {
    const response = await servicesAxiosInstance.get(`/admin/vendor-assignments/${requestId}/available-vendors`);
    return response.data;
}

export const assignVendorApi = async (requestId, body) => {
    const response = await servicesAxiosInstance.post(`/admin/vendor-assignments/${requestId}/assign`, body);
    return response.data;
}

export const rejectVendorAssignmentApi = async (requestId, body) => {
    const response = await servicesAxiosInstance.post(`/admin/vendor-assignments/${requestId}/reject`, body);
    return response.data;
}

export const updateVendorAssignmentPriorityApi = async (requestId, body) => {
    const response = await servicesAxiosInstance.patch(`/admin/vendor-assignments/${requestId}/priority`, body);
    return response.data;
}

export const getVendorAssignmentDetailsApi = async (requestId) => {
    const response = await servicesAxiosInstance.get(`/admin/vendor-assignments/${requestId}`);
    return response.data;
}

export const getVendorAssignmentStatsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/vendor-assignments/stats', {
        params
    });
    return response.data;
}


// SUBSCRIPTION PURCHASES

export const getSubscriptionPurchasesApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/subscription-purchases', {
        params
    });
    return response.data;
}

export const getSubscriptionPurchaseByIdApi = async (purchaseId) => {
    const response = await servicesAxiosInstance.get(`/admin/subscription-purchases/${purchaseId}`);
    return response.data;
}

export const getSubscriptionPurchaseStatsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/subscription-purchases/stats', {
        params
    });
    return response.data;
}


// VENDOR ORDERS

export const getVendorOrdersApi = async (params) => {
    const response = await servicesAxiosInstance.get('/vendor/orders', {
        params
    });
    return response.data;
}

export const updateOrderStatusApi = async (orderId, body) => {
    const response = await servicesAxiosInstance.patch(`/orders/${orderId}/status`, body);
    return response.data;
}

export const getOrderByIdApi = async (orderId) => {
    const response = await servicesAxiosInstance.get(`/orders/${orderId}`);
    return response.data;
}


// ADMIN ORDER MANAGEMENT

export const getAdminOrdersApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/orders', {
        params
    });
    return response.data;
}

export const confirmOrderDeliveryApi = async (orderId, body) => {
    const response = await servicesAxiosInstance.post(`/admin/orders/${orderId}/confirm-delivery`, body);
    return response.data;
}

export const manualCreateOrderApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/orders/manual-create', body);
    return response.data;
}


// ADMIN DAILY MEAL MANAGEMENT

export const getDailyMealsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/daily-meals', {
        params
    });
    return response.data;
}

export const setTodayMealApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/daily-meals/set-today', body);
    return response.data;
}

export const getAvailableMenusForSubscriptionApi = async (subscriptionId) => {
    const response = await servicesAxiosInstance.get(`/admin/daily-meals/subscription/${subscriptionId}/menus`);
    return response.data;
}


// ORDER CREATION LOGS

export const getOrderCreationLogsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/order-creation-logs', {
        params
    });
    return response.data;
}

export const retryFailedOrderCreationApi = async (logId, attemptIndex) => {
    const response = await servicesAxiosInstance.post(`/admin/order-creation-logs/${logId}/retry/${attemptIndex}`);
    return response.data;
}


// ADMIN PROMO CODE MANAGEMENT

export const getPromoCodesApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/promo-codes', {
        params
    });
    return response.data;
}

export const getPromoCodeByIdApi = async (promoCodeId) => {
    const response = await servicesAxiosInstance.get(`/admin/promo-codes/${promoCodeId}`);
    return response.data;
}

export const createPromoCodeApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/promo-codes', body);
    return response.data;
}

export const updatePromoCodeApi = async (promoCodeId, body) => {
    const response = await servicesAxiosInstance.put(`/admin/promo-codes/${promoCodeId}`, body);
    return response.data;
}

export const deletePromoCodeApi = async (promoCodeId) => {
    const response = await servicesAxiosInstance.delete(`/admin/promo-codes/${promoCodeId}`);
    return response.data;
}

export const togglePromoCodeStatusApi = async (promoCodeId) => {
    const response = await servicesAxiosInstance.patch(`/admin/promo-codes/${promoCodeId}/toggle-status`);
    return response.data;
}

export const getPromoCodeStatsApi = async (promoCodeId) => {
    const response = await servicesAxiosInstance.get(`/admin/promo-codes/${promoCodeId}/stats`);
    return response.data;
}

export const getExpiringPromoCodesApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/promo-codes/expiring', {
        params
    });
    return response.data;
}

export const bulkCreatePromoCodesApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/promo-codes/bulk-create', body);
    return response.data;
}

export const validatePromoCodeApi = async (body) => {
    const response = await servicesAxiosInstance.post('/promo-codes/validate', body);
    return response.data;
}


// ADMIN REFERRAL MANAGEMENT

export const getReferralSystemStatsApi = async () => {
    const response = await servicesAxiosInstance.get('/admin/referral/system-stats');
    return response.data;
}

export const getReferralAnalyticsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/referral/analytics', {
        params
    });
    return response.data;
}

export const disableUserReferralApi = async (userId, body) => {
    const response = await servicesAxiosInstance.post(`/admin/referral/users/${userId}/disable`, body);
    return response.data;
}

export const enableUserReferralApi = async (userId) => {
    const response = await servicesAxiosInstance.post(`/admin/referral/users/${userId}/enable`);
    return response.data;
}

export const processReferralRewardApi = async (userId, body) => {
    const response = await servicesAxiosInstance.post(`/admin/referral/users/${userId}/process-reward`, body);
    return response.data;
}

export const validateReferralCodeApi = async (referralCode) => {
    const response = await servicesAxiosInstance.get(`/referral/validate/${referralCode}`);
    return response.data;
}

export const getReferralLeaderboardApi = async (params) => {
    const response = await servicesAxiosInstance.get('/referral/leaderboard', {
        params
    });
    return response.data;
}


// ADMIN REVIEW MANAGEMENT

export const getAdminReviewsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/reviews', {
        params
    });
    return response.data;
}

export const getReviewStatsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/admin/reviews/stats', {
        params
    });
    return response.data;
}

export const moderateReviewApi = async (reviewId, body) => {
    const response = await servicesAxiosInstance.patch(`/admin/reviews/${reviewId}/moderate`, body);
    return response.data;
}

export const getVendorReviewsApi = async (params) => {
    const response = await servicesAxiosInstance.get('/vendor/reviews', {
        params
    });
    return response.data;
}

export const getPublicSubscriptionReviewsApi = async (subscriptionId, params) => {
    const response = await servicesAxiosInstance.get(`/public/subscriptions/${subscriptionId}/reviews`, {
        params
    });
    return response.data;
}

export const getPublicVendorReviewsApi = async (vendorId, params) => {
    const response = await servicesAxiosInstance.get(`/public/vendors/${vendorId}/reviews`, {
        params
    });
    return response.data;
}


