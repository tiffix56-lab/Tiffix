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
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
    }).optional(),
    isDefault: Joi.boolean().optional()
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
    duration: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').required(),
    customDurationDays: Joi.number().min(1).when('duration', {
        is: 'custom',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    mealsPerPlan: Joi.number().min(1).required(),
    originalPrice: Joi.number().min(0).required(),
    discountedPrice: Joi.number().min(0).required().custom((value, helpers) => {
        const { originalPrice } = helpers.state.ancestors[0];
        if (value > originalPrice) {
            return helpers.error('any.custom', { message: 'Discounted price cannot be greater than original price' });
        }
        return value;
    }),
    category: Joi.string().valid('universal', 'food_vendor_specific', 'home_chef_specific', 'both_options').required(),
    freeDelivery: Joi.boolean().optional(),
    description: Joi.string().max(500).trim().optional(),
    features: Joi.array().items(Joi.string()).optional(),
    terms: Joi.string().max(1000).optional(),
    isActive: Joi.boolean().optional(),
    currentPurchases: Joi.number().min(0).optional(),
    tags: Joi.array().items(Joi.string()).optional()
});

export const ValidateUpdateSubscription = Joi.object({
    planName: Joi.string().min(3).max(100).trim().optional(),
    duration: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').optional(),
    customDurationDays: Joi.number().min(1).when('duration', {
        is: 'custom',
        then: Joi.optional(),
        otherwise: Joi.optional()
    }),
    mealsPerPlan: Joi.number().min(1).optional(),
    originalPrice: Joi.number().min(0).optional(),
    discountedPrice: Joi.number().min(0).optional().custom((value, helpers) => {
        const { originalPrice } = helpers.state.ancestors[0];
        if (originalPrice && value > originalPrice) {
            return helpers.error('any.custom', { message: 'Discounted price cannot be greater than original price' });
        }
        return value;
    }),
    category: Joi.string().valid('universal', 'food_vendor_specific', 'home_chef_specific', 'both_options').optional(),
    freeDelivery: Joi.boolean().optional(),
    description: Joi.string().max(500).trim().optional(),
    features: Joi.array().items(Joi.string()).optional(),
    terms: Joi.string().max(1000).optional(),
    isActive: Joi.boolean().optional(),
    currentPurchases: Joi.number().min(0).optional(),
    tags: Joi.array().items(Joi.string()).optional()
});

export const ValidateSubscriptionQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    category: Joi.string().valid('universal', 'food_vendor_specific', 'home_chef_specific', 'both_options').optional(),
    duration: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    sortBy: Joi.string().valid('originalPrice', 'discountedPrice', 'duration', 'priority', 'createdAt', 'planName', 'mealsPerPlan').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    search: Joi.string().trim().optional()
});

/**
 * ************ REFERRAL VALIDATION ***********************
 */
export const ValidateReferralCode = Joi.object({
    referralCode: Joi.string().min(6).max(10).trim().uppercase().required()
});

export const ValidateUseCredits = Joi.object({
    creditsToUse: Joi.number().positive().min(1).required()
});

/**
 * ************ MENU VALIDATION ***********************
 */
export const ValidateCreateMenu = Joi.object({
    foodImage: Joi.string().uri().required(),
    foodSubImages: Joi.array().items(Joi.string().uri()).optional(),
    foodTitle: Joi.string().min(3).max(60).trim().required(),
    price: Joi.number().positive().required(),
    creditsRequired: Joi.number().min(0).optional(),
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
    tags: Joi.array().items(Joi.string()).optional(),
    allergens: Joi.array().items(Joi.string()).optional(),
    nutritionalInfo: Joi.object({
        protein: Joi.number().min(0).optional(),
        carbs: Joi.number().min(0).optional(),
        fat: Joi.number().min(0).optional(),
        fiber: Joi.number().min(0).optional(),
        sugar: Joi.number().min(0).optional(),
        sodium: Joi.number().min(0).optional()
    }).optional(),
    servingSize: Joi.string().optional(),
    availableQuantity: Joi.number().min(0).optional(),
    maxOrdersPerDay: Joi.number().positive().optional()
});

export const ValidateUpdateMenu = Joi.object({
    foodImage: Joi.string().uri().optional(),
    foodSubImages: Joi.array().items(Joi.string().uri()).optional(),
    foodTitle: Joi.string().min(3).max(60).trim().optional(),
    price: Joi.number().positive().optional(),
    creditsRequired: Joi.number().min(0).optional(),
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
    allergens: Joi.array().items(Joi.string()).optional(),
    nutritionalInfo: Joi.object({
        protein: Joi.number().min(0).optional(),
        carbs: Joi.number().min(0).optional(),
        fat: Joi.number().min(0).optional(),
        fiber: Joi.number().min(0).optional(),
        sugar: Joi.number().min(0).optional(),
        sodium: Joi.number().min(0).optional()
    }).optional(),
    servingSize: Joi.string().optional(),
    availableQuantity: Joi.number().min(0).optional(),
    maxOrdersPerDay: Joi.number().positive().optional(),
    isAvailable: Joi.boolean().optional(),
    isActive: Joi.boolean().optional()
});

export const ValidateMenuQuery = Joi.object({
    page: Joi.number().positive().optional(),
    limit: Joi.number().positive().max(100).optional(),
    vendorCategory: Joi.string().valid('home_chef', 'food_vendor').optional(),
    cuisine: Joi.string().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    minCalories: Joi.number().positive().optional(),
    maxCalories: Joi.number().positive().optional(),
    minPrepTime: Joi.number().positive().optional(),
    maxPrepTime: Joi.number().positive().optional(),
    minRating: Joi.number().min(0).max(5).optional(),
    dietaryOptions: Joi.string().optional(), // comma-separated string
    tags: Joi.string().optional(), // comma-separated string
    allergens: Joi.string().optional(), // comma-separated string
    isAvailable: Joi.string().valid('true', 'false').optional(),
    hasCreditsRequired: Joi.string().valid('true', 'false').optional(),
    minCredits: Joi.number().min(0).optional(),
    maxCredits: Joi.number().min(0).optional(),
    sortBy: Joi.string().valid('price', 'rating.average', 'prepTime', 'calories', 'createdAt', 'soldToday', 'availableQuantity').optional(),
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


export const validateJoiSchema = (schema, value) => {
    const result = schema.validate(value, { abortEarly: false });
    return {
        value: result.value,
        error: result.error,
    };
};