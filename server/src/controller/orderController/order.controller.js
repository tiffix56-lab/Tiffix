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

            const { status, search, startDate, endDate, page = 1, limit = 20, days } = value;

            const query = { userId };

            if (status) {
                query.status = status;
            }

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

            let orders;
            if (search) {
                orders = await Order.aggregate([
                    { $match: query },
                    {
                        $lookup: {
                            from: 'menus',
                            localField: 'selectedMenus',
                            foreignField: '_id',
                            as: 'selectedMenus'
                        }
                    },
                    {
                        $lookup: {
                            from: 'vendorprofiles',
                            localField: 'vendorDetails.vendorId',
                            foreignField: '_id',
                            as: 'vendorDetails.vendorId'
                        }
                    },
                    {
                        $lookup: {
                            from: 'usersubscriptions',
                            localField: 'userSubscriptionId',
                            foreignField: '_id',
                            as: 'userSubscriptionId'
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { orderNumber: { $regex: search, $options: 'i' } },
                                { specialInstructions: { $regex: search, $options: 'i' } },
                                { 'skipDetails.skipReason': { $regex: search, $options: 'i' } },
                                { 'cancellationDetails.cancelReason': { $regex: search, $options: 'i' } },
                                { 'deliveryConfirmation.deliveryNotes': { $regex: search, $options: 'i' } },
                                { 'selectedMenus.foodTitle': { $regex: search, $options: 'i' } },
                                { 'vendorDetails.vendorId.businessInfo.businessName': { $regex: search, $options: 'i' } }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            'vendorDetails.vendorId': { $arrayElemAt: ['$vendorDetails.vendorId', 0] },
                            userSubscriptionId: { $arrayElemAt: ['$userSubscriptionId', 0] }
                        }
                    },
                    { $sort: { deliveryDate: -1, deliveryTime: -1 } },
                    { $skip: (parseInt(page) - 1) * parseInt(limit) },
                    { $limit: parseInt(limit) }
                ])
            } else {
                orders = await Order.find(query)
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
            }

            const total = await Order.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                orders,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { status, search, startDate, endDate, days }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
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

            const now = TimezoneUtil.now();
            const deliveryDateTime = TimezoneUtil.parseTimeString(order.deliveryTime, order.deliveryDate);
            const timeDifference = deliveryDateTime.getTime() - now.getTime();
            const hoursUntilDelivery = timeDifference / (1000 * 60 * 60);

            if (hoursUntilDelivery < 2) {
                return httpError(next, new Error(`Cannot skip ${order.mealType} order. Must skip at least 2 hours before delivery time (${order.deliveryTime})`), req, 400);
            }

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
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
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

            // Check if order can be cancelled (2 hours before delivery )
            const now = TimezoneUtil.now();
            const deliveryDateTime = TimezoneUtil.parseTimeString(order.deliveryTime, order.deliveryDate);
            const timeDifference = deliveryDateTime.getTime() - now.getTime();
            const hoursUntilDelivery = timeDifference / (1000 * 60 * 60);

            if (hoursUntilDelivery < 2) {
                return httpError(next, new Error(`Cannot cancel ${order.mealType} order. Must cancel at least 2 hours before delivery time (${order.deliveryTime})`), req, 400);
            }

            if (order.status !== EOrderStatus.UPCOMING) {
                return httpError(next, new Error(`Cannot cancel order with status: ${order.status}`), req, 400);
            }

            await order.cancelOrder(cancelReason, userId);

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
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
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

            const { status, search, startDate, endDate, page = 1, limit = 20, days } = value;

            const query = { 'vendorDetails.vendorId': vendorProfile._id };

            if (status) {
                query.status = status;
            }

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

            let orders;
            if (search) {
                orders = await Order.aggregate([
                    { $match: query },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userId'
                        }
                    },
                    {
                        $lookup: {
                            from: 'menus',
                            localField: 'selectedMenus',
                            foreignField: '_id',
                            as: 'selectedMenus'
                        }
                    },
                    {
                        $lookup: {
                            from: 'usersubscriptions',
                            localField: 'userSubscriptionId',
                            foreignField: '_id',
                            as: 'userSubscriptionId'
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { orderNumber: { $regex: search, $options: 'i' } },
                                { specialInstructions: { $regex: search, $options: 'i' } },
                                { 'skipDetails.skipReason': { $regex: search, $options: 'i' } },
                                { 'cancellationDetails.cancelReason': { $regex: search, $options: 'i' } },
                                { 'deliveryConfirmation.deliveryNotes': { $regex: search, $options: 'i' } },
                                { 'selectedMenus.foodTitle': { $regex: search, $options: 'i' } },
                                { 'userId.name': { $regex: search, $options: 'i' } }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            userId: { $arrayElemAt: ['$userId', 0] },
                            userSubscriptionId: { $arrayElemAt: ['$userSubscriptionId', 0] }
                        }
                    },
                    { $sort: { deliveryDate: 1, deliveryTime: 1 } },
                    { $skip: (parseInt(page) - 1) * parseInt(limit) },
                    { $limit: parseInt(limit) }
                ])
            } else {
                orders = await Order.find(query)
                    .populate('userId', 'name phoneNumber')
                    .populate('selectedMenus', 'foodTitle foodImage')
                    .populate('userSubscriptionId', 'deliveryAddress')
                    .sort({ deliveryDate: 1, deliveryTime: 1 })
                    .limit(parseInt(limit))
                    .skip((parseInt(page) - 1) * parseInt(limit));
            }

            const total = await Order.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                orders,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { status, search, startDate, endDate, days }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
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

            const finalStates = [EOrderStatus.SKIPPED, EOrderStatus.CANCELLED];
            if (finalStates.includes(order.status)) {
                return httpError(next, new Error(`Cannot update order status. Order is already ${order.status}.`), req, 400);
            }

            if (finalStates.includes(status)) {
                return httpError(next, new Error(`Cannot set order status to ${status}. Use skipOrder or cancelOrder endpoints instead.`), req, 400);
            }

            const statusProgression = {
                [EOrderStatus.UPCOMING]: [EOrderStatus.PREPARING],
                [EOrderStatus.PREPARING]: [EOrderStatus.OUT_FOR_DELIVERY],
                [EOrderStatus.OUT_FOR_DELIVERY]: [EOrderStatus.DELIVERED],
                [EOrderStatus.DELIVERED]: []
            };

            if (order.status !== status) {
                const allowedNextStates = statusProgression[order.status] || [];
                if (!allowedNextStates.includes(status)) {
                    return httpError(next, new Error(`Invalid status transition from ${order.status} to ${status}. Allowed transitions: ${allowedNextStates.join(', ') || 'none'}.`), req, 400);
                }
            }

            if (role === EUserRole.VENDOR) {
                const vendorProfile = await VendorProfile.findOne({ userId });
                if (!vendorProfile || order.vendorDetails.vendorId.toString() !== vendorProfile._id.toString()) {
                    return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
                }

                if (status === EOrderStatus.DELIVERED) {
                    return httpError(next, new Error('Vendors cannot mark orders as delivered. Only admin can confirm delivery through the confirm-delivery endpoint.'), req, 403);
                }

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
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
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

            const { status, search, startDate, endDate, page = 1, limit = 20, days, vendorId } = value;

            const query = {};

            if (status) {
                query.status = status;
            }

            if (vendorId) {
                query['vendorDetails.vendorId'] = vendorId;
            }

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

            let orders;
            if (search) {
                orders = await Order.aggregate([
                    { $match: query },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userId'
                        }
                    },
                    {
                        $lookup: {
                            from: 'menus',
                            localField: 'selectedMenus',
                            foreignField: '_id',
                            as: 'selectedMenus'
                        }
                    },
                    {
                        $lookup: {
                            from: 'vendorprofiles',
                            localField: 'vendorDetails.vendorId',
                            foreignField: '_id',
                            as: 'vendorDetails.vendorId'
                        }
                    },
                    {
                        $lookup: {
                            from: 'usersubscriptions',
                            localField: 'userSubscriptionId',
                            foreignField: '_id',
                            as: 'userSubscriptionId'
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { orderNumber: { $regex: search, $options: 'i' } },
                                { specialInstructions: { $regex: search, $options: 'i' } },
                                { 'skipDetails.skipReason': { $regex: search, $options: 'i' } },
                                { 'cancellationDetails.cancelReason': { $regex: search, $options: 'i' } },
                                { 'deliveryConfirmation.deliveryNotes': { $regex: search, $options: 'i' } },
                                { 'selectedMenus.foodTitle': { $regex: search, $options: 'i' } },
                                { 'userId.name': { $regex: search, $options: 'i' } },
                                { 'userId.emailAddress': { $regex: search, $options: 'i' } },
                                { 'vendorDetails.vendorId.businessInfo.businessName': { $regex: search, $options: 'i' } }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            userId: { $arrayElemAt: ['$userId', 0] },
                            'vendorDetails.vendorId': { $arrayElemAt: ['$vendorDetails.vendorId', 0] },
                            userSubscriptionId: { $arrayElemAt: ['$userSubscriptionId', 0] }
                        }
                    },
                    { $sort: { deliveryDate: -1, createdAt: -1 } },
                    { $skip: (parseInt(page) - 1) * parseInt(limit) },
                    { $limit: parseInt(limit) }
                ])
            } else {
                orders = await Order.find(query)
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
            }

            const total = await Order.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                orders,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { status, search, startDate, endDate, days, vendorId }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
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
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
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
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};