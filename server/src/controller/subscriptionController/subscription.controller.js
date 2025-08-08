import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateSubscription, ValidateUpdateSubscription, ValidateSubscriptionQuery } from '../../service/validationService.js';
import Subscription from '../../models/subscription.model.js';

export default {
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

            if (category) filter.category = category;
            if (duration) filter.duration = duration;
            if (minPrice || maxPrice) {
                filter.discountedPrice = {};
                if (minPrice) filter.discountedPrice.$gte = parseFloat(minPrice);
                if (maxPrice) filter.discountedPrice.$lte = parseFloat(maxPrice);
            }
            if (isActive !== undefined) filter.isActive = isActive === 'true';

            if (search) {
                filter.$or = [
                    { planName: { $regex: search, $options: 'i' } },
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

    updateSubscription: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateUpdateSubscription, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            // Get the existing subscription first
            const existingSubscription = await Subscription.findById(id);
            if (!existingSubscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            // Additional validation for price relationship if both prices are being updated
            if (value.originalPrice !== undefined || value.discountedPrice !== undefined) {
                const finalOriginalPrice = value.originalPrice !== undefined ? value.originalPrice : existingSubscription.originalPrice;
                const finalDiscountedPrice = value.discountedPrice !== undefined ? value.discountedPrice : existingSubscription.discountedPrice;

                if (finalDiscountedPrice > finalOriginalPrice) {
                    return httpError(next, new Error('Discounted price cannot be greater than original price'), req, 422);
                }
            }

            const updatedSubscription = await Subscription.findByIdAndUpdate(id, value, {
                new: true,
                runValidators: false // We'll handle validation manually above
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, { subscription: updatedSubscription });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    deleteSubscription: async (req, res, next) => {
        try {
            const { id } = req.params;

            const deletedSubscription = await Subscription.findByIdAndDelete(id);
            if (!deletedSubscription) {
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Subscription deleted successfully' });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

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

};