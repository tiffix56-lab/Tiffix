import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateReview, ValidateUpdateReview, ValidateReviewQuery } from '../../service/validationService.js';
import Review, { EReviewType, EReviewStatus } from '../../models/review.model.js';
import Order, { EOrderStatus } from '../../models/order.model.js';
import UserSubscription from '../../models/userSubscription.model.js';
import VendorProfile from '../../models/vendorProfile.model.js';
import Subscription from '../../models/subscription.model.js';
import TimezoneUtil from '../../util/timezone.js';
import { EUserRole } from '../../constant/application.js';

export default {
    // ############### USER CONTROLLERS ###############

    createReview: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { body } = req;

            if (role !== EUserRole.USER) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateCreateReview, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                reviewType,
                subscriptionId,
                vendorId,
                orderId,
                rating,
                reviewText
            } = value;

            // Validate user can review this item
            let canReview = false;
            let targetItem = null;

            if (reviewType === EReviewType.SUBSCRIPTION) {
                const userSubscription = await UserSubscription.findOne({
                    userId,
                    subscriptionId,
                    status: 'active'
                });

                if (!userSubscription) {
                    return httpError(next, new Error('You can only review subscriptions you have purchased'), req, 403);
                }

                targetItem = await Subscription.findById(subscriptionId);
                canReview = true;

            } else if (reviewType === EReviewType.VENDOR) {
                const userSubscription = await UserSubscription.findOne({
                    userId,
                    'vendorDetails.currentVendor.vendorId': vendorId,
                    status: 'active'
                });

                if (!userSubscription) {
                    return httpError(next, new Error('You can only review vendors you have been assigned'), req, 403);
                }

                targetItem = await VendorProfile.findById(vendorId);
                canReview = true;

            } else if (reviewType === EReviewType.ORDER) {
                const order = await Order.findOne({
                    _id: orderId,
                    userId,
                    status: EOrderStatus.DELIVERED
                });

                if (!order) {
                    return httpError(next, new Error('You can only review orders that have been delivered to you'), req, 403);
                }

                targetItem = order;
                canReview = true;
            }

            if (!canReview || !targetItem) {
                return httpError(next, new Error('Invalid review target'), req, 400);
            }

            const existingReview = await Review.findOne({
                userId,
                reviewType,
                ...(subscriptionId && { subscriptionId }),
                ...(vendorId && { vendorId }),
                ...(orderId && { orderId })
            });

            if (existingReview) {
                return httpError(next, new Error('You have already reviewed this item'), req, 409);
            }

            const newReview = new Review({
                reviewType,
                userId,
                subscriptionId,
                vendorId,
                orderId,
                rating,
                reviewText,
                isVerifiedPurchase: true
            });

            await newReview.save();

            const populatedReview = await Review.findById(newReview._id)
                .populate('userId', 'name')
                .populate('subscriptionId', 'planName category')
                .populate('vendorId', 'businessInfo.businessName')
                .populate('orderId', 'orderNumber mealType');

            httpResponse(req, res, 201, responseMessage.CREATED, {
                review: populatedReview,
                message: 'Review created successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error while creating review';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getUserReviews: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;

            if (role !== EUserRole.USER) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { reviewType, page = 1, limit = 20 } = req.query;

            const reviews = await Review.findByUser(userId, {
                reviewType,
                limit: parseInt(limit),
                page: parseInt(page)
            });

            const total = await Review.countDocuments({
                userId,
                ...(reviewType && { reviewType }),
                status: EReviewStatus.ACTIVE
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                reviews,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    updateReview: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { reviewId } = req.params;
            const { body } = req;

            if (role !== EUserRole.USER) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateUpdateReview, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const review = await Review.findById(reviewId);
            if (!review) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Review')), req, 404);
            }

            if (review.userId.toString() !== userId.toString()) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            if (!review.canEdit(userId)) {
                return httpError(next, new Error('Reviews can only be edited within 24 hours of creation'), req, 400);
            }

            const { rating, reviewText } = value;

            review.rating = rating || review.rating;
            review.reviewText = reviewText || review.reviewText;

            await review.save();

            const updatedReview = await Review.findById(reviewId)
                .populate('userId', 'name')
                .populate('subscriptionId', 'planName category')
                .populate('vendorId', 'businessInfo.businessName')
                .populate('orderId', 'orderNumber mealType');

            httpResponse(req, res, 200, responseMessage.UPDATED, {
                review: updatedReview
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    deleteReview: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { reviewId } = req.params;

            if (role !== EUserRole.USER) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const review = await Review.findById(reviewId);
            if (!review) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Review')), req, 404);
            }

            if (review.userId.toString() !== userId.toString()) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            if (!review.canEdit(userId)) {
                return httpError(next, new Error('Reviews can only be deleted within 24 hours of creation'), req, 400);
            }

            await Review.findByIdAndDelete(reviewId);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Review deleted successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },


    // ############### VENDOR CONTROLLERS ###############

    getVendorReviews: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;

            if (role !== EUserRole.VENDOR) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const vendorProfile = await VendorProfile.findOne({ userId });
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            const { page = 1, limit = 20, minRating, maxRating } = req.query;

            const reviews = await Review.findForVendor(vendorProfile._id, {
                limit: parseInt(limit),
                page: parseInt(page),
                minRating: minRating ? parseInt(minRating) : null,
                maxRating: maxRating ? parseInt(maxRating) : null
            });

            const total = await Review.countDocuments({
                vendorId: vendorProfile._id,
                reviewType: EReviewType.VENDOR,
                status: EReviewStatus.ACTIVE
            });

            const averageStats = await Review.getAverageRating(vendorProfile._id, EReviewType.VENDOR);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                reviews,
                stats: averageStats[0] || { averageRating: 0, totalReviews: 0 },
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },


    // ############### ADMIN CONTROLLERS ###############

    getAllReviews: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const {
                reviewType,
                status = EReviewStatus.ACTIVE,
                page = 1,
                limit = 20,
                minRating,
                maxRating,
                startDate,
                endDate
            } = req.query;

            const query = { status };

            if (reviewType) query.reviewType = reviewType;
            if (minRating) query.rating = { $gte: parseInt(minRating) };
            if (maxRating) query.rating = { ...query.rating, $lte: parseInt(maxRating) };

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = TimezoneUtil.startOfDay(new Date(startDate));
                if (endDate) query.createdAt.$lte = TimezoneUtil.endOfDay(new Date(endDate));
            }

            const reviews = await Review.find(query)
                .populate('userId', 'name emailAddress')
                .populate('subscriptionId', 'planName category')
                .populate('vendorId', 'businessInfo.businessName')
                .populate('orderId', 'orderNumber mealType deliveryDate')
                .populate('moderatedBy', 'name')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Review.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                reviews,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { reviewType, status, minRating, maxRating, startDate, endDate }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    moderateReview: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { reviewId } = req.params;
            const { status } = req.body;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            if (!Object.values(EReviewStatus).includes(status)) {
                return httpError(next, new Error('Invalid review status'), req, 400);
            }

            const review = await Review.findById(reviewId);
            if (!review) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Review')), req, 404);
            }

            await review.moderate(status, userId);

            const updatedReview = await Review.findById(reviewId)
                .populate('userId', 'name');

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                review: updatedReview,
                message: 'Review moderated successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getReviewStats: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { startDate, endDate } = req.query;

            const start = startDate ? TimezoneUtil.startOfDay(new Date(startDate)) : TimezoneUtil.startOfDay(TimezoneUtil.addDays(-30, TimezoneUtil.now()));
            const end = endDate ? TimezoneUtil.endOfDay(new Date(endDate)) : TimezoneUtil.endOfDay(TimezoneUtil.now());

            const stats = await Review.getReviewStats(start, end);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                stats,
                dateRange: {
                    startDate: TimezoneUtil.format(start, 'date'),
                    endDate: TimezoneUtil.format(end, 'date')
                }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // ############### PUBLIC CONTROLLERS ###############

    getSubscriptionReviews: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;
            const { page = 1, limit = 20, sortBy = 'createdAt' } = req.query;

            const reviews = await Review.findForSubscription(subscriptionId, {
                limit: parseInt(limit),
                page: parseInt(page),
                sortBy
            });

            const total = await Review.countDocuments({
                subscriptionId,
                reviewType: EReviewType.SUBSCRIPTION,
                status: EReviewStatus.ACTIVE
            });

            const averageStats = await Review.getAverageRating(subscriptionId, EReviewType.SUBSCRIPTION);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                reviews,
                stats: averageStats[0] || { averageRating: 0, totalReviews: 0 },
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getPublicVendorReviews: async (req, res, next) => {
        try {
            const { vendorId } = req.params;
            const { page = 1, limit = 20, minRating, maxRating } = req.query;

            const reviews = await Review.findForVendor(vendorId, {
                limit: parseInt(limit),
                page: parseInt(page),
                minRating: minRating ? parseInt(minRating) : null,
                maxRating: maxRating ? parseInt(maxRating) : null
            });

            const total = await Review.countDocuments({
                vendorId,
                reviewType: EReviewType.VENDOR,
                status: EReviewStatus.ACTIVE
            });

            const averageStats = await Review.getAverageRating(vendorId, EReviewType.VENDOR);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                reviews,
                stats: averageStats[0] || { averageRating: 0, totalReviews: 0 },
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getOrderReview: async (req, res, next) => {
        try {
            const { orderId } = req.params;

            const review = await Review.findForOrder(orderId);

            if (!review) {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    review: null,
                    message: 'No review found for this order'
                });
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                review
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};