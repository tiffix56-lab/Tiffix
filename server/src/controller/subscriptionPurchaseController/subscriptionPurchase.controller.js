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
import { EPaymentStatus } from '../../constant/application.js'


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
                return httpError(next, new Error('Subscription plan not found or inactive'), req, 404);
            }
            console.log("Delivery");

            // Validate delivery address and check service availability
            let deliveryValidation;
            try {
                deliveryValidation = await LocationZone.validateDeliveryForSubscription(
                    deliveryAddress,
                    subscription.category
                );
            } catch (validationError) {
                console.error("Delivery Validation Error:", {
                    error: validationError.message,
                    stack: validationError.stack,
                    userId: userId,
                    subscriptionId: subscriptionId,
                    zipCode: deliveryAddress.zipCode,
                    category: subscription.category
                });
                return httpError(next, new Error('Failed to validate delivery address'), req, 500);
            }

            console.log("Delivery validation result:", deliveryValidation);

            if (!deliveryValidation.isValid) {
                console.error("Delivery Validation Failed:", {
                    errors: deliveryValidation.errors,
                    suggestedZones: deliveryValidation.suggestedZones,
                    userId: userId,
                    subscriptionId: subscriptionId,
                    zipCode: deliveryAddress.zipCode,
                    category: subscription.category
                });

                return httpError(next, new Error(`Delivery not available: ${deliveryValidation.errors.join(', ')}`), req, 400);
            }

            console.log("Delivery validation passed, continuing with subscription creation...");

            // Check if user already has an active subscription (using IST)
            console.log("Checking for existing active subscriptions...");
            const currentIST = TimezoneUtil.now();
            const existingSubscription = await UserSubscription.findOne({
                userId,
                status: 'active',
                endDate: { $gte: currentIST }
            });
            console.log('📊 Existing subscription check:', !!existingSubscription);

            if (existingSubscription) {
                console.log("User already has active subscription:", existingSubscription._id);
                return httpError(next, new Error('You already have an active subscription'), req, 400);
            }

            console.log("No existing active subscription found, proceeding...");

            // Validate meal timings against subscription plan
            console.log("Validating meal timings...", {
                requestMealTimings: mealTimings,
                planMealTimings: subscription.mealTimings
            });

            const planMealTimings = subscription.mealTimings;
            if (mealTimings.lunch.enabled && !planMealTimings.isLunchAvailable) {
                console.log("Lunch not available in subscription plan");
                return httpError(next, new Error('Lunch is not available for this subscription plan'), req, 400);
            }
            if (mealTimings.dinner.enabled && !planMealTimings.isDinnerAvailable) {
                console.log("Dinner not available in subscription plan");
                return httpError(next, new Error('Dinner is not available for this subscription plan'), req, 400);
            }

            // Validate meal timing windows
            console.log("Validating meal timing windows...");
            if (mealTimings.lunch.enabled) {
                const lunchTime = mealTimings.lunch.time;
                const lunchWindow = planMealTimings.lunchOrderWindow;
                console.log("Checking lunch timing:", {
                    lunchTime,
                    lunchWindow
                });
                if (lunchTime < lunchWindow.startTime || lunchTime > lunchWindow.endTime) {
                    console.log("Lunch time outside allowed window");
                    return httpError(next, new Error(`Lunch time must be between ${lunchWindow.startTime} and ${lunchWindow.endTime}`), req, 400);
                }
            }

            if (mealTimings.dinner.enabled) {
                const dinnerTime = mealTimings.dinner.time;
                const dinnerWindow = planMealTimings.dinnerOrderWindow;
                console.log("Checking dinner timing:", {
                    dinnerTime,
                    dinnerWindow
                });
                if (dinnerTime < dinnerWindow.startTime || dinnerTime > dinnerWindow.endTime) {
                    console.log("Dinner time outside allowed window");
                    return httpError(next, new Error(`Dinner time must be between ${dinnerWindow.startTime} and ${dinnerWindow.endTime}`), req, 400);
                }
            }

            if (!mealTimings.lunch.enabled && !mealTimings.dinner.enabled) {
                console.log("No meal timings enabled");
                return httpError(next, new Error('At least one meal timing must be selected'), req, 400);
            }

            console.log("Meal timing validation passed, proceeding to payment...");

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
                    return httpError(next, new Error(error.message), req, 400);
                }
            } else {
                console.log('💰 No promo code applied, final price:', finalPrice);
            }

            // Add GST (18%) to the final price for payment
            const gstRate = 0.18; // 18% GST
            const gstAmount = Math.round(finalPrice * gstRate);
            const finalPriceWithGST = finalPrice + gstAmount;
            
            console.log('💰 Price calculation:', {
                basePrice: finalPrice,
                gstRate: `${gstRate * 100}%`,
                gstAmount,
                finalPriceWithGST
            });

            const subscriptionStartDate = startDate ?
                TimezoneUtil.toIST(startDate) :
                TimezoneUtil.now();

            const today = TimezoneUtil.startOfDay();
            if (TimezoneUtil.startOfDay(subscriptionStartDate) < today) {
                return httpError(next, new Error('Subscription start date cannot be in the past'), req, 400);
            }

            const subscriptionEndDate = TimezoneUtil.addDays(subscription.durationDays, subscriptionStartDate);

            const finalStartDate = TimezoneUtil.startOfDay(subscriptionStartDate);
            const finalEndDate = TimezoneUtil.endOfDay(subscriptionEndDate);

            // Create payment order with GST
            const paymentOrder = await paymentService.createOrder({
                amount: finalPriceWithGST,
                currency: 'INR',
                receipt: `subscription_${Date.now()}`,
                notes: {
                    userId: userId.toString(),
                    subscriptionId: subscriptionId.toString(),
                    type: 'subscription_purchase',
                    baseAmount: finalPrice.toString(),
                    gstAmount: gstAmount.toString()
                }
            });

            // Create transaction record
            const transaction = new Transaction({
                userId,
                subscriptionId,
                amount: finalPriceWithGST,
                finalAmount: finalPriceWithGST,
                transactionId: paymentOrder.id,
                gatewayTransactionId: paymentOrder.id,
                originalAmount: subscription.discountedPrice,
                discountAmount: discountApplied,
                promoCodeUsed: promoCodeData?._id || null,
                status: 'pending',
                type: 'subscription_purchase',
                paymentGateway: 'phonepe',
                paymentMethod: 'phonepe',
                gatewayOrderId: paymentOrder.id,
                // Store GST details
                gstAmount: gstAmount,
                baseAmount: finalPrice
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
                discountApplied: discountApplied,
                promoCodeUsed: promoCodeData?._id || null,
                status: 'pending'
            });

            await userSubscription.save();

            const deliveryZone = deliveryValidation.zone;

            transaction.userSubscriptionId = userSubscription._id;
            await transaction.save();

            httpResponse(req, res, 201, responseMessage.customMessage("PURCHASE INITIATED"), {
                orderId: paymentOrder.id,
                amount: finalPriceWithGST,
                baseAmount: finalPrice,
                gstAmount: gstAmount,
                currency: 'INR',
                userSubscriptionId: userSubscription._id,
                phonepeKey: process.env.PHONEPAY_CLIENT_ID,
                paymentUrl: paymentOrder.payment_url,
                subscription: {
                    planName: subscription.planName,
                    duration: subscription.duration,
                    durationDays: subscription.durationDays,
                    startDate: TimezoneUtil.format(finalStartDate, 'date'),
                    endDate: TimezoneUtil.format(finalEndDate, 'date'),
                    timezone: 'Asia/Kolkata (IST)'
                },
                priceBreakdown: {
                    basePrice: finalPrice,
                    gstRate: '18%',
                    gstAmount: gstAmount,
                    totalAmount: finalPriceWithGST
                }
            });

        } catch (error) {
            console.error("Initiate Purchase Error:", {
                message: error.message,
                stack: error.stack,
                userId: req.authenticatedUser?._id,
                subscriptionId: req.body?.subscriptionId
            });

            const errorMessage = error.message || 'Internal server error while initiating purchase';
            return httpError(next, new Error(errorMessage), req, 500);
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
                phonepe_transaction_id,
                phonepe_merchant_id,
                phonepe_checksum,
                userSubscriptionId
            } = req.body;

            const userId = req.authenticatedUser._id;

            console.log("Looking for transaction with:", {
                gatewayOrderId: phonepe_transaction_id,
                userId: userId
            });

            const transaction = await Transaction.findOne({
                gatewayOrderId: phonepe_transaction_id,
                userId,

            });

            if (!transaction) {
                console.error("Transaction not found:", {
                    gatewayOrderId: phonepe_transaction_id,
                    userId: userId
                });
                return httpError(next, new Error('Transaction not found for this order'), req, 404);
            }

            if (transaction.status !== EPaymentStatus.PENDING) {
                return httpError(next, new Error('Payment Already Verified'), req, 403);
            }

            console.log("Transaction found:", transaction._id);

            const userSubscription = await UserSubscription.findById(userSubscriptionId);
            if (!userSubscription) {
                console.error("User subscription not found:", {
                    userSubscriptionId,
                    userId
                });
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            console.log("User subscription found:", userSubscription._id);

            // Verify payment with payment service
            console.log("Verifying payment with payment service...");
            const isPaymentValid = await paymentService.verifyPayment({
                phonepe_transaction_id,
                phonepe_merchant_id,
                phonepe_checksum
            });

            if (!isPaymentValid) {
                console.error("Payment verification failed:", {
                    phonepe_transaction_id,
                    phonepe_merchant_id,
                    userSubscriptionId
                });

                // Mark transaction as failed
                transaction.status = 'failed';
                transaction.failureReason = 'Payment verification failed';
                await transaction.save();

                // Mark user subscription as failed
                userSubscription.status = 'failed';
                await userSubscription.save();

                return httpError(next, new Error('Payment verification failed'), req, 400);
            }

            console.log("Payment verification successful, activating subscription...");

            // Update transaction as successful (using IST)
            const completionTime = TimezoneUtil.now();
            transaction.status = EPaymentStatus.SUCCESS;
            transaction.paymentId = phonepe_transaction_id;
            transaction.phonepeTransactionId = phonepe_transaction_id;
            transaction.phonepeMerchantId = phonepe_merchant_id;
            transaction.phonepeChecksum = phonepe_checksum;
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
            console.error("Verify Payment Error:", {
                message: error.message,
                stack: error.stack,
                userId: req.authenticatedUser?._id,
                orderId: req.body?.phonepe_transaction_id
            });

            const errorMessage = error.message || 'Internal server error while verifying payment';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get user subscriptions with filters
    getUserSubscriptions: async (req, res, next) => {
        try {
            console.log('=== GET USER SUBSCRIPTIONS ===');
            console.log('User ID:', req.authenticatedUser._id);
            console.log('Query params:', req.query);

            const { error } = validateJoiSchema(ValidateUserSubscriptionQuery, req.query);
            if (error) {
                console.log('Validation error:', error);
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

            console.log('Query for UserSubscription:', query);

            const userSubscriptions = await UserSubscription.find(query)
                .populate('subscriptionId', 'planName category duration durationDays originalPrice discountedPrice features')
                .populate('vendorDetails.currentVendor.vendorId', 'businessInfo')
                .populate('promoCodeUsed', 'code discountType discountValue')
                .populate('transactionId', 'amount finalAmount paymentId completedAt status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            console.log('Found user subscriptions:', userSubscriptions.length);

            // Filter by category if specified
            let filteredSubscriptions = userSubscriptions;
            if (category) {
                filteredSubscriptions = userSubscriptions.filter(sub =>
                    sub.subscriptionId?.category === category
                );
            }

            // Enhanced subscription data with computed fields
            const enhancedSubscriptions = filteredSubscriptions.map(sub => {
                const remainingDays = sub.getDaysRemaining();
                const dailyMealCount = sub.getDailyMealCount();
                const remainingCredits = sub.getRemainingCredits();
                
                return {
                    ...sub.toObject(),
                    analytics: {
                        remainingDays: Math.max(0, remainingDays),
                        dailyMealCount,
                        remainingCredits,
                        creditsUsedPercentage: (sub.creditsUsed / sub.creditsGranted) * 100,
                        isActive: sub.isActive(),
                        isExpired: sub.CheckisExpired()
                    },
                    formattedDates: {
                        startDate: TimezoneUtil.format(sub.startDate, 'date'),
                        endDate: TimezoneUtil.format(sub.endDate, 'date'),
                        startDateTime: TimezoneUtil.format(sub.startDate, 'datetime'),
                        endDateTime: TimezoneUtil.format(sub.endDate, 'datetime')
                    }
                };
            });

            const totalSubscriptions = await UserSubscription.countDocuments(query);
            const totalPages = Math.ceil(totalSubscriptions / limit);

            console.log('Sending subscriptions response:', {
                total: enhancedSubscriptions.length,
                totalInDB: totalSubscriptions
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                subscriptions: enhancedSubscriptions,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalSubscriptions,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });

        } catch (error) {
            console.error("Get User Subscriptions Error:", {
                message: error.message,
                stack: error.stack,
                userId: req.authenticatedUser?._id,
                query: req.query
            });

            const errorMessage = error.message || 'Internal server error while fetching subscriptions';
            return httpError(next, new Error(errorMessage), req, 500);
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
                return httpError(next, new Error('Subscription not found'), req, 404);
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
            console.error("Get Subscription By ID Error:", {
                message: error.message,
                stack: error.stack,
                userId: req.authenticatedUser?._id,
                subscriptionId: req.params?.subscriptionId
            });

            const errorMessage = error.message || 'Internal server error while fetching subscription details';
            return httpError(next, new Error(errorMessage), req, 500);
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
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            if (userSubscription.status !== 'active') {
                return httpError(next, new Error('Only active subscriptions can be cancelled'), req, 400);
            }

            // Check if cancellation is allowed (e.g., within 24 hours of purchase) using IST
            const nowIST = TimezoneUtil.now();
            const purchaseTime = userSubscription.paymentCompletedAt || userSubscription.createdAt;
            const timeDiff = nowIST - purchaseTime;
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return httpError(next, new Error('Subscription can only be cancelled within 24 hours of purchase'), req, 400);
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
            console.error("Cancel Subscription Error:", {
                message: error.message,
                stack: error.stack,
                userId: req.authenticatedUser?._id,
                subscriptionId: req.params?.subscriptionId
            });

            const errorMessage = error.message || 'Internal server error while cancelling subscription';
            return httpError(next, new Error(errorMessage), req, 500);
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
                console.error("Subscription not found for vendor switch:", {
                    subscriptionId,
                    userId
                });
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            // Check if subscription is active
            if (!userSubscription.isActive()) {
                console.log("Cannot switch vendor - subscription not active:", {
                    subscriptionId,
                    status: userSubscription.status
                });
                return httpError(next, new Error('Cannot switch vendor for inactive subscription'), req, 400);
            }

            // Check if vendor is assigned
            if (!userSubscription.vendorDetails.isVendorAssigned || 
                !userSubscription.vendorDetails.currentVendor || 
                !userSubscription.vendorDetails.currentVendor.vendorId) {
                console.log("Cannot switch vendor - no vendor currently assigned:", {
                    subscriptionId,
                    isVendorAssigned: userSubscription.vendorDetails.isVendorAssigned,
                    hasCurrentVendor: !!userSubscription.vendorDetails.currentVendor
                });
                return httpError(next, new Error('Cannot switch vendor - no vendor currently assigned to this subscription'), req, 400);
            }

            // Check if vendor switch already used
            if (userSubscription.vendorDetails.vendorSwitchUsed) {
                console.log("Cannot switch vendor - switch already used:", {
                    subscriptionId,
                    vendorSwitchUsed: userSubscription.vendorDetails.vendorSwitchUsed
                });
                return httpError(next, new Error('Vendor switch has already been used for this subscription'), req, 400);
            }
            
            console.log("Vendor switch validation passed:", {
                subscriptionId,
                currentVendorId: userSubscription.vendorDetails.currentVendor.vendorId,
                isVendorAssigned: userSubscription.vendorDetails.isVendorAssigned
            });


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
            console.error("Request Vendor Switch Error:", {
                message: error.message,
                stack: error.stack,
                userId: req.authenticatedUser?._id,
                subscriptionId: req.params?.subscriptionId
            });

            const errorMessage = error.message || 'Internal server error while requesting vendor switch';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // PhonePe callback handler for payment completion
    phonepeCallback: async (req, res, next) => {
        try {
            console.log('=== PHONEPE WEBHOOK RECEIVED ===');
            console.log('Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Body:', JSON.stringify(req.body, null, 2));
            console.log('Query params:', JSON.stringify(req.query, null, 2));
            console.log('URL path:', req.path);
            
            const signature = req.headers['x-verify'];
            const event = req.body;

            console.log('Webhook signature:', signature);
            console.log('Event keys:', Object.keys(event));
            
            if (req.method === 'GET') {
                console.log('GET callback received - extracting orderId from query');
                const { orderId } = req.query;
                
                if (orderId) {
                    const transaction = await Transaction.findOne({
                        $or: [
                            { gatewayOrderId: orderId },
                            { transactionId: orderId }
                        ]
                    });
                    
                    if (transaction) {
                        console.log('Transaction found via GET callback:', transaction._id);
                        await paymentService.processSuccessfulPayment(
                            transaction.transactionId,
                            { phonepe_transaction_id: orderId }
                        );
                    } else {
                        console.log('Transaction not found for GET callback orderId:', orderId);
                    }
                }
            } else {
                console.log('POST webhook received');
                await paymentService.handleWebhook(event, signature);
            }

            // Respond to PhonePe with success
            res.status(200).json({
                success: true,
                message: 'Callback processed successfully'
            });

        } catch (error) {
            console.error('=== PHONEPE CALLBACK ERROR ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Request body:', JSON.stringify(req.body, null, 2));
            console.error('Request headers:', JSON.stringify(req.headers, null, 2));

            // Always respond with 200 to PhonePe to avoid retry storms
            res.status(200).json({
                success: false,
                error: 'Callback processing failed'
            });
        }
    },

    // PhonePe redirect handler for user redirects after payment
    phonepeRedirect: async (req, res, next) => {
        try {
            console.log('=== PHONEPE REDIRECT RECEIVED ===');
            console.log('Query params:', JSON.stringify(req.query, null, 2));
            
            const { orderId } = req.query;
            let paymentSuccess = false;
            let userSubscriptionId = null;
            
            if (orderId) {
                const transaction = await Transaction.findOne({
                    $or: [
                        { gatewayOrderId: orderId },
                        { transactionId: orderId }
                    ]
                });
                
                if (transaction) {
                    console.log('Transaction found via redirect:', transaction._id);
                    userSubscriptionId = transaction.userSubscriptionId;
                    
                    // Check if payment was already processed
                    if (transaction.status === 'success') {
                        console.log('Transaction already processed successfully');
                        paymentSuccess = true;
                    } else if (transaction.status === 'pending') {
                        console.log('Processing pending transaction...');
                        // Process the payment
                        try {
                            const result = await paymentService.processSuccessfulPayment(
                                transaction.transactionId,
                                { phonepe_transaction_id: orderId }
                            );
                            paymentSuccess = result && result.success !== false;
                            console.log('Payment processing completed:', paymentSuccess);
                        } catch (processError) {
                            console.error('Payment processing error:', processError);
                            paymentSuccess = false;
                        }
                    } else {
                        console.log('Transaction status is:', transaction.status);
                        paymentSuccess = false;
                    }
                    
                    // Double-check by verifying the UserSubscription status
                    if (userSubscriptionId) {
                        const userSubscription = await UserSubscription.findById(userSubscriptionId);
                        if (userSubscription && userSubscription.status === 'active') {
                            console.log('UserSubscription is active, payment verified');
                            paymentSuccess = true;
                        } else {
                            console.log('UserSubscription status:', userSubscription?.status);
                        }
                    }
                } else {
                    console.log('Transaction not found for redirect orderId:', orderId);
                }
            }
            
            // Redirect to mobile app
            const deepLinkUrl = paymentSuccess 
                ? `tiffix://payment-success?orderId=${orderId}&userSubscriptionId=${userSubscriptionId || ''}`
                : `tiffix://payment-failed?orderId=${orderId}`;
            
            console.log('Redirecting to mobile app via deep link:', deepLinkUrl);
            
            // Redirect directly to the app
            res.redirect(302, deepLinkUrl);
            
        } catch (error) {
            console.error('=== PHONEPE REDIRECT ERROR ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Request query:', JSON.stringify(req.query, null, 2));

            // Redirect to app with error
            const deepLinkUrl = `tiffix://payment-failed?orderId=${req.query.orderId || ''}`;
            res.status(200).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Payment Error</title></head>
                <body>
                    <script>window.location.href = '${deepLinkUrl}';</script>
                    <div style="text-align:center; padding:50px; font-family:Arial,sans-serif;">
                        <h2>Something went wrong</h2>
                        <p>Please return to the Tiffix app.</p>
                        <a href="${deepLinkUrl}">Open Tiffix App</a>
                    </div>
                </body>
                </html>
            `);
        }
    },

    checkPaymentStatus: async (req, res, next) => {
        try {
            const { orderId } = req.params;
            const userId = req.authenticatedUser._id;
            
            console.log('Checking payment status for orderId:', orderId, 'userId:', userId);

            const transaction = await Transaction.findOne({ 
                gatewayOrderId: orderId,
                userId
            }).populate('userSubscriptionId');

            if (!transaction) {
                console.log('Transaction not found for orderId:', orderId);
                return httpError(next, new Error('Transaction not found'), req, 404);
            }

            console.log('Transaction found:', {
                id: transaction._id,
                status: transaction.status,
                userSubscriptionId: transaction.userSubscriptionId
            });

            if (transaction.status === 'success' && transaction.userSubscriptionId) {
                const userSubscription = await UserSubscription.findById(
                    transaction.userSubscriptionId
                ).populate('subscriptionId', 'planName category');

                if (userSubscription && userSubscription.status === 'active') {
                    console.log('Payment verified - subscription is active');
                    return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                        status: 'success',
                        paymentStatus: 'completed',
                        subscription: {
                            id: userSubscription._id,
                            status: userSubscription.status,
                            planName: userSubscription.subscriptionId?.planName,
                            startDate: userSubscription.startDate,
                            endDate: userSubscription.endDate
                        }
                    });
                }
            }

            const status = transaction.status === 'failed' ? 'failed' : 'pending';
            console.log('Payment status:', status);
            
            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                status,
                paymentStatus: status,
                message: status === 'pending' ? 'Payment is being processed' : 'Payment failed'
            });

        } catch (error) {
            console.error('Check payment status error:', {
                message: error.message,
                stack: error.stack,
                orderId: req.params?.orderId,
                userId: req.authenticatedUser?._id
            });

            const errorMessage = error.message || 'Internal server error while checking payment status';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    phonepeRefundCallback: async (req, res, next) => {
        try {
            console.log('PhonePe refund callback received:', req.body);
            
            const signature = req.headers['x-verify'];
            const event = req.body;

            // Handle refund webhook
            // You can add specific refund handling logic here if needed
            console.log('Refund callback processed:', event);

            res.status(200).json({
                success: true,
                message: 'Refund callback processed successfully'
            });

        } catch (error) {
            console.error('PhonePe refund callback error:', {
                message: error.message,
                stack: error.stack,
                body: req.body
            });

            // Always respond with 200 to PhonePe to avoid retry storms
            res.status(200).json({
                success: false,
                error: 'Refund callback processing failed'
            });
        }
    },

    // Get subscription status by userSubscriptionId
    getSubscriptionStatus: async (req, res, next) => {
        try {
            const { userSubscriptionId } = req.params;
            const userId = req.authenticatedUser._id;
            
            console.log('Checking subscription status for userSubscriptionId:', userSubscriptionId, 'userId:', userId);

            const userSubscription = await UserSubscription.findOne({ 
                _id: userSubscriptionId,
                userId
            }).populate('subscriptionId', 'planName category');

            if (!userSubscription) {
                console.log('User subscription not found for userSubscriptionId:', userSubscriptionId);
                return httpError(next, new Error('Subscription not found'), req, 404);
            }

            console.log('User subscription found:', {
                id: userSubscription._id,
                status: userSubscription.status,
                planName: userSubscription.subscriptionId?.planName
            });

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                status: userSubscription.status,
                subscription: {
                    id: userSubscription._id,
                    status: userSubscription.status,
                    planName: userSubscription.subscriptionId?.planName,
                    category: userSubscription.subscriptionId?.category,
                    startDate: userSubscription.startDate,
                    endDate: userSubscription.endDate,
                    creditsGranted: userSubscription.creditsGranted,
                    creditsUsed: userSubscription.creditsUsed
                }
            });

        } catch (error) {
            console.error('Get subscription status error:', {
                message: error.message,
                stack: error.stack,
                userSubscriptionId: req.params?.userSubscriptionId,
                userId: req.authenticatedUser?._id
            });

            const errorMessage = error.message || 'Internal server error while checking subscription status';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    }
};