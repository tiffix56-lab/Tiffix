import crypto from 'crypto'
import config from '../config/config.js'
import Transaction from '../models/transaction.model.js'
import UserSubscription from '../models/userSubscription.model.js'
import UserProfile from '../models/userProfile.model.js'
import TimezoneUtil from '../util/timezone.js'
import { Env, StandardCheckoutClient, StandardCheckoutPayRequest } from "pg-sdk-node";



class PaymentService {
    constructor() {
        console.log(config.phonepay.keyId, config.phonepay.keySecret);

        this.phonepeClient = StandardCheckoutClient.getInstance(
            config.phonepay.keyId || process.env.PHONEPAY_CLIENT_ID,
            config.phonepay.keySecret || process.env.PHONEPAY_CLIENT_SECRET,
            1,
            Env.SANDBOX
        );

        // PhonePe merchant configuration
        this.merchantId = config.phonepay.merchantId || process.env.PHONEPAY_MERCHANT_ID;
        this.saltIndex = config.phonepay.saltIndex || process.env.PHONEPAY_SALT_INDEX || 1;
        this.saltKey = config.phonepay.keySecret || process.env.PHONEPAY_CLIENT_SECRET;
    }

    async createOrder(orderData) {
        try {
            const {
                amount,
                currency = 'INR',
                receipt,
                notes = {}
            } = orderData

            // Generate unique merchant order ID
            const orderId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            // Build PhonePe payment request using the proper builder pattern
            const request = StandardCheckoutPayRequest.builder()
                .merchantOrderId(orderId)
                .amount(amount * 100) // Convert to paise
                .redirectUrl(`${config.server.url}/v1/payments/phonepe/callback?orderId=${orderId}`)
                .build();

            console.log('PhonePe REQUEST:', this.phonepeClient);
            console.log('Payment request:', request);

            // Create payment with PhonePe
            const response = await this.phonepeClient.pay(request);
            console.log('PhonePe response:', response);

            return {
                id: orderId,
                amount: amount,
                currency: currency,
                receipt: receipt,
                notes: notes,
                phonepe_response: response,
                payment_url: response.redirectUrl
            };
        } catch (error) {
            console.error('PhonePe order creation error:', error)
            throw new Error(`Payment order creation failed: ${error.message}`)
        }
    }

    async verifyPayment(paymentData) {
        try {
            const {
                phonepe_transaction_id,
                phonepe_merchant_id,
                phonepe_checksum
            } = paymentData

            // Allow test payments in development mode
            if (process.env.NODE_ENV !== 'production' && phonepe_checksum === 'test_signature_for_development') {
                console.log('Development mode: Accepting test payment verification');
                return true;
            }

            // Check payment status using PhonePe SDK
            const statusResponse = await this.phonepeClient.checkStatus(
                phonepe_transaction_id,
                this.merchantId
            );

            // Verify the checksum
            const stringToHash = `/pg/v1/status/${this.merchantId}/${phonepe_transaction_id}` + this.saltKey;
            const expectedChecksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + this.saltIndex;

            const isChecksumValid = expectedChecksum === phonepe_checksum;
            const isPaymentSuccess = statusResponse?.data?.state === 'COMPLETED';

            return isChecksumValid && isPaymentSuccess;
        } catch (error) {
            console.error('Payment verification error:', error)
            return false
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
                paymentData.phonepe_transaction_id,
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
                if (durationDays) {
                    return TimezoneUtil.addDays(durationDays, startDate)
                } else {
                    return TimezoneUtil.addDays(30, startDate) // Default to 30 days
                }
            default:
                // Use durationDays if provided, otherwise default to 30 days
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

            // PhonePe refund request
            const refundRequest = {
                merchantId: this.merchantId,
                merchantTransactionId: `REFUND_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                originalTransactionId: transaction.gatewayPaymentId,
                amount: Math.round(amount * 100), // Convert to paise
                callbackUrl: `${config.server.url}/v1/payments/phonepe/refund-callback`
            };

            const refund = await this.phonepeClient.refund(refundRequest);

            await transaction.markAsRefunded({
                refundId: refundRequest.merchantTransactionId,
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
            const payment = await this.phonepeClient.checkStatus(paymentId, this.merchantId)
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

            // PhonePe webhook structure
            const { merchantId, transactionId, amount, state, responseCode } = event

            switch (state) {
                case 'COMPLETED':
                    await this.handlePaymentCaptured({
                        id: transactionId,
                        order_id: event.merchantTransactionId,
                        amount: amount,
                        state: state
                    })
                    break
                case 'FAILED':
                    await this.handlePaymentFailed({
                        id: transactionId,
                        order_id: event.merchantTransactionId,
                        error_description: 'Payment failed'
                    })
                    break
                default:
                    console.log(`Unhandled webhook state: ${state}`)
            }

            return { success: true }
        } catch (error) {
            console.error('Webhook handling error:', error)
            throw error
        }
    }

    verifyWebhookSignature(body, signature) {
        try {
            // PhonePe webhook signature verification
            const webhookPayload = JSON.stringify(body);
            const stringToHash = webhookPayload + this.saltKey;
            const expectedSignature = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + this.saltIndex;

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
                    phonepe_transaction_id: payment.id
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