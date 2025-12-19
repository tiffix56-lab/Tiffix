import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateSubscription, ValidateUpdateSubscription, ValidateSubscriptionQuery } from '../../service/validationService.js';
import Subscription from '../../models/subscription.model.js';
import UserSubscription from '../../models/userSubscription.model.js';
import Review, { EReviewStatus, EReviewType } from '../../models/review.model.js';

export default {
    // Public methods for users to view available subscriptions
    getActiveSubscriptions: async (req, res, next) => {
        try {
            const {
                category,
                duration,
                minPrice,
                maxPrice,
                page = 1,
                limit = 10
            } = req.query;

            const skip = (page - 1) * limit;
            const query = { isActive: true };

            if (category) query.category = category;
            if (duration) query.duration = duration;

            if (minPrice || maxPrice) {
                query.discountedPrice = {};
                if (minPrice) query.discountedPrice.$gte = Number(minPrice);
                if (maxPrice) query.discountedPrice.$lte = Number(maxPrice);
            }

            const subscriptions = await Subscription.find(query)
                .select('planName duration durationDays mealTimings mealsPerPlan userSkipMealPerPlan originalPrice discountedPrice category freeDelivery description features image')
                .sort({ discountedPrice: 1 })
                .skip(skip)
                .limit(Number(limit));

            const subscriptionIds = subscriptions.map(s => s._id);
            const reviewStats = await Review.aggregate([
                {
                    $match: {
                        subscriptionId: { $in: subscriptionIds },
                        reviewType: EReviewType.SUBSCRIPTION,
                        status: EReviewStatus.ACTIVE
                    }
                },
                {
                    $group: {
                        _id: '$subscriptionId',
                        avgRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        subscriptionId: '$_id',
                        avgRating: { $round: ['$avgRating', 1] },
                        totalReviews: 1
                    }
                }
            ]);
            console.log(reviewStats);
            

            const subscriptionsWithReviews = subscriptions.map(sub => {
                const stats = reviewStats.find(r => r.subscriptionId.toString() === sub._id.toString());
                return {
                    ...sub.toObject(),
                    avgRating: stats?.avgRating || 0,
                    totalReviews: stats?.totalReviews || 0
                };
            });

            const totalSubscriptions = await Subscription.countDocuments(query);
            const totalPages = Math.ceil(totalSubscriptions / limit);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscriptions: subscriptionsWithReviews,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalSubscriptions,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while fetching active subscriptions';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getSubscriptionForUser: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;

            const subscription = await Subscription.findOne({
                _id: subscriptionId,
                isActive: true
            }).select('planName duration durationDays mealTimings mealsPerPlan userSkipMealPerPlan originalPrice discountedPrice category freeDelivery description features terms image');

            if (!subscription) {
                return httpError(next, new Error('Subscription not found or inactive'), req, 404);
            }

            const reviewStats = await Review.getAverageRating(subscriptionId, EReviewType.SUBSCRIPTION);
            const stats = reviewStats[0] || { averageRating: 0, totalReviews: 0 };

            const recentReviews = await Review.findForSubscription(subscriptionId, {
                status: EReviewStatus.ACTIVE,
                limit: 5,
                sortBy: 'createdAt'
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscription: {
                    ...subscription.toObject(),
                    avgRating: stats.averageRating,
                    totalReviews: stats.totalReviews,
                    recentReviews
                }
            });

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while fetching subscription for user';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },
    // Create new subscription plan (Admin only)
    createSubscription: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateCreateSubscription, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                planName,
                duration,
                durationDays,
                mealTimings,
                mealsPerPlan,
                userSkipMealPerPlan,
                originalPrice,
                discountedPrice,
                category,
                freeDelivery,
                description,
                features,
                terms,
                tags,
                planMenus,
                image
            } = req.body;

            const existingSubscription = await Subscription.findOne({ planName });
            if (existingSubscription) {
                return httpError(next, new Error('Subscription plan with this name already exists'), req, 409);
            }

            const newSubscription = new Subscription({
                planName,
                duration,
                durationDays,
                mealTimings,
                mealsPerPlan,
                userSkipMealPerPlan: userSkipMealPerPlan || 0,
                originalPrice,
                discountedPrice,
                category,
                freeDelivery: freeDelivery || false,
                description,
                features: features || [],
                terms,
                tags: tags || [],
                planMenus: planMenus || [],
                image
            });

            await newSubscription.save();

            httpResponse(req, res, 201, responseMessage.customMessage("Subscription Created"), {
                subscription: newSubscription
            });

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while creating subscription';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get all subscription plans (Admin only)
    getAllSubscriptions: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateSubscriptionQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                page = 1,
                limit = 10,
                category,
                isActive,
                duration,
                minPrice,
                maxPrice,
                search
            } = req.query;

            const skip = (page - 1) * limit;
            const query = {};

            if (category) query.category = category;
            if (isActive !== undefined) query.isActive = isActive === 'true';
            if (duration) query.duration = duration;

            if (minPrice || maxPrice) {
                query.discountedPrice = {};
                if (minPrice) query.discountedPrice.$gte = Number(minPrice);
                if (maxPrice) query.discountedPrice.$lte = Number(maxPrice);
            }

            if (search) {
                query.$text = { $search: search };
            }

            const subscriptions = await Subscription.find(query)
                .populate('planMenus', 'foodTitle foodImage price')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            const subscriptionIds = subscriptions.map(s => s._id);
            const reviewStats = await Review.aggregate([
                {
                    $match: {
                        subscriptionId: { $in: subscriptionIds },
                        reviewType: EReviewType.SUBSCRIPTION,
                        status: EReviewStatus.ACTIVE
                    }
                },
                {
                    $group: {
                        _id: '$subscriptionId',
                        avgRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'subscriptions',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'subscription'
                    }
                },
                {
                    $project: {
                        subscriptionId: '$_id',
                        avgRating: { $round: ['$avgRating', 1] },
                        totalReviews: 1
                    }
                }
            ]);

            const subscriptionsWithReviews = subscriptions.map(sub => {
                const stats = reviewStats.find(r => r.subscriptionId.toString() === sub._id.toString());
                return {
                    ...sub.toObject(),
                    avgRating: stats?.avgRating || 0,
                    totalReviews: stats?.totalReviews || 0
                };
            });

            const totalSubscriptions = await Subscription.countDocuments(query);
            const totalPages = Math.ceil(totalSubscriptions / limit);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscriptions: subscriptionsWithReviews,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalSubscriptions,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while fetching all subscriptions';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get subscription by ID (Admin only)
    getSubscriptionById: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;

            const subscription = await Subscription.findById(subscriptionId)
                .populate('planMenus', 'foodTitle foodImage price category vendorType');

            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            const reviewStats = await Review.getAverageRating(subscriptionId, EReviewType.SUBSCRIPTION);
            const stats = reviewStats[0] || { averageRating: 0, totalReviews: 0 };

            const recentReviews = await Review.findForSubscription(subscriptionId, {
                status: EReviewStatus.ACTIVE,
                limit: 10
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscription: {
                    ...subscription.toObject(),
                    avgRating: stats.averageRating,
                    totalReviews: stats.totalReviews,
                    recentReviews
                }
            });

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while fetching subscription by ID';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },
    // Update subscription (Admin only)
    updateSubscription: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;
            const { error } = validateJoiSchema(ValidateUpdateSubscription, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            if (req.body.planName && req.body.planName !== subscription.planName) {
                const existingSubscription = await Subscription.findOne({
                    planName: req.body.planName,
                    _id: { $ne: subscriptionId }
                });
                if (existingSubscription) {
                    return httpError(next, new Error('Subscription plan with this name already exists'), req, 409);
                }
            }

            const allowedUpdates = [
                'planName', 'duration', 'durationDays', 'mealTimings', 'mealsPerPlan',
                'userSkipMealPerPlan', 'originalPrice', 'discountedPrice', 'category',
                'freeDelivery', 'description', 'features', 'terms', 'tags', 'planMenus', 'image'
            ];

            const updates = {};
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            const updatedSubscription = await Subscription.findByIdAndUpdate(
                subscriptionId,
                updates,
                { new: true, runValidators: true }
            ).populate('planMenus', 'foodTitle foodImage price');

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscription: updatedSubscription
            });

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while updating subscription';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Delete subscription (Admin only)
    deleteSubscription: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            const activePurchases = await UserSubscription.countDocuments({
                subscriptionId: subscriptionId,
                status: 'active'
            });

            if (activePurchases > 0) {
                return httpError(next, new Error('Cannot delete subscription with active purchases'), req, 400);
            }

            await Subscription.findByIdAndDelete(subscriptionId);

            httpResponse(req, res, 200, responseMessage.customMessage("Subscription Deleted"));

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while deleting subscription';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Toggle subscription status (Admin only)
    toggleSubscriptionStatus: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            subscription.isActive = !subscription.isActive;
            await subscription.save();

            const statusMessage = subscription.isActive ?
                responseMessage.customMessage("Subscription Activated") :
                responseMessage.customMessage("Subscription DeActivated");

            httpResponse(req, res, 200, statusMessage, {
                subscription
            });

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while toggling subscription status';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get subscription statistics (Admin only)
    getSubscriptionStats: async (req, res, next) => {
        try {
            const stats = await Subscription.aggregate([
                {
                    $group: {
                        _id: null,
                        totalPlans: { $sum: 1 },
                        activePlans: { $sum: { $cond: ['$isActive', 1, 0] } },
                        inactivePlans: { $sum: { $cond: ['$isActive', 0, 1] } },
                        totalPurchases: { $sum: '$currentPurchases' },
                        avgPrice: { $avg: '$discountedPrice' }
                    }
                }
            ]);

            const categoryStats = await Subscription.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        avgPrice: { $avg: '$discountedPrice' },
                        totalPurchases: { $sum: '$currentPurchases' }
                    }
                }
            ]);

            const durationStats = await Subscription.aggregate([
                {
                    $group: {
                        _id: '$duration',
                        count: { $sum: 1 },
                        avgPrice: { $avg: '$discountedPrice' }
                    }
                }
            ]);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                overallStats: stats[0] || {
                    totalPlans: 0,
                    activePlans: 0,
                    inactivePlans: 0,
                    totalPurchases: 0,
                    avgPrice: 0
                },
                categoryStats,
                durationStats
            });

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while fetching subscription statistics';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};