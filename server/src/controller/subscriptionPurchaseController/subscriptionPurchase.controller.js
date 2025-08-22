import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import { validateJoiSchema } from '../../service/validationService.js'
import Subscription from '../../models/subscription.model.js'
import Transaction from '../../models/transaction.model.js'
import UserSubscription from '../../models/userSubscription.model.js'
import paymentService from '../../service/paymentService.js'
import promoCodeService from '../../service/promoCodeService.js'
import {
    ValidateInitiatePurchase,
    ValidateVerifyPayment,
    ValidateProcessWebhook
} from '../../service/validationService.js'

export default {
    initiatePurchase: async (req, res, next) => {
        try {
            const { body } = req
            const { userId } = req.authenticatedUser

            const { error, value } = validateJoiSchema(ValidateInitiatePurchase, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { subscriptionId, promoCode } = value

            // Validate subscription
            const subscription = await Subscription.findById(subscriptionId)
            if (!subscription) {
                return httpError(next, new Error('Subscription not found'), req, 404)
            }

            if (!subscription.canPurchase()) {
                return httpError(next, new Error('Subscription is not available for purchase'), req, 400)
            }

            let finalAmount = subscription.discountedPrice
            let discountAmount = 0
            let promoCodeData = null

            // Apply promo code if provided
            if (promoCode) {
                const validationResult = await promoCodeService.validatePromoCode(
                    promoCode,
                    userId,
                    subscriptionId,
                    subscription.discountedPrice
                )

                if (!validationResult.valid) {
                    return httpError(next, new Error(validationResult.error), req, 400)
                }

                discountAmount = validationResult.discount
                finalAmount = subscription.discountedPrice - discountAmount
                promoCodeData = {
                    code: promoCode,
                    discountAmount: discountAmount,
                    promoCodeId: validationResult.promoCode._id
                }
            }

            // Generate unique transaction ID
            const transactionId = Transaction.generateTransactionId()

            // Create Razorpay order
            const orderData = {
                amount: finalAmount,
                currency: 'INR',
                receipt: transactionId,
                notes: {
                    subscription_id: subscriptionId,
                    user_id: userId,
                    promo_code: promoCode || null
                }
            }

            const orderResult = await paymentService.createOrder(orderData)
            if (!orderResult.success) {
                return httpError(next, new Error('Failed to create payment order'), req, 500)
            }

            // Create transaction record
            const transaction = new Transaction({
                transactionId: transactionId,
                userId: userId,
                subscriptionId: subscriptionId,
                amount: finalAmount,
                originalAmount: subscription.discountedPrice,
                discountAmount: discountAmount,
                finalAmount: finalAmount,
                paymentMethod: 'razorpay',
                gatewayTransactionId: orderResult.order.id,
                gatewayOrderId: orderResult.order.id,
                status: 'pending',
                promoCodeUsed: promoCodeData,
                metadata: {
                    userAgent: req.headers['user-agent'],
                    ipAddress: req.ip || req.connection.remoteAddress
                }
            })

            await transaction.save()

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                transactionId: transactionId,
                razorpayOrderId: orderResult.order.id,
                amount: finalAmount,
                originalAmount: subscription.discountedPrice,
                discountAmount: discountAmount,
                subscription: {
                    id: subscription._id,
                    planName: subscription.planName,
                    duration: subscription.duration,
                    mealsPerPlan: subscription.mealsPerPlan,
                    category: subscription.category
                },
                promoCode: promoCodeData,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    verifyPayment: async (req, res, next) => {
        try {
            const { body } = req

            const { error, value } = validateJoiSchema(ValidateVerifyPayment, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { transactionId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = value

            // Verify payment signature
            const verificationResult = await paymentService.verifyPayment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            })

            if (!verificationResult.isValid) {
                // Mark transaction as failed
                await paymentService.handleFailedPayment(transactionId, 'Invalid payment signature')
                return httpError(next, new Error('Payment verification failed'), req, 400)
            }

            // Process successful payment
            const paymentResult = await paymentService.processSuccessfulPayment(
                transactionId,
                verificationResult
            )

            if (!paymentResult.success) {
                return httpError(next, new Error(paymentResult.error), req, 400)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                success: true,
                message: 'Payment verified and subscription activated successfully',
                transaction: paymentResult.transaction,
                userSubscription: paymentResult.userSubscription,
                creditsAdded: paymentResult.creditsAdded
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    getUserSubscriptions: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser
            const { status, page = 1, limit = 10 } = req.query

            const skip = (page - 1) * limit
            const filter = { userId }

            if (status) {
                filter.status = status
            }

            const userSubscriptions = await UserSubscription.find(filter)
                .populate('subscriptionId', 'planName duration category originalPrice discountedPrice mealsPerPlan')
                .populate('promoCodeUsed', 'code discountType discountValue')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))

            const total = await UserSubscription.countDocuments(filter)

            // Calculate total credits and active subscriptions
            const activeSubscriptions = await UserSubscription.findActiveByUser(userId)
            const totalActiveCredits = activeSubscriptions.reduce(
                (sum, sub) => sum + sub.getRemainingCredits(), 0
            )

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                userSubscriptions,
                activeSubscriptions: activeSubscriptions.length,
                totalActiveCredits,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    getActiveSubscriptions: async (req, res, next) => {
        try {
            const { userId } = req.authenticatedUser

            const activeSubscriptions = await UserSubscription.findActiveByUser(userId)

            const subscriptionSummary = activeSubscriptions.map(sub => ({
                id: sub._id,
                subscription: sub.subscriptionId,
                creditsGranted: sub.creditsGranted,
                creditsUsed: sub.creditsUsed,
                remainingCredits: sub.getRemainingCredits(),
                startDate: sub.startDate,
                endDate: sub.endDate,
                daysRemaining: sub.getDaysRemaining(),
                status: sub.status
            }))

            const totalCredits = activeSubscriptions.reduce(
                (sum, sub) => sum + sub.getRemainingCredits(), 0
            )

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                activeSubscriptions: subscriptionSummary,
                totalActiveCredits: totalCredits,
                count: activeSubscriptions.length
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    getSubscriptionById: async (req, res, next) => {
        try {
            const { id } = req.params
            const { userId } = req.authenticatedUser

            const userSubscription = await UserSubscription.findOne({
                _id: id,
                userId
            })
                .populate('subscriptionId')
                .populate('promoCodeUsed')
                .populate('transactionId')

            if (!userSubscription) {
                return httpError(next, new Error('Subscription not found'), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                userSubscription
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    processWebhook: async (req, res, next) => {
        try {
            const signature = req.headers['x-razorpay-signature']
            const event = req.body

            if (!signature) {
                return httpError(next, new Error('Missing webhook signature'), req, 400)
            }

            await paymentService.handleWebhook(event, signature)

            res.status(200).send('OK')
        } catch (err) {
            console.error('Webhook processing error:', err)
            res.status(400).send('Webhook processing failed')
        }
    },

    getTransactionStatus: async (req, res, next) => {
        try {
            const { transactionId } = req.params
            const { userId } = req.authenticatedUser

            const transaction = await Transaction.findOne({
                transactionId,
                userId
            }).populate('subscriptionId', 'planName duration mealsPerPlan')

            if (!transaction) {
                return httpError(next, new Error('Transaction not found'), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                transaction,
                isPending: transaction.isPending(),
                isSuccessful: transaction.isSuccessful()
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}