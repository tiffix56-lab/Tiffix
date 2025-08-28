import Joi from 'joi';

/**
 * ************ AUTHENTICATION VALIDATION ***********************
 */
export const ValidateLogin = Joi.object({
    emailAddress: Joi.string().email().trim().required(),
    password: Joi.string().min(8).max(24).trim().required(),
});

export const ValidateVendorLogin = Joi.object({
    emailAddress: Joi.string().email().trim().required(),
    password: Joi.string().min(8).max(24).trim().required(),
    userType: Joi.string().valid('vendor').required(),
    businessId: Joi.string().optional()
});

export const ValidateAdminLogin = Joi.object({
    emailAddress: Joi.string().email().trim().required(),
    password: Joi.string().min(8).max(24).trim().required(),
    userType: Joi.string().valid('admin').required(),
    adminCode: Joi.string().optional()
});

export const ValidateRegister = Joi.object({
    emailAddress: Joi.string().email().trim().required(),
    password: Joi.string().min(8).max(24).trim().required(),
    name: Joi.string().min(2).max(50).trim().required(),
    phoneNumber: Joi.string().pattern(/[0-9]{10,15}$/).required(),
    referralCode: Joi.string().optional().default("")
});

export const ValidateChangePassword = Joi.object({
    currentPassword: Joi.string().min(8).max(24).trim().required(),
    newPassword: Joi.string().min(8).max(24).trim().required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

export const ValidateForgotPassword = Joi.object({
    emailAddress: Joi.string().email().trim().required()
});



/**
 * ************ USER PROFILE VALIDATION ***********************
 */


export const ValidateUpdateUserProfile = Joi.object({
    name: Joi.string().min(2).max(72).trim().optional(),
    avatar: Joi.string().uri().optional(),
    phoneNumber: Joi.string().pattern(/[0-9]{10,15}$/).optional(),
    isActive: Joi.boolean().optional(),
    preferences: Joi.object({
        dietary: Joi.array().items(
            Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher')
        ).optional(),
        cuisineTypes: Joi.array().items(Joi.string()).optional(),
        spiceLevel: Joi.string().valid('mild', 'medium', 'hot', 'extra-hot').optional()
    }).optional()
});

export const ValidateAddAddress = Joi.object({
    label: Joi.string().min(2).max(50).trim().required(),
    street: Joi.string().min(5).max(200).trim().required(),
    city: Joi.string().min(2).max(50).trim().required(),
    state: Joi.string().min(2).max(50).trim().required(),
    zipCode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    coordinates: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(
            Joi.number().min(-180).max(180), // longitude
            Joi.number().min(-90).max(90)    // latitude
        ).length(2).required()
    }).required(),
    isDefault: Joi.boolean().optional()
});

export const ValidateVendorAddress = Joi.object({
    street: Joi.string().min(5).max(200).trim().required(),
    city: Joi.string().min(2).max(50).trim().required(),
    state: Joi.string().min(2).max(50).trim().required(),
    country: Joi.string().min(2).max(50).trim().optional(),
    zipCode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional()
});

export const ValidateUserPreferences = Joi.object({
    preferences: Joi.object({
        dietary: Joi.array().items(
            Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher')
        ).optional(),
        cuisineTypes: Joi.array().items(Joi.string()).optional(),
        spiceLevel: Joi.string().valid('mild', 'medium', 'hot', 'extra-hot').optional()
    }).required()
});

export const ValidateLocationQuery = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().positive().max(100).optional()
});

/**
 * ************ SUBSCRIPTION VALIDATION ***********************
 */
export const ValidateCreateSubscription = Joi.object({
    planName: Joi.string().min(3).max(100).trim().required(),
    duration: Joi.string().valid('weekly', 'monthly', 'yearly', 'custom').required(),
    durationDays: Joi.number().positive().required(),
    mealTimings: Joi.object({
        isLunchAvailable: Joi.boolean().default(false),
        isDinnerAvailable: Joi.boolean().default(false),
        lunchOrderWindow: Joi.object({
            startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('11:00'),
            endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('16:00')
        }).optional(),
        dinnerOrderWindow: Joi.object({
            startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('19:00'),
            endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('23:00')
        }).optional()
    }).required(),
    mealsPerPlan: Joi.number().positive().required(),
    userSkipMealPerPlan: Joi.number().positive().default(6),
    originalPrice: Joi.number().positive().required(),
    discountedPrice: Joi.number().positive().required(),
    category: Joi.string().valid('home_chef', 'food_vendor').required(),
    freeDelivery: Joi.boolean().default(false),
    description: Joi.string().max(500).trim().optional(),
    features: Joi.array().items(Joi.string()).optional(),
    terms: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    planMenus: Joi.array().items(Joi.string().hex().length(24)).optional()
});

export const ValidateUpdateSubscription = Joi.object({
    planName: Joi.string().min(3).max(100).trim().optional(),
    duration: Joi.string().valid('weekly', 'monthly', 'yearly', 'custom').optional(),
    durationDays: Joi.number().positive().optional(),
    mealTimings: Joi.object({
        isLunchAvailable: Joi.boolean().optional(),
        isDinnerAvailable: Joi.boolean().optional(),
        lunchOrderWindow: Joi.object({
            startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
        }).optional(),
        dinnerOrderWindow: Joi.object({
            startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
        }).optional()
    }).optional(),
    mealsPerPlan: Joi.number().positive().optional(),
    userSkipMealPerPlan: Joi.number().positive().optional(),
    originalPrice: Joi.number().positive().optional(),
    discountedPrice: Joi.number().positive().optional(),
    category: Joi.string().valid('home_chef', 'food_vendor').optional(),
    freeDelivery: Joi.boolean().optional(),
    description: Joi.string().max(500).trim().optional(),
    features: Joi.array().items(Joi.string()).optional(),
    terms: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    planMenus: Joi.array().items(Joi.string().hex().length(24)).optional(),
    isActive: Joi.boolean().optional()
});

export const ValidateSubscriptionQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    category: Joi.string().valid('home_chef', 'food_vendor').optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    duration: Joi.string().valid('weekly', 'monthly', 'yearly', 'custom').optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    search: Joi.string().trim().optional(),
    sortBy: Joi.string().valid('createdAt', 'planName', 'discountedPrice', 'duration', 'currentPurchases').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
});

/**
 * ************ REFERRAL VALIDATION ***********************
 */
export const ValidateReferralCode = Joi.object({
    referralCode: Joi.string().min(6).max(10).trim().uppercase().required()
});



/**
 * ************ MENU VALIDATION ***********************
 */
export const ValidateCreateMenu = Joi.object({
    foodImage: Joi.string().uri().required(),
    foodSubImages: Joi.array().items(Joi.string().uri()).optional(),
    foodTitle: Joi.string().min(3).max(60).trim().required(),
    price: Joi.number().positive().required(),
    description: Joi.object({
        short: Joi.string().max(200).trim().required(),
        long: Joi.string().max(1000).trim().optional()
    }).required(),
    detailedItemList: Joi.string().trim().required(),
    vendorCategory: Joi.string().valid('home_chef', 'food_vendor').required(),
    cuisine: Joi.string().trim().required(),
    prepTime: Joi.number().positive().required(),
    calories: Joi.number().positive().required(),
    dietaryOptions: Joi.array().items(
        Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'non-vegetarian', 'dairy-free', 'halal', 'kosher', 'nut-free')
    ).optional(),
    tags: Joi.array().items(Joi.string()).optional()
});

export const ValidateUpdateMenu = Joi.object({
    foodImage: Joi.string().uri().optional(),
    foodSubImages: Joi.array().items(Joi.string().uri()).optional(),
    foodTitle: Joi.string().min(3).max(60).trim().optional(),
    price: Joi.number().positive().optional(),
    description: Joi.object({
        short: Joi.string().max(200).trim().optional(),
        long: Joi.string().max(1000).trim().optional()
    }).optional(),
    detailedItemList: Joi.string().trim().optional(),
    vendorCategory: Joi.string().valid('home_chef', 'food_vendor').optional(),
    cuisine: Joi.string().trim().optional(),
    prepTime: Joi.number().positive().optional(),
    calories: Joi.number().positive().optional(),
    dietaryOptions: Joi.array().items(
        Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'non-vegetarian', 'dairy-free', 'halal', 'kosher', 'nut-free')
    ).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    isAvailable: Joi.boolean().optional(),
    isActive: Joi.boolean().optional()
});

export const ValidateMenuQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    vendorCategory: Joi.string().valid('home_chef', 'food_vendor').optional(),
    cuisine: Joi.string().optional(),
    dietaryOptions: Joi.string().optional(), // comma-separated string
    tags: Joi.string().optional(), // comma-separated string
    isAvailable: Joi.string().valid('true', 'false').optional(),
    sortBy: Joi.string().valid('price', 'rating.average', 'prepTime', 'calories', 'createdAt').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    search: Joi.string().trim().optional()
});

/**
 * ************ VENDOR PROFILE VALIDATION ***********************
 */
export const ValidateCreateVendorWithUser = Joi.object({
    user: Joi.object({
        name: Joi.string().min(2).max(72).trim().required(),
        emailAddress: Joi.string().email().trim().required(),
        phoneNumber: Joi.string().pattern(/[0-9]{10,15}$/).required(),
        password: Joi.string().min(8).max(24).trim().required(),
        timezone: Joi.string().optional()
    }).required(),
    vendorProfile: Joi.object({
        vendorType: Joi.string().valid('home_chef', 'food_vendor').required(),
        businessInfo: Joi.object({
            businessName: Joi.string().required(),
            description: Joi.string().max(500).optional(),
            cuisineTypes: Joi.array().items(Joi.string()).optional(),
            serviceArea: Joi.object({
                radius: Joi.number().positive().max(50).optional(),
                coordinates: Joi.object({
                    lat: Joi.number().min(-90).max(90).required(),
                    lng: Joi.number().min(-180).max(180).required()
                }).required()
            }).required()
        }).required(),
        operatingHours: Joi.array().items(
            Joi.object({
                day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
                isOpen: Joi.boolean().optional(),
                openTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
                closeTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
            })
        ).optional(),
        capacity: Joi.object({
            dailyOrders: Joi.number().positive().optional()
        }).optional(),
        documents: Joi.object({
            businessLicense: Joi.string().optional(),
            foodSafetyLicense: Joi.string().optional(),
            taxId: Joi.string().optional()
        }).optional()
    }).required()
});

export const ValidateUpdateVendorWithUserInfo = Joi.object({
    user: Joi.object({
        name: Joi.string().min(2).max(72).trim().optional(),
        emailAddress: Joi.string().email().trim().optional()
    }).optional(),
    vendorProfile: Joi.object({
        vendorType: Joi.string().valid('home_chef', 'food_vendor').optional(),
        businessInfo: Joi.object({
            businessName: Joi.string().optional(),
            description: Joi.string().max(500).optional(),
            cuisineTypes: Joi.array().items(Joi.string()).optional(),
            serviceArea: Joi.object({
                radius: Joi.number().positive().max(50).optional(),
                coordinates: Joi.object({
                    lat: Joi.number().min(-90).max(90).optional(),
                    lng: Joi.number().min(-180).max(180).optional()
                }).optional()
            }).optional()
        }).optional(),
        operatingHours: Joi.array().items(
            Joi.object({
                day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
                isOpen: Joi.boolean().optional(),
                openTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
                closeTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
            })
        ).optional(),
        capacity: Joi.object({
            dailyOrders: Joi.number().positive().optional()
        }).optional(),
        documents: Joi.object({
            businessLicense: Joi.string().optional(),
            foodSafetyLicense: Joi.string().optional(),
            taxId: Joi.string().optional()
        }).optional(),
        isAvailable: Joi.boolean().optional()
    }).optional()
});

/**
 * ************ VENDOR PROFILE VALIDATION ***********************
 */
export const ValidateCreateVendorProfile = Joi.object({
    userId: Joi.string().required(),
    vendorType: Joi.string().valid('home_chef', 'food_vendor').required(),
    businessInfo: Joi.object({
        businessName: Joi.string().required(),
        description: Joi.string().max(500).optional(),
        cuisineTypes: Joi.array().items(Joi.string()).optional(),
        serviceArea: Joi.object({
            radius: Joi.number().positive().max(50).optional(),
            coordinates: Joi.object({
                lat: Joi.number().min(-90).max(90).required(),
                lng: Joi.number().min(-180).max(180).required()
            }).required()
        }).required()
    }).required(),
    operatingHours: Joi.array().items(
        Joi.object({
            day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
            isOpen: Joi.boolean().optional(),
            openTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
        })
    ).optional(),
    capacity: Joi.object({
        dailyOrders: Joi.number().positive().optional()
    }).optional(),
    documents: Joi.object({
        businessLicense: Joi.string().optional(),
        foodSafetyLicense: Joi.string().optional(),
        taxId: Joi.string().optional()
    }).optional()
});

export const ValidateUpdateVendorProfile = Joi.object({
    vendorType: Joi.string().valid('home_chef', 'food_vendor').optional(),
    businessInfo: Joi.object({
        businessName: Joi.string().optional(),
        description: Joi.string().max(500).optional(),
        cuisineTypes: Joi.array().items(Joi.string()).optional(),
        serviceArea: Joi.object({
            radius: Joi.number().positive().max(50).optional(),
            coordinates: Joi.object({
                lat: Joi.number().min(-90).max(90).optional(),
                lng: Joi.number().min(-180).max(180).optional()
            }).optional()
        }).optional()
    }).optional(),
    operatingHours: Joi.array().items(
        Joi.object({
            day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
            isOpen: Joi.boolean().optional(),
            openTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            closeTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
        })
    ).optional(),
    capacity: Joi.object({
        dailyOrders: Joi.number().positive().optional()
    }).optional(),
    documents: Joi.object({
        businessLicense: Joi.string().optional(),
        foodSafetyLicense: Joi.string().optional(),
        taxId: Joi.string().optional()
    }).optional(),
    isAvailable: Joi.boolean().optional()
});

export const ValidateVendorProfileQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    vendorType: Joi.string().valid('home_chef', 'food_vendor').optional(),
    isVerified: Joi.string().valid('true', 'false').optional(),
    isAvailable: Joi.string().valid('true', 'false').optional(),
    cuisineTypes: Joi.string().optional(),
    minRating: Joi.number().min(0).max(5).optional(),
    sortBy: Joi.string().valid('createdAt', 'rating.average', 'businessInfo.businessName').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    search: Joi.string().trim().optional()
});

export const ValidateVerifyVendor = Joi.object({
    isVerified: Joi.boolean().required()
});

export const ValidateUpdateCapacity = Joi.object({
    orderCount: Joi.number().positive().required()
});

export const ValidateUpdateRating = Joi.object({
    rating: Joi.number().min(1).max(5).required()
});

export const ValidateNearbyVendors = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().positive().max(50).optional(),
    vendorType: Joi.string().valid('home_chef', 'food_vendor').optional()
});

export const ValidateVendorTypeParam = Joi.object({
    type: Joi.string().valid('home_chef', 'food_vendor').required()
});

export const ValidateVendorCuisineParam = Joi.object({
    cuisine: Joi.string().trim().required()
});

export const ValidateVendorIdParam = Joi.object({
    id: Joi.string().hex().length(24).required()
});

export const ValidateUserIdParam = Joi.object({
    userId: Joi.string().hex().length(24).required()
});

/**
 * ************ LOCATION ZONE VALIDATION ***********************
 */
export const ValidateCreateLocationZone = Joi.object({
    zoneName: Joi.string().max(100).trim().required(),
    city: Joi.string().max(50).trim().required(),
    state: Joi.string().max(50).trim().optional(),
    country: Joi.string().max(50).trim().optional(),
    pincodes: Joi.array().items(Joi.string().pattern(/^[0-9]{6}$/)).min(1).required(),
    serviceType: Joi.string().valid('vendor_only', 'home_chef_only', 'both_vendor_home_chef').required(),
    serviceRadius: Joi.number().min(1).max(50).optional(),
    coordinates: Joi.object({
        center: Joi.object({
            lat: Joi.number().min(-90).max(90).required(),
            lng: Joi.number().min(-180).max(180).required()
        }).required(),
        boundaries: Joi.array().items(
            Joi.object({
                lat: Joi.number().required(),
                lng: Joi.number().required()
            })
        ).optional()
    }).required(),
    deliveryFee: Joi.object({
        baseCharge: Joi.number().min(0).optional(),
        perKmCharge: Joi.number().min(0).optional(),
        freeDeliveryAbove: Joi.number().min(0).optional()
    }).optional(),
    operatingHours: Joi.object({
        start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    restrictions: Joi.object({
        maxOrdersPerDay: Joi.number().positive().optional(),
        minOrderValue: Joi.number().min(0).optional(),
        maxOrderValue: Joi.number().positive().optional()
    }).optional(),
    priority: Joi.number().optional(),
    notes: Joi.string().max(500).optional()
});

export const ValidateUpdateLocationZone = Joi.object({
    zoneName: Joi.string().max(100).trim().optional(),
    city: Joi.string().max(50).trim().optional(),
    state: Joi.string().max(50).trim().optional(),
    country: Joi.string().max(50).trim().optional(),
    pincodes: Joi.array().items(Joi.string().pattern(/^[0-9]{6}$/)).min(1).optional(),
    serviceType: Joi.string().valid('vendor_only', 'home_chef_only', 'both_vendor_home_chef').optional(),
    serviceRadius: Joi.number().min(1).max(50).optional(),
    coordinates: Joi.object({
        center: Joi.object({
            lat: Joi.number().min(-90).max(90).optional(),
            lng: Joi.number().min(-180).max(180).optional()
        }).optional(),
        boundaries: Joi.array().items(
            Joi.object({
                lat: Joi.number().required(),
                lng: Joi.number().required()
            })
        ).optional()
    }).optional(),
    deliveryFee: Joi.object({
        baseCharge: Joi.number().min(0).optional(),
        perKmCharge: Joi.number().min(0).optional(),
        freeDeliveryAbove: Joi.number().min(0).optional()
    }).optional(),
    operatingHours: Joi.object({
        start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    restrictions: Joi.object({
        maxOrdersPerDay: Joi.number().positive().optional(),
        minOrderValue: Joi.number().min(0).optional(),
        maxOrderValue: Joi.number().positive().optional()
    }).optional(),
    priority: Joi.number().optional(),
    notes: Joi.string().max(500).optional(),
    isActive: Joi.boolean().optional()
});

export const ValidateLocationZoneQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().optional(),
    country: Joi.string().trim().optional(),
    serviceType: Joi.string().valid('vendor_only', 'home_chef_only', 'both_vendor_home_chef').optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
    lat: Joi.number().min(-90).max(90).optional(),
    lng: Joi.number().min(-180).max(180).optional(),
    radius: Joi.number().positive().max(100).optional(),
    sortBy: Joi.string().valid('zoneName', 'city', 'priority', 'createdAt', 'serviceRadius').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    search: Joi.string().trim().optional(),
    vendorType: Joi.string().valid('vendor', 'home_chef').optional()
});


/**
 * ************ PROMO CODE VALIDATION ***********************
 */
export const ValidateCreatePromoCode = Joi.object({
    code: Joi.string().min(3).max(20).trim().uppercase().required(),
    description: Joi.string().max(500).trim().required(),
    discountType: Joi.string().valid('percentage', 'flat').required(),
    discountValue: Joi.number().positive().required(),
    minOrderValue: Joi.number().min(0).default(0).optional(),
    maxDiscount: Joi.number().positive().optional(),
    usageLimit: Joi.number().positive().required(),
    validFrom: Joi.date().required(),
    validUntil: Joi.date().greater(Joi.ref('validFrom')).required(),
    applicableSubscriptions: Joi.array().items(Joi.string().hex().length(24)).optional(),
    applicableCategories: Joi.array().items(
        Joi.string().valid('universal', 'food_vendor_specific', 'home_chef_specific', 'both_options')
    ).optional(),
    userUsageLimit: Joi.number().positive().default(1).optional()
});

export const ValidateUpdatePromoCode = Joi.object({
    code: Joi.string().min(3).max(20).trim().uppercase().optional(),
    description: Joi.string().max(500).trim().optional(),
    discountType: Joi.string().valid('percentage', 'flat').optional(),
    discountValue: Joi.number().positive().optional(),
    minOrderValue: Joi.number().min(0).optional(),
    maxDiscount: Joi.number().positive().optional(),
    usageLimit: Joi.number().positive().optional(),
    validFrom: Joi.date().optional(),
    validUntil: Joi.date().optional(),
    applicableSubscriptions: Joi.array().items(Joi.string().hex().length(24)).optional(),
    applicableCategories: Joi.array().items(
        Joi.string().valid('universal', 'food_vendor_specific', 'home_chef_specific', 'both_options')
    ).optional(),
    userUsageLimit: Joi.number().positive().optional(),
    isActive: Joi.boolean().optional()
});

export const ValidatePromoCodeQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    discountType: Joi.string().valid('percentage', 'flat').optional(),
    status: Joi.string().valid('active', 'expired', 'used_up').optional(),
    sortBy: Joi.string().valid('createdAt', 'validUntil', 'usageLimit', 'usedCount', 'discountValue').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    search: Joi.string().trim().optional()
});

export const ValidateApplyPromoCode = Joi.object({
    code: Joi.string().min(3).max(20).trim().uppercase().required(),
    subscriptionId: Joi.string().hex().length(24).required(),
    orderValue: Joi.number().positive().required()
});

/**
 * ************ SUBSCRIPTION PURCHASE VALIDATION ***********************
 */
export const ValidateInitiatePurchase = Joi.object({
    subscriptionId: Joi.string().hex().length(24).required(),
    promoCode: Joi.string().min(3).max(20).trim().uppercase().optional(),
    deliveryAddress: Joi.object({
        street: Joi.string().min(5).max(200).trim().required(),
        city: Joi.string().min(2).max(50).trim().required(),
        state: Joi.string().min(2).max(50).trim().optional(),
        country: Joi.string().min(2).max(50).trim().default('India'),
        zipCode: Joi.string().pattern(/^[0-9]{6}$/).required(),
        landmark: Joi.string().max(100).trim().optional(),
        coordinates: Joi.object({
            type: Joi.string().valid('Point').default('Point'),
            coordinates: Joi.array().items(
                Joi.number().min(-180).max(180), // longitude
                Joi.number().min(-90).max(90)    // latitude
            ).length(2).required()
        }).required()
    }).required(),
    mealTimings: Joi.object({
        lunch: Joi.object({
            enabled: Joi.boolean().required(),
            time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).when('enabled', {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional()
            })
        }).required(),
        dinner: Joi.object({
            enabled: Joi.boolean().required(),
            time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).when('enabled', {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional()
            })
        }).required()
    }).required(),
    startDate: Joi.date().min('now').optional().messages({
        'date.min': 'Start date cannot be in the past (IST timezone)',
        'date.base': 'Start date must be a valid date'
    })
});

export const ValidateVerifyPayment = Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    userSubscriptionId: Joi.string().hex().length(24).required()
});

export const ValidateUserSubscriptionQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    status: Joi.string().valid('pending', 'active', 'expired', 'cancelled', 'failed').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    category: Joi.string().valid('home_chef', 'food_vendor').optional(),
    sortBy: Joi.string().valid('createdAt', 'startDate', 'endDate', 'finalPrice').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
});

export const ValidateCancelSubscription = Joi.object({
    reason: Joi.string().min(5).max(500).trim().required()
});

export const ValidateVendorSwitchRequest = Joi.object({
    reason: Joi.string().min(5).max(500).trim().optional()
});

/**
 * ************ VENDOR ASSIGNMENT VALIDATION ***********************
 */
export const ValidateVendorAssignmentQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'completed').optional(),
    requestType: Joi.string().valid('initial_assignment', 'vendor_switch').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    deliveryZone: Joi.string().hex().length(24).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    sortBy: Joi.string().valid('requestedAt', 'priority', 'status', 'requestType').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
});

export const ValidateAssignVendor = Joi.object({
    vendorId: Joi.string().hex().length(24).required(),
    adminNotes: Joi.string().max(500).trim().optional()
});

export const ValidateRejectRequest = Joi.object({
    rejectionReason: Joi.string().min(5).max(300).trim().required(),
    adminNotes: Joi.string().max(500).trim().optional()
});

export const ValidateUpdatePriority = Joi.object({
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').required()
});

/**
 * ************ TRANSACTION VALIDATION ***********************
 */
export const ValidateTransactionQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    status: Joi.string().valid('pending', 'processing', 'success', 'failed', 'cancelled', 'refunded').optional(),
    paymentMethod: Joi.string().valid('razorpay', 'upi', 'card', 'netbanking', 'wallet').optional(),
    type: Joi.string().valid('purchase', 'refund', 'cancellation').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    sortBy: Joi.string().valid('createdAt', 'finalAmount', 'status').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    search: Joi.string().trim().optional(),
    userId: Joi.string().hex().length(24).optional(),
    subscriptionId: Joi.string().hex().length(24).optional()
});

export const ValidateRefundTransaction = Joi.object({
    reason: Joi.string().max(500).trim().required(),
    amount: Joi.number().positive().optional()
});



/**
 * ************ ADMIN USER MANAGEMENT VALIDATION ***********************
 */
export const ValidateUserFilters = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    role: Joi.string().valid('USER', 'VENDOR', 'ADMIN').optional(),
    status: Joi.string().valid('active', 'inactive', 'banned').optional(),
    search: Joi.string().trim().min(2).optional(),
    userType: Joi.string().valid('normal', 'vendor', 'premium').optional(),
    hasSubscription: Joi.string().valid('true', 'false').optional(),
    sortBy: Joi.string().valid('createdAt', 'name', 'emailAddress', 'lastLogin', 'role').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
});

export const ValidateBanUser = Joi.object({
    reason: Joi.string().min(5).max(500).trim().required()
});

export const ValidateUnbanUser = Joi.object({
    reason: Joi.string().max(500).trim().optional()
});

export const ValidateUpdateLocation = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().max(500).trim().optional(),
    city: Joi.string().max(100).trim().optional(),
    state: Joi.string().max(100).trim().optional(),
    country: Joi.string().max(100).trim().optional(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).optional()
});

/**
 * ************ ADMIN SUBSCRIPTION PURCHASE VALIDATION ***********************
 */
export const ValidateAdminSubscriptionQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    search: Joi.string().trim().optional(),
    status: Joi.string().valid('pending', 'active', 'expired', 'cancelled', 'failed', 'newer', 'older').optional(),
    vendorAssigned: Joi.string().valid('assigned', 'unassigned').optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    sortBy: Joi.string().valid('createdAt', 'startDate', 'endDate', 'finalPrice', 'status').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    category: Joi.string().valid('home_chef', 'food_vendor').optional(),
    priceMin: Joi.number().min(0).optional(),
    priceMax: Joi.number().min(0).optional(),
    subscriptionId: Joi.string().hex().length(24).optional()
});

export const ValidateAdminStatsQuery = Joi.object({
    period: Joi.string().valid('7d', '30d', '90d', '1y', 'all').optional(),
    category: Joi.string().valid('home_chef', 'food_vendor').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
});

/**
 * ************ VENDOR CUSTOMER MANAGEMENT VALIDATION ***********************
 */
export const ValidateVendorCustomerQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(50).optional(),
    search: Joi.string().trim().optional(),
    status: Joi.string().valid('active', 'expired', 'pending', 'cancelled').optional(),
    deliveryAddress: Joi.string().trim().optional(),
    amount: Joi.string().pattern(/^\d+(-\d+)?$/).optional(), // format: "min" or "min-max"
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    sortBy: Joi.string().valid('createdAt', 'startDate', 'endDate', 'finalPrice', 'status').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
});

export const ValidateVendorAnalyticsQuery = Joi.object({
    period: Joi.string().valid('7d', '30d', '90d', '1y', 'all').optional(),
    category: Joi.string().valid('home_chef', 'food_vendor').optional()
});

export const validateJoiSchema = (schema, value) => {
    const result = schema.validate(value, { abortEarly: false });
    return {
        value: result.value,
        error: result.error,
    };
};