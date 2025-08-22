export const EApplicationEnvironment = Object.freeze({
    PRODUCTION: 'production',
    DEVELOPMENT: 'development'
});

export const EUserRole = Object.freeze({
    ADMIN: 'admin',
    USER: 'user',
    VENDOR: 'vendor'
});

export const EVendorType = Object.freeze({
    HOME_CHEF: 'home_chef',
    FOOD_VENDOR: 'food_vendor'
});

export const EAuthProvider = Object.freeze({
    LOCAL: "LOCAL",
    GOOGLE: "GOOGLE",
    FACEBOOK: "FACEBOOK"
})


export const EPaymentStatus = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
});

export const ESubscriptionStatus = Object.freeze({
    PENDING: 'pending',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
});

