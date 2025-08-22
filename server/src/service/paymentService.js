import Razorpay from 'razorpay'
import crypto from 'crypto'
import config from '../config/config.js'
import Transaction from '../models/transaction.model.js'
import UserSubscription from '../models/userSubscription.model.js'
import UserProfile from '../models/userProfile.model.js'
import TimezoneUtil from '../util/timezone.js'

class PaymentService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: config.razorpay?.keyId || process.env.RAZORPAY_KEY_ID,
            key_secret: config.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET
        })
    }

    async createOrder(orderData) {
        try {
            const {
                amount,
                currency = 'INR',
                receipt,
                notes = {}
            } = orderData

            const order = await this.razorpay.orders.create({
                amount: Math.round(amount * 100), // Convert to paise
                currency,
                receipt,
                notes
            })

            return {
                success: true,
                order
            }
        } catch (error) {
            console.error('Razorpay order creation error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    async verifyPayment(paymentData) {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = paymentData

            const body = razorpay_order_id + '|' + razorpay_payment_id

            const expectedSignature = crypto
                .createHmac('sha256', config.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex')

            const isValid = expectedSignature === razorpay_signature

            return {
                isValid,
                razorpay_payment_id,
                razorpay_order_id
            }
        } catch (error) {
            console.error('Payment verification error:', error)
            return {
                isValid: false,
                error: error.message
            }
        }
    }

    async processSuccessfulPayment(transactionId, paymentData) {
        try {
            const transaction = await Transaction.findOne({ transactionId })
                .populate('subscriptionId')
                .populate('userId')

            if (!transaction) {
                throw new Error('Transaction not found')
            }

            if (transaction.status === 'success') {
                return {
                    success: false,
                    error: 'Transaction already processed'
                }
            }

            // Mark transaction as successful
            await transaction.markAsSuccess(
                paymentData.razorpay_payment_id,
                transaction.subscriptionId.mealsPerPlan
            )

            // Create user subscription
            const userSubscription = await this.createUserSubscription(transaction)


            // Update subscription purchase count
            await transaction.subscriptionId.incrementPurchases()

            return {
                success: true,
                transaction,
                userSubscription,
            }
        } catch (error) {
            console.error('Payment processing error:', error)
            throw error
        }
    }

    async createUserSubscription(transaction) {
        try {
            const endDate = this.calculateSubscriptionEndDate(
                transaction.subscriptionId.duration,
                transaction.subscriptionId.customDurationDays
            )

            const userSubscription = new UserSubscription({
                userId: transaction.userId._id,
                subscriptionId: transaction.subscriptionId._id,
                transactionId: transaction._id,
                creditsGranted: transaction.subscriptionId.mealsPerPlan,
                startDate: TimezoneUtil.now(),
                endDate: endDate,
                originalPrice: transaction.originalAmount,
                discountApplied: transaction.discountAmount,
                finalPrice: transaction.finalAmount,
                promoCodeUsed: transaction.promoCodeUsed?.promoCodeId || null,
            })

            await userSubscription.save()
            await userSubscription.activate()

            // Add to user profile's active subscriptions
            await UserProfile.findOneAndUpdate(
                { userId: transaction.userId._id },
                { $addToSet: { activeSubscriptions: userSubscription._id } }
            )

            return userSubscription
        } catch (error) {
            console.error('Error creating user subscription:', error)
            throw error
        }
    }

    calculateSubscriptionEndDate(duration, customDurationDays = null) {
        const startDate = TimezoneUtil.now()

        switch (duration) {
            case 'daily':
                return TimezoneUtil.addDays(1, startDate)
            case 'weekly':
                return TimezoneUtil.addDays(7, startDate)
            case 'monthly':
                return TimezoneUtil.addMonths(1, startDate)
            case 'custom':
                if (customDurationDays) {
                    return TimezoneUtil.addDays(customDurationDays, startDate)
                } else {
                    return TimezoneUtil.addDays(30, startDate) // Default to 30 days
                }
            default:
                return TimezoneUtil.addMonths(1, startDate) // Default to monthly
        }
    }



    async handleFailedPayment(transactionId, reason) {
        try {
            const transaction = await Transaction.findOne({ transactionId })
            if (!transaction) {
                throw new Error('Transaction not found')
            }

            await transaction.markAsFailed(reason)

            return {
                success: true,
                transaction
            }
        } catch (error) {
            console.error('Error handling failed payment:', error)
            throw error
        }
    }

    async createRefund(transactionId, refundData) {
        try {
            const transaction = await Transaction.findOne({ transactionId })
            if (!transaction) {
                throw new Error('Transaction not found')
            }

            if (!transaction.canBeRefunded()) {
                throw new Error('Transaction cannot be refunded')
            }

            const {
                amount = transaction.finalAmount,
                reason = 'Customer request'
            } = refundData

            const refund = await this.razorpay.payments.refund(
                transaction.gatewayPaymentId,
                {
                    amount: Math.round(amount * 100), // Convert to paise
                    notes: {
                        reason,
                        original_transaction_id: transactionId
                    }
                }
            )

            await transaction.markAsRefunded({
                refundId: refund.id,
                refundAmount: amount,
                refundDate: TimezoneUtil.now(),
                refundReason: reason,
                refundStatus: 'processed'
            })

            return {
                success: true,
                refund,
                transaction
            }
        } catch (error) {
            console.error('Refund creation error:', error)
            throw error
        }
    }

    async getPaymentDetails(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId)
            return {
                success: true,
                payment
            }
        } catch (error) {
            console.error('Error fetching payment details:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    async handleWebhook(event, signature) {
        try {
            const isValid = this.verifyWebhookSignature(event, signature)
            if (!isValid) {
                throw new Error('Invalid webhook signature')
            }

            const { event: eventType, payload } = event

            switch (eventType) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(payload.payment.entity)
                    break
                case 'payment.failed':
                    await this.handlePaymentFailed(payload.payment.entity)
                    break
                case 'refund.processed':
                    await this.handleRefundProcessed(payload.refund.entity)
                    break
                default:
                    console.log(`Unhandled webhook event: ${eventType}`)
            }

            return { success: true }
        } catch (error) {
            console.error('Webhook handling error:', error)
            throw error
        }
    }

    verifyWebhookSignature(body, signature) {
        try {
            const webhookSecret = config.razorpay?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(body))
                .digest('hex')

            return expectedSignature === signature
        } catch (error) {
            console.error('Webhook signature verification error:', error)
            return false
        }
    }

    async handlePaymentCaptured(payment) {
        try {
            const transaction = await Transaction.findOne({
                gatewayOrderId: payment.order_id
            })

            if (transaction && transaction.status !== 'success') {
                await this.processSuccessfulPayment(transaction.transactionId, {
                    razorpay_payment_id: payment.id
                })
            }
        } catch (error) {
            console.error('Error handling payment captured webhook:', error)
        }
    }

    async handlePaymentFailed(payment) {
        try {
            const transaction = await Transaction.findOne({
                gatewayOrderId: payment.order_id
            })

            if (transaction && transaction.status === 'pending') {
                await transaction.markAsFailed(payment.error_description || 'Payment failed')
            }
        } catch (error) {
            console.error('Error handling payment failed webhook:', error)
        }
    }

    async handleRefundProcessed(refund) {
        try {
            const transaction = await Transaction.findOne({
                gatewayPaymentId: refund.payment_id
            })

            if (transaction) {
                await transaction.markAsRefunded({
                    refundId: refund.id,
                    refundAmount: refund.amount / 100, // Convert from paise
                    refundDate: TimezoneUtil.toIST(new Date(refund.created_at * 1000)),
                    refundReason: 'Processed via webhook',
                    refundStatus: 'processed'
                })
            }
        } catch (error) {
            console.error('Error handling refund processed webhook:', error)
        }
    }
}

export default new PaymentService()