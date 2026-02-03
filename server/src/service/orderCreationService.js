import Order, { EOrderStatus } from '../models/order.model.js'
import UserSubscription from '../models/userSubscription.model.js'
import OrderCreationLog from '../models/orderCreationLog.model.js'
import TimezoneUtil from '../util/timezone.js'

class OrderCreationService {

    async createOrdersForDailyMeal(dailyMeal, adminUserId) {
        console.log(`🍽️ Starting order creation for daily meal: ${dailyMeal._id}`)

        // Create log entry
        const log = new OrderCreationLog({
            dailyMealId: dailyMeal._id,
            subscriptionId: dailyMeal.subscriptionId,
            triggerDate: TimezoneUtil.now(),
            triggeredBy: adminUserId,
            totalUsersFound: 0
        })
        await log.save()

        try {
            // Find all active user subscriptions for this subscription
            const activeUserSubscriptions = await UserSubscription.find({
                subscriptionId: dailyMeal.subscriptionId,
                status: 'active',
                startDate: { $lte: TimezoneUtil.endOfDay(dailyMeal.mealDate) },
                endDate: { $gte: TimezoneUtil.startOfDay(dailyMeal.mealDate) },
                'vendorDetails.isVendorAssigned': true,
                isExpired: false
            }).populate('userId', 'name emailAddress phoneNumber')

            log.totalUsersFound = activeUserSubscriptions.length
            await log.save()

            console.log(`📊 Found ${activeUserSubscriptions.length} active subscriptions`)

            if (activeUserSubscriptions.length === 0) {
                log.status = 'completed'
                log.completedAt = TimezoneUtil.now()
                await log.save()
                return {
                    success: true,
                    message: 'No active subscriptions found',
                    log: log
                }
            }

            // Process each user subscription
            for (const userSubscription of activeUserSubscriptions) {
                await this.createOrdersForUserSubscription(userSubscription, dailyMeal, log)
            }

            // Mark log as completed
            await log.markCompleted()

            console.log(`✅ Order creation completed. Success: ${log.totalOrdersCreated}, Failed: ${log.totalOrdersFailed}`)

            return {
                success: true,
                message: `Orders created successfully. ${log.totalOrdersCreated} successful, ${log.totalOrdersFailed} failed.`,
                log: await OrderCreationLog.findById(log._id).populate('failedOrders.userId', 'name emailAddress phoneNumber')
            }

        } catch (error) {
            console.error('❌ Error in order creation process:', error)
            log.status = 'failed'
            log.completedAt = TimezoneUtil.now()
            await log.save()

            throw error
        }
    }

    async createOrdersForUserSubscription(userSubscription, dailyMeal, log) {
        const userId = userSubscription.userId._id
        const userName = userSubscription.userId.name

        try {
            // Validate subscription is still active and has credits
            if (!userSubscription.isActive()) {
                await log.addFailedOrder(
                    userId,
                    userSubscription._id,
                    'lunch',
                    'SUBSCRIPTION_INACTIVE',
                    'Subscription is not active',
                    false
                )
                return
            }

            if (userSubscription.CheckisExpired()) {
                await log.addFailedOrder(
                    userId,
                    userSubscription._id,
                    'lunch',
                    'SUBSCRIPTION_EXPIRED',
                    'Subscription has expired',
                    false
                )
                return
            }

            // Check if user has sufficient credits for daily meals
            const dailyMealCount = userSubscription.getDailyMealCount()
            if (!userSubscription.canUseCredits(dailyMealCount)) {
                await log.addFailedOrder(
                    userId,
                    userSubscription._id,
                    'lunch',
                    'INSUFFICIENT_CREDITS',
                    `Credits available: ${userSubscription.getRemainingCredits()}, Required: ${dailyMealCount}`,
                    false
                )
                return
            }

            // Get enabled meal types for this user
            const enabledMealTypes = userSubscription.getMealTypes()

            for (const mealType of enabledMealTypes) {
                try {
                    await this.createSingleOrder(userSubscription, dailyMeal, mealType, log)
                } catch (error) {
                    await log.addFailedOrder(
                        userId,
                        userSubscription._id,
                        mealType,
                        'ORDER_CREATION_FAILED',
                        error.message,
                        true
                    )
                    console.error(`❌ Failed to create ${mealType} order for user ${userName}:`, error.message)
                }
            }

        } catch (error) {
            await log.addFailedOrder(
                userId,
                userSubscription._id,
                'lunch',
                'VALIDATION_ERROR',
                error.message,
                true
            )
            console.error(`❌ Error processing user subscription for ${userName}:`, error.message)
        }
    }

    async createSingleOrder(userSubscription, dailyMeal, mealType, log) {
        const userId = userSubscription.userId._id

        // Check if order already exists for this date and meal type
        const existingOrder = await Order.findOne({
            userId,
            userSubscriptionId: userSubscription._id,
            deliveryDate: {
                $gte: TimezoneUtil.startOfDay(dailyMeal.mealDate),
                $lt: TimezoneUtil.addDays(1, TimezoneUtil.startOfDay(dailyMeal.mealDate))
            },
            mealType: mealType,
            status: { $nin: [EOrderStatus.SKIPPED, EOrderStatus.CANCELLED] }
        })

        if (existingOrder) {
            await log.addFailedOrder(
                userId,
                userSubscription._id,
                mealType,
                'ORDER_ALREADY_EXISTS',
                `Order ${existingOrder.orderNumber} already exists`,
                false
            )
            return
        }

        // Get menus for this meal type
        let selectedMenus = []
        if (mealType === 'lunch' && dailyMeal.hasLunchMenus()) {
            selectedMenus = dailyMeal.selectedMenus.lunchMenus
        } else if (mealType === 'dinner' && dailyMeal.hasDinnerMenus()) {
            selectedMenus = dailyMeal.selectedMenus.dinnerMenus
        }

        if (selectedMenus.length === 0) {
            await log.addFailedOrder(
                userId,
                userSubscription._id,
                mealType,
                'NO_MENU_AVAILABLE',
                `No ${mealType} menu set for this date`,
                true
            )
            return
        }

        // Get delivery time from user subscription
        const deliveryTime = mealType === 'lunch'
            ? userSubscription.mealTiming.lunch.time
            : userSubscription.mealTiming.dinner.time

        // Create the order
        console.log(`🚀 Creating ${mealType} order for user ${userSubscription.userId.name}...`)

        const orderData = {
            userId,
            userSubscriptionId: userSubscription._id,
            dailyMealId: dailyMeal._id,
            orderDate: TimezoneUtil.now(),
            deliveryDate: dailyMeal.mealDate,
            mealType: mealType,
            selectedMenus: selectedMenus,
            deliveryTime: deliveryTime,
            deliveryAddress: userSubscription.deliveryAddress,
            vendorDetails: {
                vendorId: userSubscription.vendorDetails.currentVendor.vendorId,
                vendorType: userSubscription.vendorDetails.currentVendor.vendorType
            },
            status: EOrderStatus.UPCOMING
        }

        console.log('📋 Order data:', {
            userId: orderData.userId,
            mealType: orderData.mealType,
            orderDate: orderData.orderDate,
            deliveryDate: orderData.deliveryDate,
            deliveryTime: orderData.deliveryTime,
            selectedMenus: orderData.selectedMenus,
            vendorId: orderData.vendorDetails.vendorId
        })

        // Validate required fields before creating order
        if (!orderData.userId) throw new Error('userId is required')
        if (!orderData.userSubscriptionId) throw new Error('userSubscriptionId is required')
        if (!orderData.dailyMealId) throw new Error('dailyMealId is required')
        if (!orderData.orderDate) throw new Error('orderDate is required')
        if (!orderData.deliveryDate) throw new Error('deliveryDate is required')
        if (!orderData.mealType) throw new Error('mealType is required')
        if (!orderData.deliveryTime) throw new Error('deliveryTime is required')

        // Validate deliveryTime format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(orderData.deliveryTime)) {
            throw new Error(`deliveryTime must be in HH:MM format, got: ${orderData.deliveryTime}`)
        }
        if (!orderData.selectedMenus || orderData.selectedMenus.length === 0) throw new Error('selectedMenus is required')
        if (!orderData.vendorDetails?.vendorId) throw new Error('vendorDetails.vendorId is required')
        if (!orderData.deliveryAddress) throw new Error('deliveryAddress is required')

        // Validate deliveryAddress required fields
        if (!orderData.deliveryAddress.street) throw new Error('deliveryAddress.street is required')
        if (!orderData.deliveryAddress.city) throw new Error('deliveryAddress.city is required')
        if (!orderData.deliveryAddress.zipCode) throw new Error('deliveryAddress.zipCode is required')

        // Set default country if not provided
        if (!orderData.deliveryAddress.country) {
            orderData.deliveryAddress.country = 'India'
        }

        // Ensure coordinates exist with default values if not provided
        if (!orderData.deliveryAddress.coordinates) {
            orderData.deliveryAddress.coordinates = {
                type: 'Point',
                coordinates: [0, 0]
            }
        }

        const newOrder = new Order(orderData)
        await newOrder.save()
        console.log('✅ Order saved successfully with orderNumber:', newOrder.orderNumber)

        // Add to successful orders log
        await log.addSuccessfulOrder(
            userId,
            userSubscription._id,
            newOrder._id,
            mealType
        )

        console.log(`✅ Created ${mealType} order ${newOrder.orderNumber} for user ${userSubscription.userId.name}`)
    }

    async retryFailedOrder(logId, failedOrderIndex, adminUserId) {
        try {
            const log = await OrderCreationLog.findById(logId)
                .populate('dailyMealId')
                .populate('failedOrders.userId', 'name emailAddress phoneNumber')

            if (!log) {
                throw new Error('Order creation log not found')
            }

            if (failedOrderIndex >= log.failedOrders.length) {
                throw new Error('Invalid failed order index')
            }

            const failedOrder = log.failedOrders[failedOrderIndex]

            if (!failedOrder.canRetry) {
                throw new Error('This order cannot be retried')
            }

            // Get user subscription
            const userSubscription = await UserSubscription.findById(failedOrder.userSubscriptionId)
                .populate('userId', 'name emailAddress phoneNumber')

            if (!userSubscription) {
                throw new Error('User subscription not found')
            }

            // Try to create the order again
            await this.createSingleOrder(userSubscription, log.dailyMealId, failedOrder.mealType, log)

            // Remove from failed orders if successful
            log.failedOrders.splice(failedOrderIndex, 1)
            log.totalOrdersFailed -= 1
            await log.save()

            return {
                success: true,
                message: 'Order retry successful'
            }

        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async getOrderCreationLogs(options = {}) {
        const { page = 1, limit = 20, status, subscriptionId, startDate, endDate } = options

        const query = {}

        if (status) query.status = status
        if (subscriptionId) query.subscriptionId = subscriptionId
        if (startDate || endDate) {
            query.triggerDate = {}
            if (startDate) query.triggerDate.$gte = TimezoneUtil.startOfDay(startDate)
            if (endDate) query.triggerDate.$lte = TimezoneUtil.endOfDay(endDate)
        }

        const logs = await OrderCreationLog.find(query)
            .populate('subscriptionId', 'planName category')
            .populate('triggeredBy', 'name emailAddress')
            .populate('failedOrders.userId', 'name emailAddress phoneNumber')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const total = await OrderCreationLog.countDocuments(query)

        return {
            logs,
            pagination: {
                current: page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }
}

export default new OrderCreationService()