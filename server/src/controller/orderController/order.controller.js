import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateSkipOrder, ValidateCancelOrder, ValidateUpdateOrderStatus, ValidateConfirmDelivery, ValidateOrderQuery } from '../../service/validationService.js';
import Order, { EOrderStatus } from '../../models/order.model.js';
import UserSubscription from '../../models/userSubscription.model.js';
import VendorProfile from '../../models/vendorProfile.model.js';
import TimezoneUtil from '../../util/timezone.js';
import { EUserRole } from '../../constant/application.js';

export default {
    // ############### USER CONTROLLERS ###############
    
    getUserOrders: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            
            // Only users can access this endpoint
            if (role !== EUserRole.USER) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateOrderQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { status, startDate, endDate, page = 1, limit = 20, days } = value;

            // Build query
            const query = { userId };
            
            if (status) {
                query.status = status;
            }
            
            // Handle date filters
            if (startDate && endDate) {
                query.deliveryDate = {
                    $gte: TimezoneUtil.startOfDay(startDate),
                    $lte: TimezoneUtil.endOfDay(endDate)
                };
            } else if (startDate) {
                query.deliveryDate = { $gte: TimezoneUtil.startOfDay(startDate) };
            } else if (endDate) {
                query.deliveryDate = { $lte: TimezoneUtil.endOfDay(endDate) };
            } else if (days) {
                // Get orders for next X days from today
                const today = TimezoneUtil.startOfDay();
                const futureDate = TimezoneUtil.addDays(days, today);
                query.deliveryDate = {
                    $gte: today,
                    $lte: futureDate
                };
            }

            const orders = await Order.find(query)
                .populate('selectedMenus', 'foodTitle foodImage price')
                .populate('vendorDetails.vendorId', 'businessInfo.businessName')
                .populate('userSubscriptionId', 'subscriptionId mealTiming skipCreditAvailable')
                .populate({
                    path: 'userSubscriptionId',
                    populate: {
                        path: 'subscriptionId',
                        select: 'planName category'
                    }
                })
                .sort({ deliveryDate: -1, deliveryTime: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Order.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                orders,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { status, startDate, endDate, days }
            });

        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    skipOrder: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { orderId } = req.params;
            const { body } = req;

            if (role !== EUserRole.USER) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateSkipOrder, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { skipReason } = value;

            const order = await Order.findById(orderId);
            if (!order) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Order')), req, 404);
            }

            if (order.userId.toString() !== userId.toString()) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            // Check if order can be skipped (2 hours before delivery)
            const now = TimezoneUtil.now();
            const deliveryDateTime = TimezoneUtil.parseTimeString(order.deliveryTime, order.deliveryDate);
            const timeDifference = deliveryDateTime.getTime() - now.getTime();
            const hoursUntilDelivery = timeDifference / (1000 * 60 * 60);

            if (hoursUntilDelivery < 2) {
                return httpError(next, new Error(`Cannot skip ${order.mealType} order. Must skip at least 2 hours before delivery time (${order.deliveryTime})`), req, 400);
            }

            // Check if order status allows skipping
            if (order.status !== EOrderStatus.UPCOMING) {
                return httpError(next, new Error(`Cannot skip order with status: ${order.status}`), req, 400);
            }

            const userSubscription = await UserSubscription.findById(order.userSubscriptionId);
            if (!userSubscription.canSkipMeal()) {
                return httpError(next, new Error('No skip credits available'), req, 400);
            }

            await order.skipOrder(skipReason, userId);
            await userSubscription.skipMeal();

            const updatedOrder = await Order.findById(orderId).populate('selectedMenus', 'foodTitle');

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                order: updatedOrder,
                skipInfo: userSubscription.getSkipInfo(),
                message: `${order.mealType} order skipped successfully. Credits refunded.`
            });

        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    cancelOrder: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { orderId } = req.params;
            const { body } = req;

            if (role !== EUserRole.USER) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateCancelOrder, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { cancelReason } = value;

            const order = await Order.findById(orderId);
            if (!order) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Order')), req, 404);
            }

            if (order.userId.toString() !== userId.toString()) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            // Check if order can be cancelled (2 hours before delivery for consistency)
            const now = TimezoneUtil.now();
            const deliveryDateTime = TimezoneUtil.parseTimeString(order.deliveryTime, order.deliveryDate);
            const timeDifference = deliveryDateTime.getTime() - now.getTime();
            const hoursUntilDelivery = timeDifference / (1000 * 60 * 60);

            if (hoursUntilDelivery < 2) {
                return httpError(next, new Error(`Cannot cancel ${order.mealType} order. Must cancel at least 2 hours before delivery time (${order.deliveryTime})`), req, 400);
            }

            // Check if order status allows cancelling
            if (order.status !== EOrderStatus.UPCOMING) {
                return httpError(next, new Error(`Cannot cancel order with status: ${order.status}`), req, 400);
            }

            await order.cancelOrder(cancelReason, userId);

            // Deduct credits for cancellation (no refund)
            const userSubscription = await UserSubscription.findById(order.userSubscriptionId);
            if (userSubscription.canUseCredits(1)) {
                await userSubscription.useCredits(1);
            }

            const updatedOrder = await Order.findById(orderId).populate('selectedMenus', 'foodTitle');

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                order: updatedOrder,
                message: `${order.mealType} order cancelled. Credits have been deducted (no refund).`
            });

        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // ############### VENDOR CONTROLLERS ###############

    getVendorOrders: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;

            if (role !== EUserRole.VENDOR) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const vendorProfile = await VendorProfile.findOne({ userId });
            if (!vendorProfile) {
                return httpError(next, new Error('Vendor profile not found'), req, 404);
            }

            const { error, value } = validateJoiSchema(ValidateOrderQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { status, startDate, endDate, page = 1, limit = 20, days } = value;

            // Build query for vendor orders
            const query = { 'vendorDetails.vendorId': vendorProfile._id };
            
            if (status) {
                query.status = status;
            }
            
            // Handle date filters
            if (startDate && endDate) {
                query.deliveryDate = {
                    $gte: TimezoneUtil.startOfDay(startDate),
                    $lte: TimezoneUtil.endOfDay(endDate)
                };
            } else if (startDate) {
                query.deliveryDate = { $gte: TimezoneUtil.startOfDay(startDate) };
            } else if (endDate) {
                query.deliveryDate = { $lte: TimezoneUtil.endOfDay(endDate) };
            } else if (days) {
                const today = TimezoneUtil.startOfDay();
                const futureDate = TimezoneUtil.addDays(days, today);
                query.deliveryDate = {
                    $gte: today,
                    $lte: futureDate
                };
            }

            const orders = await Order.find(query)
                .populate('userId', 'name phoneNumber')
                .populate('selectedMenus', 'foodTitle foodImage')
                .populate('userSubscriptionId', 'deliveryAddress')
                .sort({ deliveryDate: 1, deliveryTime: 1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Order.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                orders,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { status, startDate, endDate, days }
            });

        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    updateOrderStatus: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { orderId } = req.params;
            const { body } = req;

            if (role !== EUserRole.VENDOR && role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateUpdateOrderStatus, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { status, notes } = value;

            const order = await Order.findById(orderId);
            if (!order) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Order')), req, 404);
            }

            // Vendors can only update their own orders
            if (role === EUserRole.VENDOR) {
                const vendorProfile = await VendorProfile.findOne({ userId });
                if (!vendorProfile || order.vendorDetails.vendorId.toString() !== vendorProfile._id.toString()) {
                    return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
                }
                
                // Vendors cannot mark order as delivered - only admin can confirm delivery
                if (status === EOrderStatus.DELIVERED) {
                    return httpError(next, new Error('Vendors cannot mark orders as delivered. Only admin can confirm delivery through the confirm-delivery endpoint.'), req, 403);
                }
                
                // Vendors can only set specific statuses
                const allowedVendorStatuses = [EOrderStatus.PREPARING, EOrderStatus.OUT_FOR_DELIVERY];
                if (!allowedVendorStatuses.includes(status)) {
                    return httpError(next, new Error(`Vendors can only set status to: ${allowedVendorStatuses.join(', ')}`), req, 403);
                }
            }

            await order.updateStatus(status, userId, notes);

            const updatedOrder = await Order.findById(orderId)
                .populate('selectedMenus', 'foodTitle')
                .populate('vendorDetails.vendorId', 'businessInfo.businessName');

            httpResponse(req, res, 200, responseMessage.SUCCESS, { order: updatedOrder });

        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // ############### ADMIN CONTROLLERS ###############

    getAdminOrders: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateOrderQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { status, startDate, endDate, page = 1, limit = 20, days, vendorId } = value;

            // Build query
            const query = {};
            
            if (status) {
                query.status = status;
            }

            if (vendorId) {
                query['vendorDetails.vendorId'] = vendorId;
            }
            
            // Handle date filters
            if (startDate && endDate) {
                query.deliveryDate = {
                    $gte: TimezoneUtil.startOfDay(startDate),
                    $lte: TimezoneUtil.endOfDay(endDate)
                };
            } else if (startDate) {
                query.deliveryDate = { $gte: TimezoneUtil.startOfDay(startDate) };
            } else if (endDate) {
                query.deliveryDate = { $lte: TimezoneUtil.endOfDay(endDate) };
            } else if (days) {
                const today = TimezoneUtil.startOfDay();
                const futureDate = TimezoneUtil.addDays(days, today);
                query.deliveryDate = {
                    $gte: today,
                    $lte: futureDate
                };
            }

            const orders = await Order.find(query)
                .populate('userId', 'name phoneNumber emailAddress')
                .populate('selectedMenus', 'foodTitle')
                .populate('vendorDetails.vendorId', 'businessInfo.businessName')
                .populate('userSubscriptionId', 'subscriptionId')
                .populate({
                    path: 'userSubscriptionId',
                    populate: {
                        path: 'subscriptionId',
                        select: 'planName category'
                    }
                })
                .sort({ deliveryDate: -1, createdAt: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Order.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                orders,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { status, startDate, endDate, days, vendorId }
            });

        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    confirmDelivery: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { orderId } = req.params;
            const { body } = req;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateConfirmDelivery, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { notes, photos } = value;

            const order = await Order.findById(orderId);
            if (!order) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Order')), req, 404);
            }

            await order.confirmDelivery(userId, notes, photos);

            const updatedOrder = await Order.findById(orderId)
                .populate('selectedMenus', 'foodTitle')
                .populate('vendorDetails.vendorId', 'businessInfo.businessName');

            httpResponse(req, res, 200, responseMessage.SUCCESS, { order: updatedOrder });

        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // ############### COMMON CONTROLLERS ###############

    getOrderById: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { orderId } = req.params;

            const order = await Order.findById(orderId)
                .populate('selectedMenus', 'foodTitle foodImage price description detailedItemList')
                .populate('vendorDetails.vendorId', 'businessInfo.businessName businessInfo.address businessInfo.cuisineTypes')
                .populate('userSubscriptionId', 'subscriptionId mealTiming skipCreditAvailable')
                .populate({
                    path: 'userSubscriptionId',
                    populate: {
                        path: 'subscriptionId',
                        select: 'planName category description'
                    }
                })
                .populate('dailyMealId', 'mealDate notes');

            if (!order) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Order')), req, 404);
            }

            // Check authorization based on role
            if (role === EUserRole.USER) {
                if (order.userId.toString() !== userId.toString()) {
                    return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
                }
            } else if (role === EUserRole.VENDOR) {
                const vendorProfile = await VendorProfile.findOne({ userId });
                if (!vendorProfile || order.vendorDetails.vendorId.toString() !== vendorProfile._id.toString()) {
                    return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
                }
            }
            // Admin can view any order

            // Add additional info for users
            const orderWithInfo = {
                ...order.toJSON(),
                ...(role === EUserRole.USER && {
                    canSkip: order.canSkip(),
                    canCancel: order.canCancel(),
                    isToday: order.isToday(),
                    isPast: order.isPast(),
                    isFuture: order.isFuture(),
                    skipInfo: order.userSubscriptionId ? order.userSubscriptionId.getSkipInfo() : null
                })
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                order: orderWithInfo
            });

        } catch (err) {
            httpError(next, err, req, 500);
        }
    }
};