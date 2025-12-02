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
import referralService from '../../service/referralService.js'
import TimezoneUtil from '../../util/timezone.js'
import VendorAssignmentRequest from '../../models/vendorSwitchRequest.model.js'
import User from '../../models/user.model.js'
import { EPaymentStatus } from '../../constant/application.js'


export default {
    // Initiate subscription purchase
    initiatePurchase: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateInitiatePurchase, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                subscriptionId,
                promoCode,
                referralCode,
                deliveryAddress,
                mealTimings,
                startDate
            } = req.body;
            const userId = req.authenticatedUser._id;

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription || !subscription.isActive) {
                return httpError(next, new Error('Subscription plan not found or inactive'), req, 404);
            }

            // Verify service availability based on delivery address
            const { zipCode, coordinates } = deliveryAddress;

            // Validate coordinates format
            if (!coordinates || !coordinates.coordinates || !Array.isArray(coordinates.coordinates) || coordinates.coordinates.length !== 2) {
                return httpError(next, new Error('Invalid delivery address coordinates format'), req, 400);
            }

            const [longitude, latitude] = coordinates.coordinates;

            // Validate coordinate values
            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                return httpError(next, new Error('Invalid coordinate values'), req, 400);
            }

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return httpError(next, new Error('Coordinates out of valid range'), req, 400);
            }

            // Validate pincode format
            if (!zipCode || !/^[0-9]{6}$/.test(zipCode)) {
                return httpError(next, new Error('Valid 6-digit pincode is required'), req, 400);
            }

            // Find zones by pincode
            const zones = await LocationZone.findByPincode(zipCode);

            if (!zones || zones.length === 0) {
                return httpError(next, new Error('Service not available in your area. No service zones found for this pincode.'), req, 400);
            }

            // Check if any zone is serviceable (active and within radius)
            let serviceableZone = null;
            let closestZone = null;
            let minDistance = Infinity;

            for (const zone of zones) {
                // Check if zone is active
                if (!zone.isServiceAvailable()) {
                    continue;
                }

                // Validate zone coordinates
                if (!zone.coordinates || typeof zone.coordinates.lat !== 'number' || typeof zone.coordinates.lng !== 'number') {
                    console.warn(`Zone ${zone._id} has invalid coordinates, skipping`);
                    continue;
                }

                // Calculate distance from zone center to delivery address
                const userCoords = { lat: latitude, lng: longitude };
                const zoneCoords = { lat: zone.coordinates.lat, lng: zone.coordinates.lng };

                const distance = zone.calculateDistance(zoneCoords, userCoords);

                // Track closest zone for better error message
                if (distance < minDistance) {
                    minDistance = distance;
                    closestZone = zone;
                }

                // Check if within service radius
                const serviceRadius = zone.serviceRadius || 10; // Default 10km if not set
                if (distance <= serviceRadius) {
                    serviceableZone = zone;
                    break; // Found a serviceable zone
                }
            }

            if (!serviceableZone) {
                // Provide helpful error message
                if (closestZone) {
                    const distanceKm = minDistance.toFixed(2);
                    const radiusKm = closestZone.serviceRadius || 10;
                    return httpError(next, new Error(`Service not available in your area. The nearest service zone (${closestZone.zoneName}) is ${distanceKm}km away, but our service radius is ${radiusKm}km. Please choose a delivery address within our service area.`), req, 400);
                } else {
                    return httpError(next, new Error('Service not available in your area. No active service zones found for this pincode.'), req, 400);
                }
            }

            // Check existing active subscription
            const currentIST = TimezoneUtil.now();
            const existingSubscription = await UserSubscription.findOne({
                userId,
                status: 'active',
                endDate: { $gte: currentIST }
            });

            if (existingSubscription) {
                return httpError(next, new Error('You already have an active subscription'), req, 400);
            }

            // Validate meal timings
            const planMealTimings = subscription.mealTimings;

            if (mealTimings.lunch.enabled && !planMealTimings.isLunchAvailable) {
                return httpError(next, new Error('Lunch is not available for this subscription plan'), req, 400);
            }
            if (mealTimings.dinner.enabled && !planMealTimings.isDinnerAvailable) {
                return httpError(next, new Error('Dinner is not available for this subscription plan'), req, 400);
            }

            if (mealTimings.lunch.enabled) {
                const lunchTime = mealTimings.lunch.time;
                const lunchWindow = planMealTimings.lunchOrderWindow;
                if (lunchTime < lunchWindow.startTime || lunchTime > lunchWindow.endTime) {
                    return httpError(next, new Error(`Lunch time must be between ${lunchWindow.startTime} and ${lunchWindow.endTime}`), req, 400);
                }
            }

            if (mealTimings.dinner.enabled) {
                const dinnerTime = mealTimings.dinner.time;
                const dinnerWindow = planMealTimings.dinnerOrderWindow;
                if (dinnerTime < dinnerWindow.startTime || dinnerTime > dinnerWindow.endTime) {
                    return httpError(next, new Error(`Dinner time must be between ${dinnerWindow.startTime} and ${dinnerWindow.endTime}`), req, 400);
                }
            }

            if (!mealTimings.lunch.enabled && !mealTimings.dinner.enabled) {
                return httpError(next, new Error('At least one meal timing must be selected'), req, 400);
            }

            // Validate and verify referral code
            let referralData = null;
            if (referralCode) {
                const referralValidation = await referralService.canUserUseReferral(userId, referralCode);
                if (!referralValidation.canUse) {
                    return httpError(next, new Error(referralValidation.message), req, 400);
                }
                referralData = {
                    referralCode: referralCode,
                    referrerId: referralValidation.referrerId,
                    referrerName: referralValidation.referrerName
                };
            }

            // Apply promo code
            let finalPrice = subscription.discountedPrice;
            let discountApplied = 0;
            let promoCodeData = null;

            if (promoCode) {
                const promoResult = await promoCodeService.validateAndApplyPromoCode(
                    promoCode,
                    userId,
                    finalPrice,
                    subscriptionId
                );
                finalPrice = promoResult.finalAmount;
                discountApplied = promoResult.discountAmount;
                promoCodeData = promoResult.promoCode;
            }

            const gstRate = 0;
            const gstAmount = Math.round(finalPrice * gstRate);
            let finalPriceWithGST = finalPrice + gstAmount;

            // Calculate delivery fee
            let deliveryFee = 0;
            // if (!subscription.freeDelivery) {
            //     deliveryFee = deliveryValidation.deliveryFee || 0;
            //     finalPriceWithGST += deliveryFee;
            // }

            // Validate start date
            const subscriptionStartDate = startDate ? TimezoneUtil.toIST(startDate) : TimezoneUtil.now();
            const today = TimezoneUtil.startOfDay();
            if (TimezoneUtil.startOfDay(subscriptionStartDate) < today) {
                return httpError(next, new Error('Subscription start date cannot be in the past'), req, 400);
            }

            const subscriptionEndDate = TimezoneUtil.addDays(subscription.durationDays, subscriptionStartDate);
            const finalStartDate = TimezoneUtil.startOfDay(subscriptionStartDate);
            const finalEndDate = TimezoneUtil.endOfDay(subscriptionEndDate);

            // Create payment order
            const paymentOrder = await paymentService.createOrder({
                amount: finalPriceWithGST,
                currency: 'INR',
                receipt: `subscription_${Date.now()}`,
                notes: {
                    userId: userId.toString(),
                    subscriptionId: subscriptionId.toString(),
                    type: 'subscription_purchase',
                    baseAmount: finalPrice.toString(),
                    gstAmount: gstAmount.toString(),
                    deliveryFee: deliveryFee.toString()
                }
            });

            // Create transaction
            const transaction = new Transaction({
                userId,
                subscriptionId,
                amount: finalPriceWithGST,
                finalAmount: finalPrice,
                transactionId: paymentOrder.id,
                gatewayTransactionId: paymentOrder.id,
                originalAmount: subscription.discountedPrice,
                discountAmount: discountApplied,
                promoCodeUsed: promoCodeData?._id || null,
                status: 'pending',
                type: 'subscription_purchase',
                paymentGateway: 'razorpay',
                paymentMethod: 'razorpay',
                gatewayOrderId: paymentOrder.id,
                gstAmount: gstAmount,
                baseAmount: finalPrice,
                deliveryFee: deliveryFee
            });

            await transaction.save();

            // Create user subscription
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
                status: 'pending',
                deliveryZone: serviceableZone._id,
                referralDetails: referralData ? {
                    isReferralUsed: true,
                    referralCode: referralData.referralCode,
                    referredBy: referralData.referrerId
                } : {
                    isReferralUsed: false,
                    referralCode: null,
                    referredBy: null
                }
            });

            await userSubscription.save();
            transaction.userSubscriptionId = userSubscription._id;
            await transaction.save();

            httpResponse(req, res, 201, responseMessage.customMessage("PURCHASE INITIATED"), {
                orderId: paymentOrder.id,
                amount: finalPriceWithGST,
                baseAmount: finalPrice,
                gstAmount: gstAmount,
                deliveryFee: deliveryFee,
                currency: 'INR',
                userSubscriptionId: userSubscription._id,
                razorpayKeyId: paymentOrder.razorpay_key_id,
                razorpayOrderId: paymentOrder.razorpay_order_id,
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
                    deliveryFee: deliveryFee,
                    totalAmount: finalPriceWithGST
                }
            });

        } catch (error) {
            console.error("Initiate Purchase Error:", {
                message: error.message,
                userId: req.authenticatedUser?._id,
                subscriptionId: req.body?.subscriptionId
            });
            const errorMessage = error.message || 'Internal server error while initiating purchase';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

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

            console.log("Looking for transaction with:", {
                gatewayOrderId: razorpay_order_id,
                userId: userId
            });

            const transaction = await Transaction.findOne({
                gatewayOrderId: razorpay_order_id,
                userId
            });

            if (!transaction) {
                console.error("Transaction not found:", {
                    gatewayOrderId: razorpay_order_id,
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

            console.log("Verifying payment with payment service...");
            const isPaymentValid = await paymentService.verifyPayment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });

            if (!isPaymentValid) {
                console.error("Payment verification failed:", {
                    razorpay_order_id,
                    razorpay_payment_id,
                    userSubscriptionId
                });

                transaction.status = 'failed';
                transaction.failureReason = 'Payment verification failed';
                await transaction.save();

                userSubscription.status = 'failed';
                await userSubscription.save();

                return httpError(next, new Error('Payment verification failed'), req, 400);
            }

            console.log("Payment verification successful, activating subscription...");

            const completionTime = TimezoneUtil.now();
            transaction.status = EPaymentStatus.SUCCESS;
            transaction.paymentId = razorpay_payment_id;
            transaction.razorpayOrderId = razorpay_order_id;
            transaction.razorpayPaymentId = razorpay_payment_id;
            transaction.razorpaySignature = razorpay_signature;
            transaction.completedAt = completionTime;
            await transaction.save();

            userSubscription.status = 'active';
            userSubscription.paymentCompletedAt = completionTime;
            await userSubscription.save();

            const subscription = await Subscription.findById(userSubscription.subscriptionId);
            if (subscription) {
                await subscription.incrementPurchases();
            }

            if (userSubscription.promoCodeUsed) {
                await promoCodeService.usePromoCode(userSubscription.promoCodeUsed, userId);
            }

            // Handle referral code 
            if (userSubscription.referralDetails && userSubscription.referralDetails.isReferralUsed) {
                const user = await User.findById(userId);

                // Check if user already used referral code in another PAID subscription
                if (user.referral.isReferralUsed && user.referral.usedReferralDetails.usedInSubscription) {
                    // User already used referral in another subscription
                    // Check if that subscription is paid (status = active/expired)
                    const previousSubscription = await UserSubscription.findById(
                        user.referral.usedReferralDetails.usedInSubscription
                    );

                    if (previousSubscription && (previousSubscription.status === 'active' || previousSubscription.status === 'expired')) {

                        console.log('Edge case detected: User already used referral in another paid subscription', {
                            userId,
                            previousSubscriptionId: previousSubscription._id,
                            currentSubscriptionId: userSubscription._id
                        });

                        // Clear referral details from current subscription
                        userSubscription.referralDetails.isReferralUsed = false;
                        userSubscription.referralDetails.referralCode = null;
                        userSubscription.referralDetails.referredBy = null;
                        await userSubscription.save();
                    } else {

                        user.referral.isReferralUsed = true;
                        user.referral.referralUsedAt = TimezoneUtil.now();
                        user.referral.usedReferralDetails = {
                            referralCode: userSubscription.referralDetails.referralCode,
                            referredBy: userSubscription.referralDetails.referredBy,
                            usedInSubscription: userSubscription._id
                        };
                        await user.save();
                    }
                } else {
                    // First time using referral code
                    user.referral.isReferralUsed = true;
                    user.referral.referralUsedAt = TimezoneUtil.now();
                    user.referral.usedReferralDetails = {
                        referralCode: userSubscription.referralDetails.referralCode,
                        referredBy: userSubscription.referralDetails.referredBy,
                        usedInSubscription: userSubscription._id
                    };
                    await user.save();
                }
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
                orderId: req.body?.razorpay_order_id
            });

            const errorMessage = error.message || 'Internal server error while verifying payment';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

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

            let filteredSubscriptions = userSubscriptions;
            if (category) {
                filteredSubscriptions = userSubscriptions.filter(sub =>
                    sub.subscriptionId?.category === category
                );
            }

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

            const nowIST = TimezoneUtil.now();
            const purchaseTime = userSubscription.paymentCompletedAt || userSubscription.createdAt;
            const timeDiff = nowIST - purchaseTime;
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return httpError(next, new Error('Subscription can only be cancelled within 24 hours of purchase'), req, 400);
            }

            userSubscription.status = 'cancelled';
            userSubscription.cancelledAt = nowIST;
            userSubscription.cancellationReason = reason;
            await userSubscription.save();


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
            }).populate("subscriptionId")

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


            // Check for existing pending vendor switch requests
            const existingPendingRequest = await VendorAssignmentRequest.findOne({
                userSubscriptionId: subscriptionId,
                requestType: 'vendor_switch',
                status: 'pending'
            });

            if (existingPendingRequest) {
                console.log("Cannot switch vendor - pending request already exists:", {
                    subscriptionId,
                    existingRequestId: existingPendingRequest._id,
                    existingRequestStatus: existingPendingRequest.status
                });
                return httpError(next, new Error('A vendor switch request is already pending for this subscription'), req, 400);
            }


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

    // Razorpay webhook handler (for future use if webhooks are enabled)
    razorpayWebhook: async (req, res, next) => {
        try {
            console.log('=== RAZORPAY WEBHOOK RECEIVED ===');
            console.log('Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Body:', JSON.stringify(req.body, null, 2));

            // Note: In manual verification mode, webhooks are not processed
            // Payment verification is handled through frontend callback
            console.log('Manual verification mode - webhook acknowledged but not processed');

            res.status(200).json({
                success: true,
                message: 'Webhook acknowledged (manual verification mode)'
            });

        } catch (error) {
            console.error('=== RAZORPAY WEBHOOK ERROR ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);

            res.status(200).json({
                success: false,
                error: 'Webhook processing failed'
            });
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