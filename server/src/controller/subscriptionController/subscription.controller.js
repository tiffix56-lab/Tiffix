import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateSubscription, ValidateUpdateSubscription, ValidateSubscriptionQuery } from '../../util/validationService.js';
import Subscription from '../../models/subscription.model.js';

export default {
    // Create new subscription plan (Admin only)
    createSubscription: async (req, res, next) => {
        try {
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateCreateSubscription, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const newSubscription = new Subscription(value);
            const savedSubscription = await newSubscription.save();

            httpResponse(req, res, 201, responseMessage.SUCCESS, { subscription: savedSubscription });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get all subscription plans with comprehensive filters (consolidated route)
    getAllSubscriptions: async (req, res, next) => {
        try {
            const { query } = req;
            
            const { error, value } = validateJoiSchema(ValidateSubscriptionQuery, query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { 
                page = 1, 
                limit = 10, 
                category,
                duration,
                minPrice, 
                maxPrice, 
                isActive,
                sortBy = 'priority',
                sortOrder = 'desc',
                search
            } = value;

            const skip = (page - 1) * limit;
            const filter = {};

            // Build comprehensive filter
            if (category) filter.category = category;
            if (duration) filter.duration = duration;
            if (minPrice || maxPrice) {
                filter.discountedPrice = {};
                if (minPrice) filter.discountedPrice.$gte = parseFloat(minPrice);
                if (maxPrice) filter.discountedPrice.$lte = parseFloat(maxPrice);
            }
            if (isActive !== undefined) filter.isActive = isActive === 'true';
            
            // Text search across name and description
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const subscriptions = await Subscription.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Subscription.countDocuments(filter);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscriptions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                filters: {
                    category,
                    duration,
                    priceRange: { minPrice, maxPrice },
                    isActive,
                    search
                }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get single subscription by ID
    getSubscriptionById: async (req, res, next) => {
        try {
            const { id } = req.params;

            const subscription = await Subscription.findById(id);
            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { subscription });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Update subscription plan (Admin only)
    updateSubscription: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateUpdateSubscription, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const updatedSubscription = await Subscription.findByIdAndUpdate(id, value, { 
                new: true, 
                runValidators: true 
            });

            if (!updatedSubscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { subscription: updatedSubscription });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Delete subscription plan (Admin only)
    deleteSubscription: async (req, res, next) => {
        try {
            const { id } = req.params;

            const deletedSubscription = await Subscription.findByIdAndUpdate(id, { isActive: false }, { new: true });
            if (!deletedSubscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Subscription deleted successfully' });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Legacy routes - now handled by getAllSubscriptions with query params
    // GET /subscriptions?isActive=true
    getActiveSubscriptions: async (req, res, next) => {
        req.query.isActive = 'true';
        return exports.default.getAllSubscriptions(req, res, next);
    },

    // GET /subscriptions?category=categoryName  
    getSubscriptionsByCategory: async (req, res, next) => {
        req.query.category = req.params.category;
        return exports.default.getAllSubscriptions(req, res, next);
    },

    // GET /subscriptions?minPrice=X&maxPrice=Y
    getSubscriptionsByPriceRange: async (req, res, next) => {
        const { minPrice, maxPrice } = req.query;
        if (!minPrice || !maxPrice) {
            return httpError(next, new Error('Both minPrice and maxPrice are required'), req, 400);
        }
        return exports.default.getAllSubscriptions(req, res, next);
    },

    // Toggle subscription status (Admin only)
    toggleSubscriptionStatus: async (req, res, next) => {
        try {
            const { id } = req.params;

            const subscription = await Subscription.findById(id);
            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            subscription.isActive = !subscription.isActive;
            await subscription.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                subscription,
                message: `Subscription ${subscription.isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Purchase subscription (User)
    purchaseSubscription: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { userId } = req.body; // Should come from auth middleware

            const subscription = await Subscription.findById(id);
            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            if (!subscription.canPurchase()) {
                return httpError(next, new Error('Subscription is not available for purchase'), req, 400);
            }

            // Here you would integrate with payment gateway
            // For now, we'll just increment the purchase count
            await subscription.incrementPurchases();

            // Add subscription to user profile (implement based on your user profile logic)
            // const userProfile = await UserProfile.findOne({ userId });
            // userProfile.activeSubscriptions.push(subscription._id);
            // await userProfile.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                subscription,
                message: 'Subscription purchased successfully',
                credits: subscription.calculateCredits()
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get subscription statistics (Admin only)
    getSubscriptionStats: async (req, res, next) => {
        try {
            const totalSubscriptions = await Subscription.countDocuments();
            const activeSubscriptions = await Subscription.countDocuments({ isActive: true });
            const inactiveSubscriptions = totalSubscriptions - activeSubscriptions;

            const categoryStats = await Subscription.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]);

            const durationStats = await Subscription.aggregate([
                { $group: { _id: '$duration', count: { $sum: 1 } } }
            ]);

            const purchaseStats = await Subscription.aggregate([
                { 
                    $group: { 
                        _id: null, 
                        totalPurchases: { $sum: '$currentPurchases' },
                        averagePrice: { $avg: '$discountedPrice' }
                    }
                }
            ]);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                totalSubscriptions,
                activeSubscriptions,
                inactiveSubscriptions,
                categoryStats,
                durationStats,
                purchaseStats: purchaseStats[0] || { totalPurchases: 0, averagePrice: 0 }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Validate subscription availability
    validateSubscription: async (req, res, next) => {
        try {
            const { id } = req.params;

            const subscription = await Subscription.findById(id);
            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            const isValid = subscription.isValidNow();
            const canPurchase = subscription.canPurchase();
            const discountPercentage = subscription.getDiscountPercentage();
            const discountAmount = subscription.getDiscountAmount();
            const credits = subscription.calculateCredits();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscription,
                validation: {
                    isValid,
                    canPurchase,
                    discountPercentage,
                    discountAmount,
                    credits
                }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    }
};