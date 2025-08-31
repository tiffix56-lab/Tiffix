import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import {
    validateJoiSchema,
    ValidateInitiatePurchase,
    ValidateVerifyPayment,
    ValidateUserSubscriptionQuery,
    ValidateCancelSubscription,
    ValidateVendorSwitchRequest
} from '../../service/validationService.js'
import Subscription from '../../models/subscription.model.js'
import Transaction from '../../models/transaction.model.js'
import UserSubscription from '../../models/userSubscription.model.js'
import LocationZone from '../../models/locationZone.model.js'
import paymentService from '../../service/paymentService.js'
import promoCodeService from '../../service/promoCodeService.js'
import TimezoneUtil from '../../util/timezone.js'
import VendorAssignmentRequest from '../../models/vendorSwitchRequest.model.js'


export default {
    // Initiate subscription purchase
    initiatePurchase: async (req, res, next) => {
        try {
            console.log('=== INITIATE PURCHASE START ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            console.log('User ID:', req.authenticatedUser?._id);
            
            const { error } = validateJoiSchema(ValidateInitiatePurchase, req.body);
            if (error) {
                console.log('❌ Validation error:', error.message || error);
                return httpError(next, error, req, 422);
            }
            console.log('✅ Validation passed');

            const {
                subscriptionId,
                promoCode,
                deliveryAddress,
                mealTimings,
                startDate
            } = req.body;
            const userId = req.authenticatedUser._id;
            console.log('📝 Processing purchase for user:', userId, 'subscription:', subscriptionId);

            const subscription = await Subscription.findById(subscriptionId);
            console.log('📦 Subscription found:', !!subscription, 'Active:', subscription?.isActive);
            if (!subscription || !subscription.isActive) {
                console.log('❌ Subscription not found or inactive');
                return httpError(next, 'Subscription plan not found or inactive', req, 404);
            }
            console.log('✅ Subscription validated:', subscription.planName, 'Price:', subscription.discountedPrice);

            // Validate delivery address and check service availability
            console.log('🏠 Validating delivery address:', deliveryAddress);
            const deliveryValidation = await LocationZone.validateDeliveryForSubscription(
                deliveryAddress,
                subscription.category
            );
            console.log('📍 Delivery validation result:', deliveryValidation);

            if (!deliveryValidation.isValid) {
                console.log('❌ Delivery validation failed:', deliveryValidation.errors);
                return httpError(next, {
                    message: 'Delivery not available to this address',
                    errors: deliveryValidation.errors,
                    suggestedZones: deliveryValidation.suggestedZones
                }, req, 400);
            }
            console.log('✅ Delivery validation passed, zone:', deliveryValidation.zone?.name);

            // Check if user already has an active subscription (using IST)
            console.log('🔍 Checking for existing active subscriptions');
            const currentIST = TimezoneUtil.now();
            const existingSubscription = await UserSubscription.findOne({
                userId,
                status: 'active',
                endDate: { $gte: currentIST }
            });
            console.log('📊 Existing subscription check:', !!existingSubscription);

            if (existingSubscription) {
                console.log('❌ User already has active subscription:', existingSubscription._id);
                return httpError(next, 'You already have an active subscription', req, 400);
            }
            console.log('✅ No existing active subscriptions found');

            // Validate meal timings against subscription plan
            const planMealTimings = subscription.mealTimings;
            if (mealTimings.lunch.enabled && !planMealTimings.isLunchAvailable) {
                return httpError(next, 'Lunch is not available for this subscription plan', req, 400);
            }
            if (mealTimings.dinner.enabled && !planMealTimings.isDinnerAvailable) {
                return httpError(next, 'Dinner is not available for this subscription plan', req, 400);
            }

            // Validate meal timing windows
            if (mealTimings.lunch.enabled) {
                const lunchTime = mealTimings.lunch.time;
                const lunchWindow = planMealTimings.lunchOrderWindow;
                if (lunchTime < lunchWindow.startTime || lunchTime > lunchWindow.endTime) {
                    return httpError(next, `Lunch time must be between ${lunchWindow.startTime} and ${lunchWindow.endTime}`, req, 400);
                }
            }

            if (mealTimings.dinner.enabled) {
                const dinnerTime = mealTimings.dinner.time;
                const dinnerWindow = planMealTimings.dinnerOrderWindow;
                if (dinnerTime < dinnerWindow.startTime || dinnerTime > dinnerWindow.endTime) {
                    return httpError(next, `Dinner time must be between ${dinnerWindow.startTime} and ${dinnerWindow.endTime}`, req, 400);
                }
            }

            if (!mealTimings.lunch.enabled && !mealTimings.dinner.enabled) {
                console.log('❌ No meal timings selected');
                return httpError(next, 'At least one meal timing must be selected', req, 400);
            }
            console.log('✅ Meal timings validated:', {
                lunch: mealTimings.lunch.enabled,
                dinner: mealTimings.dinner.enabled
            });

            let finalPrice = subscription.discountedPrice;
            let discountApplied = 0;
            let promoCodeData = null;

            if (promoCode) {
                console.log('🎫 Applying promo code:', promoCode);
                try {
                    const promoResult = await promoCodeService.validateAndApplyPromoCode(
                        promoCode,
                        userId,
                        finalPrice,
                        subscriptionId
                    );
                    console.log('💰 Promo code applied:', {
                        originalPrice: finalPrice,
                        finalPrice: promoResult.finalAmount,
                        discount: promoResult.discountAmount
                    });

                    finalPrice = promoResult.finalAmount;
                    discountApplied = promoResult.discountAmount;
                    promoCodeData = promoResult.promoCode;
                } catch (error) {
                    console.log('❌ Promo code error:', error.message);
                    return httpError(next, error.message, req, 400);
                }
            } else {
                console.log('💰 No promo code applied, final price:', finalPrice);
            }

            const subscriptionStartDate = startDate ?
                TimezoneUtil.toIST(startDate) :
                TimezoneUtil.now();

            const today = TimezoneUtil.startOfDay();
            if (TimezoneUtil.startOfDay(subscriptionStartDate) < today) {
                return httpError(next, 'Subscription start date cannot be in the past', req, 400);
            }

            const subscriptionEndDate = TimezoneUtil.addDays(subscription.durationDays, subscriptionStartDate);

            const finalStartDate = TimezoneUtil.startOfDay(subscriptionStartDate);
            const finalEndDate = TimezoneUtil.endOfDay(subscriptionEndDate);

            // Create payment order
            const paymentOrder = await paymentService.createOrder({
                amount: finalPrice,
                currency: 'INR',
                receipt: `subscription_${Date.now()}`,
                notes: {
                    userId: userId.toString(),
                    subscriptionId: subscriptionId.toString(),
                    type: 'subscription_purchase'
                }
            });

            // Create transaction record
            const transaction = new Transaction({
                userId,
                subscriptionId,
                orderId: paymentOrder.id,
                amount: finalPrice,
                finalAmount: finalPrice,
                transactionId: paymentOrder.id,
                gatewayTransactionId: paymentOrder.id,
                originalAmount: subscription.discountedPrice,
                discountApplied,
                promoCodeUsed: promoCodeData?._id || null,
                status: 'pending',
                type: 'purchase',
                paymentMethod: 'upi',
                paymentGateway: 'razorpay'
            });

            await transaction.save();

            const userSubscription = new UserSubscription({
                userId,
                subscriptionId,
                transactionId: transaction._id,
                startDate: finalStartDate,
                endDate: finalEndDate,
                deliveryAddress,
                mealTiming: mealTimings,
                creditsGranted: subscription.mealsPerPlan,
                skipCreditAvailable: subscription.userSkipMealPerPlan,
                originalPrice: subscription.originalPrice,
                finalPrice,
                discountApplied,
                promoCodeUsed: promoCodeData?._id || null,
                status: 'pending' // Will be activated after payment verification
            });

            await userSubscription.save();

            const deliveryZone = deliveryValidation.zone;

            transaction.userSubscriptionId = userSubscription._id;
            await transaction.save();

            httpResponse(req, res, 201, responseMessage.customMessage("PURCHASE INITIATED"), {
                orderId: paymentOrder.id,
                amount: finalPrice,
                currency: 'INR',
                userSubscriptionId: userSubscription._id,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
                subscription: {
                    planName: subscription.planName,
                    duration: subscription.duration,
                    durationDays: subscription.durationDays,
                    startDate: TimezoneUtil.format(finalStartDate, 'date'),
                    endDate: TimezoneUtil.format(finalEndDate, 'date'),
                    timezone: 'Asia/Kolkata (IST)'
                }
            });

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    // Verify payment and activate subscription
    verifyPayment: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateVerifyPayment, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                userSubscriptionId
            } = req.body;

            const userId = req.authenticatedUser._id;

            const transaction = await Transaction.findOne({
                orderId: razorpay_order_id,
                userId
            });

            if (!transaction) {
                return httpError(next, 'Transaction not found', req, 404);
            }

            const userSubscription = await UserSubscription.findById(userSubscriptionId);
            if (!userSubscription) {
                return httpError(next, 'Subscription not found', req, 404);
            }

            // Verify payment with payment service
            const isPaymentValid = await paymentService.verifyPayment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });

            if (!isPaymentValid) {
                // Mark transaction as failed
                transaction.status = 'failed';
                transaction.failureReason = 'Payment verification failed';
                await transaction.save();

                // Mark user subscription as failed
                userSubscription.status = 'failed';
                await userSubscription.save();

                return httpError(next, 'Payment verification failed', req, 400);
            }

            // Update transaction as successful (using IST)
            const completionTime = TimezoneUtil.now();
            transaction.status = 'completed';
            transaction.paymentId = razorpay_payment_id;
            transaction.completedAt = completionTime;
            await transaction.save();

            // Activate user subscription (using IST)
            userSubscription.status = 'active';
            userSubscription.paymentCompletedAt = completionTime;
            await userSubscription.save();

            // Increment subscription purchase count
            const subscription = await Subscription.findById(userSubscription.subscriptionId);
            if (subscription) {
                await subscription.incrementPurchases();
            }

            if (userSubscription.promoCodeUsed) {
                await promoCodeService.usePromoCode(userSubscription.promoCodeUsed, userId);
            }



            const deliveryZone = await LocationZone.findByPincode(userSubscription.deliveryAddress.zipCode);
            const zone = deliveryZone && deliveryZone.length > 0 ? deliveryZone[0] : null;

            const vendorAssignmentRequest = new VendorAssignmentRequest({
                userSubscriptionId: userSubscription._id,
                requestType: 'initial_assignment',
                userId: userId,
                currentVendorId: null,
                reason: 'initial_purchase',
                description: `Initial vendor assignment needed for new subscription purchase`,
                requestedVendorType: subscription.category,
                priority: 'high',
                deliveryZone: zone?._id || null,
                status: 'pending'
            });

            await vendorAssignmentRequest.save();

            httpResponse(req, res, 200, responseMessage.customMessage("PAYMENT VERIFIED"), {
                subscriptionId: userSubscription._id,
                status: 'active',
                message: 'Subscription activated successfully. Vendor assignment request has been created and will be processed by admin shortly.',
                vendorAssignmentRequestId: vendorAssignmentRequest._id,
                subscription: {
                    startDate: TimezoneUtil.format(userSubscription.startDate, 'date'),
                    endDate: TimezoneUtil.format(userSubscription.endDate, 'date'),
                    startDateTime: TimezoneUtil.format(userSubscription.startDate, 'datetime'),
                    endDateTime: TimezoneUtil.format(userSubscription.endDate, 'datetime'),
                    creditsGranted: userSubscription.creditsGranted,
                    skipCreditAvailable: userSubscription.skipCreditAvailable,
                    timezone: 'Asia/Kolkata (IST)'
                }
            });

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    // Get user subscriptions with filters
    getUserSubscriptions: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateUserSubscriptionQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const userId = req.authenticatedUser._id;
            const {
                page = 1,
                limit = 10,
                status,
                startDate,
                endDate,
                category
            } = req.query;

            const skip = (page - 1) * limit;
            const query = { userId };

            // Apply filters
            if (status) {
                query.status = status;
            }

            if (startDate || endDate) {
                query.startDate = {};
                if (startDate) query.startDate.$gte = TimezoneUtil.toIST(startDate);
                if (endDate) query.startDate.$lte = TimezoneUtil.endOfDay(endDate);
            }

            const userSubscriptions = await UserSubscription.find(query)
                .populate('subscriptionId', 'planName category duration durationDays originalPrice discountedPrice')
                .populate('vendorDetails.currentVendor.vendorId', 'businessInfo')
                .populate('promoCodeUsed', 'code discountType discountValue')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            // Filter by category if specified
            let filteredSubscriptions = userSubscriptions;
            if (category) {
                filteredSubscriptions = userSubscriptions.filter(sub =>
                    sub.subscriptionId?.category === category
                );
            }

            const totalSubscriptions = await UserSubscription.countDocuments(query);
            const totalPages = Math.ceil(totalSubscriptions / limit);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscriptions: filteredSubscriptions,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalSubscriptions,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    // Get subscription by ID (for user)
    getSubscriptionById: async (req, res, next) => {
        try {
            const { subscriptionId } = req.params;
            const userId = req.authenticatedUser._id;

            const userSubscription = await UserSubscription.findOne({
                _id: subscriptionId,
                userId
            })
                .populate('subscriptionId', 'planName category duration durationDays features terms')
                .populate('vendorDetails.currentVendor.vendorId', 'businessInfo contactInfo')
                .populate('promoCodeUsed', 'code discountType discountValue')
                .populate('transactionId', 'amount paymentId completedAt');

            if (!userSubscription) {
                return httpError(next, 'Subscription not found', req, 404);
            }

            // Get vendor assignment history if available
            const vendorHistory = userSubscription.vendorDetails.vendorsAssignedHistory || [];

            const remainingDays = userSubscription.getDaysRemaining();
            const dailyMealCount = userSubscription.getDailyMealCount();
            const totalMealsExpected = remainingDays * dailyMealCount;

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscription: userSubscription,
                analytics: {
                    remainingDays,
                    dailyMealCount,
                    totalMealsExpected,
                    creditsUsedPercentage: (userSubscription.creditsUsed / userSubscription.creditsGranted) * 100,
                    skipCreditsUsedPercentage: ((userSubscription.skipCreditGranted - userSubscription.skipCreditAvailable) / userSubscription.skipCreditGranted) * 100
                },
                vendorHistory
            });

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    // Cancel subscription (if allowed)
    cancelSubscription: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateCancelSubscription, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { subscriptionId } = req.params;
            const { reason } = req.body;
            const userId = req.authenticatedUser._id;

            const userSubscription = await UserSubscription.findOne({
                _id: subscriptionId,
                userId
            });

            if (!userSubscription) {
                return httpError(next, 'Subscription not found', req, 404);
            }

            if (userSubscription.status !== 'active') {
                return httpError(next, 'Only active subscriptions can be cancelled', req, 400);
            }

            // Check if cancellation is allowed (e.g., within 24 hours of purchase) using IST
            const nowIST = TimezoneUtil.now();
            const purchaseTime = userSubscription.paymentCompletedAt || userSubscription.createdAt;
            const timeDiff = nowIST - purchaseTime;
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return httpError(next, 'Subscription can only be cancelled within 24 hours of purchase', req, 400);
            }

            // Cancel the subscription (using IST)
            userSubscription.status = 'cancelled';
            userSubscription.cancelledAt = nowIST;
            userSubscription.cancellationReason = reason;
            await userSubscription.save();

            // Process refund if applicable

            httpResponse(req, res, 200, responseMessage.customMessage("SUBSCRIPTION CANCELLED"), {
                subscriptionId: userSubscription._id,
                refundStatus: 'pending',
                message: 'Subscription cancelled successfully. Refund will be processed within 5-7 business days.'
            });

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    // Request vendor switch (if allowed)
    requestVendorSwitch: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateVendorSwitchRequest, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { subscriptionId } = req.params;
            const { reason } = req.body;
            const userId = req.authenticatedUser._id;

            const userSubscription = await UserSubscription.findOne({
                _id: subscriptionId,
                userId
            });

            if (!userSubscription) {
                return httpError(next, 'Subscription not found', req, 404);
            }

            if (!userSubscription.canSwitchVendor()) {
                return httpError(next, 'Vendor switch not available for this subscription', req, 400);
            }


            // Find the delivery zone
            const deliveryZone = await LocationZone.findByPincode(userSubscription.deliveryAddress.zipCode);
            const zone = deliveryZone && deliveryZone.length > 0 ? deliveryZone[0] : null;

            const switchRequest = new VendorAssignmentRequest({
                userSubscriptionId: subscriptionId,
                requestType: 'vendor_switch',
                userId: userId,
                currentVendorId: userSubscription.vendorDetails.currentVendor.vendorId,
                reason: 'vendor_switch_request',
                description: reason || 'User requested vendor change',
                requestedVendorType: userSubscription.subscriptionId.category,
                priority: 'medium',
                deliveryZone: zone?._id || null,
                status: 'pending'
            });

            await switchRequest.save();

            httpResponse(req, res, 201, responseMessage.customMessage("VENDOR SWITCH REQUESTED"), {
                requestId: switchRequest._id,
                message: 'Vendor switch request submitted successfully. Admin will review and assign a new vendor.'
            });

        } catch (error) {
            httpError(next, error, req, 500);
        }
    }
};