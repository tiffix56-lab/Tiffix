import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateSetTodayMeal, ValidateDateRangeQuery, ValidateUpdateDailyMeal } from '../../service/validationService.js';
import DailyMeal from '../../models/dailyMeal.model.js';
import Subscription from '../../models/subscription.model.js';
import UserSubscription from '../../models/userSubscription.model.js';
import Order from '../../models/order.model.js';
import Menu from '../../models/menu.model.js';
import TimezoneUtil from '../../util/timezone.js';
import { EUserRole } from '../../constant/application.js';
import orderCreationService from '../../service/orderCreationService.js';

export default {
    setTodayMeal: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { body } = req;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { error, value } = validateJoiSchema(ValidateSetTodayMeal, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { subscriptionId, lunchMenuIds, dinnerMenuIds, notes } = value;

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Subscription')), req, 404);
            }

            const allMenuIds = [...lunchMenuIds, ...dinnerMenuIds];
            if (allMenuIds.length > 0) {

                const uniqueMenuIds = [...new Set(allMenuIds)];

                const validMenus = await Menu.find({
                    _id: { $in: uniqueMenuIds },
                    vendorCategory: subscription.category,
                    isActive: true,
                    isAvailable: true
                });
                console.log(validMenus.length, uniqueMenuIds.length);

                if (validMenus.length !== uniqueMenuIds.length) {
                    return httpError(next, new Error('Some menus are invalid or not available'), req, 400);
                }
            }

            const today = TimezoneUtil.startOfDay();
            const existingMeal = await DailyMeal.findBySubscriptionAndDate(subscriptionId, today);

            if (existingMeal) {
                return httpError(next, new Error(`Daily meal already set for this subscription on ${TimezoneUtil.format(today, 'date')}. Cannot set meal again for the same day.`), req, 400);
            }

            const newDailyMeal = new DailyMeal({
                subscriptionId,
                mealDate: today,
                selectedMenus: {
                    lunchMenus: lunchMenuIds,
                    dinnerMenus: dinnerMenuIds
                },
                vendorType: subscription.category,
                createdBy: userId,
                notes
            });

            await newDailyMeal.save();
            const dailyMeal = newDailyMeal;

            let orderCreationResult = null;
            try {
                orderCreationResult = await orderCreationService.createOrdersForDailyMeal(dailyMeal, userId);
            } catch (error) {
                console.error('❌ Error in order creation:', error);
            }

            const finalMeal = await DailyMeal.findById(dailyMeal._id)
                .populate('selectedMenus.lunchMenus selectedMenus.dinnerMenus')
                .populate('subscriptionId', 'planName category');

            const responseData = {
                dailyMeal: finalMeal,
                orderCreation: orderCreationResult
            };

            return httpResponse(req, res, 201, 'Daily meal created successfully. New meal set for this subscription and date.', responseData);

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    refreshTodayMealOrders: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const subscriptionId = req.params.subscriptionId || req.body.subscriptionId;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            if (!subscriptionId) {
                return httpError(next, new Error('Subscription ID is required'), req, 400);
            }

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Subscription')), req, 404);
            }

            const today = TimezoneUtil.startOfDay();
            const dailyMeal = await DailyMeal.findBySubscriptionAndDate(subscriptionId, today);

            if (!dailyMeal) {
                return httpError(next, new Error('Daily meal not found for today. Please set the meal first.'), req, 404);
            }

            let orderCreationResult = null;
            try {
                orderCreationResult = await orderCreationService.createOrdersForDailyMeal(dailyMeal, userId);
            } catch (error) {
                console.error('❌ Error in order creation:', error);
                return httpError(next, new Error('Error syncing orders: ' + error.message), req, 500);
            }

            return httpResponse(req, res, 200, 'Orders synced successfully.', orderCreationResult);

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getMeals: async (req, res, next) => {
        try {
            const {
                startDate,
                endDate,
                vendorType,
                subscriptionId,
                isActive = true,
                page = 1,
                limit = 50,
                sortBy = 'mealDate',
                sortOrder = 'desc'
            } = req.query;

            const query = { isActive };
            if (startDate && endDate) {
                // Date range query
                query.mealDate = {
                    $gte: TimezoneUtil.startOfDay(startDate),
                    $lte: TimezoneUtil.endOfDay(endDate)
                };
            } else if (startDate) {
                query.mealDate = { $gte: TimezoneUtil.startOfDay(startDate) };
            } else if (endDate) {
                query.mealDate = { $lte: TimezoneUtil.endOfDay(endDate) };
            } else {
                const today = TimezoneUtil.startOfDay();
                const tomorrow = TimezoneUtil.addDays(1, today);
                query.mealDate = {
                    $gte: today,
                    $lt: tomorrow
                };
            }

            if (vendorType) {
                query.vendorType = vendorType;
            }

            if (subscriptionId) {
                query.subscriptionId = subscriptionId;
            }

            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const meals = await DailyMeal.find(query)
                .populate('subscriptionId', 'planName category')
                .populate('selectedMenus.lunchMenus selectedMenus.dinnerMenus')
                .populate('createdBy lastModifiedBy', 'name emailAddress')
                .sort(sortObj)
                .limit(parseInt(limit))
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            // Get active subscriber count for each meal's subscription
            const mealsWithCounts = await Promise.all(meals.map(async (meal) => {
                let activeSubscribersCount = 0;
                let ordersCreatedCount = 0;

                if (meal.subscriptionId && meal.subscriptionId._id) {
                    activeSubscribersCount = await UserSubscription.countDocuments({
                        subscriptionId: meal.subscriptionId._id,
                        status: 'active',
                        endDate: { $gte: TimezoneUtil.now() }
                    });
                }

                ordersCreatedCount = await Order.countDocuments({
                    dailyMealId: meal._id,
                    status: { $nin: ['cancelled', 'skipped'] }
                });

                return {
                    ...meal.toObject(),
                    activeSubscribersCount,
                    ordersCreatedCount
                };
            }));

            const total = await DailyMeal.countDocuments(query);

            const isToday = !startDate && !endDate;
            const isDateRange = startDate || endDate;

            const responseData = {
                meals: mealsWithCounts,
                total,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    vendorType,
                    subscriptionId,
                    isActive,
                    sortBy,
                    sortOrder
                }
            };

            // Add date information based on query type
            if (isToday) {
                responseData.queryType = 'today';
                responseData.date = TimezoneUtil.format(TimezoneUtil.now(), 'date');
            } else if (isDateRange) {
                responseData.queryType = 'dateRange';
                responseData.dateRange = {
                    startDate: startDate ? TimezoneUtil.format(startDate, 'date') : null,
                    endDate: endDate ? TimezoneUtil.format(endDate, 'date') : null
                };
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, responseData);

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },


    getAvailableMenusForSubscription: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Subscription')), req, 404);
            }

            const availableMenus = await Menu.find({
                vendorCategory: subscription.category,
                isActive: true,
                isAvailable: true
            }).sort({ 'rating.average': -1, foodTitle: 1 });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscription: {
                    id: subscription._id,
                    planName: subscription.planName,
                    category: subscription.category
                },
                menus: availableMenus,
                total: availableMenus.length
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getOrderCreationLogs: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { page = 1, limit = 20, status, subscriptionId, startDate, endDate } = req.query;

            const result = await orderCreationService.getOrderCreationLogs({
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                subscriptionId,
                startDate,
                endDate
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, result);

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    retryFailedOrder: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { logId, failedOrderIndex } = req.params;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const result = await orderCreationService.retryFailedOrder(
                logId,
                parseInt(failedOrderIndex),
                userId
            );

            if (result.success) {
                httpResponse(req, res, 200, responseMessage.SUCCESS, { message: result.message });
            } else {
                return httpError(next, new Error(result.message), req, 400);
            }

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    createManualOrder: async (req, res, next) => {
        try {
            const { userId, role } = req.authenticatedUser;
            const { body } = req;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            // This will be implemented to manually create orders for failed cases
            // For now, just return success
            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Manual order creation feature coming soon'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};