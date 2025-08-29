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

export const EOrderStatus = Object.freeze({
    UPCOMING: 'upcoming',
    PREPARING: 'preparing',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    SKIPPED: 'skipped',
    CANCELLED: 'cancelled'
});

export const EMealType = Object.freeze({
    LUNCH: 'lunch',
    DINNER: 'dinner'
});

export const EOrderAction = Object.freeze({
    SKIP: 'skip',
    CANCEL: 'cancel',
    SWITCH_VENDOR: 'switch_vendor'
});

