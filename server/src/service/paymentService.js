import crypto from 'crypto'
import Razorpay from 'razorpay'
import config from '../config/config.js'
import Transaction from '../models/transaction.model.js'
import UserSubscription from '../models/userSubscription.model.js'
import UserProfile from '../models/userProfile.model.js'
import TimezoneUtil from '../util/timezone.js'
import dotenv from "dotenv-flow"

dotenv.config({})

class PaymentService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: config.razorpay.keyId || process.env.RAZORPAY_KEY_ID,
            key_secret: config.razorpay.keySecret || process.env.RAZORPAY_KEY_SECRET,
        });

        this.webhookSecret = config.razorpay.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
    }

    async createOrder(orderData) {
        try {
            const {
                amount,
                currency = 'INR',
                receipt,
                notes = {}
            } = orderData

            const orderReceipt = receipt || `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const razorpayOrder = await this.razorpay.orders.create({
                amount: Math.round(amount * 100),
                currency: currency,
                receipt: orderReceipt,
                notes: notes,
                payment_capture: 1
            });

            return {
                id: razorpayOrder.id,
                amount: amount,
                currency: currency,
                receipt: orderReceipt,
                notes: notes,
                razorpay_order_id: razorpayOrder.id,
                razorpay_key_id: config.razorpay.keyId,
                created_at: razorpayOrder.created_at
            };
        } catch (error) {
            console.error('Razorpay order creation error:', error)
            throw new Error(`Payment order creation failed: ${error.message}`)
        }
    }

    async verifyPayment(paymentData) {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = paymentData

            const stringToHash = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', config.razorpay.keySecret)
                .update(stringToHash)
                .digest('hex');

            return expectedSignature === razorpay_signature;
        } catch (error) {
            console.error('Payment verification error:', error)
            return false
        }
    }

    async processSuccessfulPayment(transactionId, paymentData) {
        try {
            const transaction = await Transaction.findOne({ transactionId })
                .populate('subscriptionId')
                .populate('userId');

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (transaction.status === 'success') {
                return {
                    success: true,
                    message: 'Transaction already processed'
                };
            }

            transaction.status = 'success';
            transaction.gatewayPaymentId = paymentData.razorpay_payment_id;
            transaction.razorpayOrderId = paymentData.razorpay_order_id;
            transaction.razorpayPaymentId = paymentData.razorpay_payment_id;
            transaction.razorpaySignature = paymentData.razorpay_signature;
            transaction.completedAt = TimezoneUtil.now();
            await transaction.save();

            const userSubscription = await UserSubscription.findById(transaction.userSubscriptionId);
            if (!userSubscription) {
                throw new Error('User subscription not found');
            }

            if (userSubscription.status !== 'active') {
                userSubscription.status = 'active';
                userSubscription.paymentCompletedAt = TimezoneUtil.now();
                await userSubscription.save();
            }

            if (transaction.subscriptionId) {
                await transaction.subscriptionId.incrementPurchases();
            }

            return {
                success: true,
                transaction,
                userSubscription,
            };
        } catch (error) {
            console.error('Payment processing error:', error)
            throw error;
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

    calculateSubscriptionEndDate(duration, durationDays = null) {
        const startDate = TimezoneUtil.now()

        switch (duration) {
            case 'weekly':
                return TimezoneUtil.addDays(7, startDate)
            case 'monthly':
                return TimezoneUtil.addMonths(1, startDate)
            case 'yearly':
                return TimezoneUtil.addMonths(12, startDate)
            case 'custom':
                return TimezoneUtil.addDays(durationDays || 30, startDate)
            default:
                return TimezoneUtil.addDays(durationDays || 30, startDate)
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

            const razorpayRefund = await this.razorpay.payments.refund(
                transaction.razorpayPaymentId,
                {
                    amount: Math.round(amount * 100),
                    notes: {
                        reason: reason,
                        refund_type: 'manual'
                    }
                }
            );

            await transaction.markAsRefunded({
                refundId: razorpayRefund.id,
                refundAmount: amount,
                refundDate: TimezoneUtil.now(),
                refundReason: reason,
                refundStatus: 'processed'
            })

            return {
                success: true,
                refund: razorpayRefund,
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
            return { success: true, message: 'Manual verification mode - webhook ignored' }
        } catch (error) {
            console.error('Webhook handling error:', error)
            throw error
        }
    }

    verifyWebhookSignature(body, signature) {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(JSON.stringify(body))
                .digest('hex');

            return expectedSignature === signature
        } catch (error) {
            console.error('Webhook signature verification error:', error)
            return false
        }
    }

    async handlePaymentCaptured(payment) {
        try {
            let transaction = await Transaction.findOne({
                razorpayOrderId: payment.order_id
            });

            if (!transaction) {
                transaction = await Transaction.findOne({
                    gatewayOrderId: payment.order_id
                });
            }

            if (!transaction) {
                transaction = await Transaction.findOne({
                    transactionId: payment.order_id
                });
            }

            if (transaction && transaction.status !== 'success') {
                await this.processSuccessfulPayment(transaction.transactionId, {
                    razorpay_order_id: payment.order_id,
                    razorpay_payment_id: payment.id,
                    razorpay_signature: 'webhook_verified'
                });
            }
        } catch (error) {
            console.error('Error handling payment captured webhook:', error)
        }
    }

    async handlePaymentFailed(payment) {
        try {
            const transaction = await Transaction.findOne({
                razorpayOrderId: payment.order_id
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
                razorpayPaymentId: refund.payment_id
            })

            if (transaction) {
                await transaction.markAsRefunded({
                    refundId: refund.id,
                    refundAmount: refund.amount / 100,
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