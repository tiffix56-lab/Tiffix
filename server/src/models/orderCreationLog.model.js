import mongoose from 'mongoose'
import TimezoneUtil from '../util/timezone.js'

const orderCreationLogSchema = new mongoose.Schema(
    {
        dailyMealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DailyMeal',
            required: true
        },
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
            required: true
        },
        triggerDate: {
            type: Date,
            required: true
        },
        triggeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        totalUsersFound: {
            type: Number,
            required: true
        },
        totalOrdersCreated: {
            type: Number,
            default: 0
        },
        totalOrdersFailed: {
            type: Number,
            default: 0
        },
        successfulOrders: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            userSubscriptionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'UserSubscription'
            },
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Order'
            },
            mealType: {
                type: String,
                enum: ['lunch', 'dinner']
            }
        }],
        failedOrders: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            userSubscriptionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'UserSubscription'
            },
            mealType: {
                type: String,
                enum: ['lunch', 'dinner']
            },
            errorReason: {
                type: String,
                required: true
            },
            errorDetails: {
                type: String
            },
            canRetry: {
                type: Boolean,
                default: true
            }
        }],
        status: {
            type: String,
            enum: ['processing', 'completed', 'partial_success', 'failed'],
            default: 'processing'
        },
        completedAt: {
            type: Date
        }
    },
    { timestamps: true }
)

orderCreationLogSchema.index({ dailyMealId: 1 })
orderCreationLogSchema.index({ subscriptionId: 1 })
orderCreationLogSchema.index({ triggerDate: 1 })
orderCreationLogSchema.index({ triggeredBy: 1 })
orderCreationLogSchema.index({ status: 1 })
orderCreationLogSchema.index({ triggerDate: 1, status: 1 })

orderCreationLogSchema.methods.markCompleted = function() {
    this.status = this.failedOrders.length === 0 ? 'completed' : 'partial_success'
    this.completedAt = TimezoneUtil.now()
    return this.save()
}

orderCreationLogSchema.methods.addSuccessfulOrder = function(userId, userSubscriptionId, orderId, mealType) {
    this.successfulOrders.push({
        userId,
        userSubscriptionId,
        orderId,
        mealType
    })
    this.totalOrdersCreated += 1
    return this.save()
}

orderCreationLogSchema.methods.addFailedOrder = function(userId, userSubscriptionId, mealType, errorReason, errorDetails = '', canRetry = true) {
    this.failedOrders.push({
        userId,
        userSubscriptionId,
        mealType,
        errorReason,
        errorDetails,
        canRetry
    })
    this.totalOrdersFailed += 1
    return this.save()
}

orderCreationLogSchema.statics.findByDailyMeal = function(dailyMealId) {
    return this.findOne({ dailyMealId }).populate('failedOrders.userId', 'name emailAddress phoneNumber')
}

export default mongoose.model('OrderCreationLog', orderCreationLogSchema)