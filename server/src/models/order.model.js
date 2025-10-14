import mongoose from 'mongoose'
import TimezoneUtil from '../util/timezone.js'

export const EOrderStatus = Object.freeze({
    UPCOMING: 'upcoming',
    PREPARING: 'preparing',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    SKIPPED: 'skipped',
    CANCELLED: 'cancelled'
})

export const EMealType = Object.freeze({
    LUNCH: 'lunch',
    DINNER: 'dinner'
})

export const EOrderAction = Object.freeze({
    SKIP: 'skip',
    CANCEL: 'cancel',
    SWITCH_VENDOR: 'switch_vendor'
})

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserSubscription',
            required: true
        },
        dailyMealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DailyMeal',
            required: true
        },
        orderDate: {
            type: Date,
            required: true
        },
        deliveryDate: {
            type: Date,
            required: true
        },
        mealType: {
            type: String,
            enum: [...Object.values(EMealType)],
            required: true
        },
        selectedMenus: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu',
            required: true
        }],
        deliveryTime: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        deliveryAddress: {
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            state: String,
            country: {
                type: String,
                default: 'India'
            },
            zipCode: {
                type: String,
                required: true
            },
            landmark: String,
            coordinates: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point'
                },
                coordinates: {
                    type: [Number],
                    required: false,  // Make coordinates optional since they might not always be available
                    default: [0, 0]   // Default coordinates if not provided
                }
            }
        },
        vendorDetails: {
            vendorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'VendorProfile',
                required: true
            },
            vendorType: {
                type: String,
                enum: ['home_chef', 'food_vendor'],
                required: true
            }
        },
        status: {
            type: String,
            enum: [...Object.values(EOrderStatus)],
            default: EOrderStatus.UPCOMING
        },
        statusHistory: [{
            _id: false,
            status: {
                type: String,
                enum: [...Object.values(EOrderStatus)],
                required: true
            },
            updatedAt: {
                type: Date,
                default: Date.now
            },
            updatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            notes: String
        }],
        creditsUsed: {
            type: Number,
            default: 1,
            min: 0
        },
        isCreditsDeducted: {
            type: Boolean,
            default: false
        },
        skipDetails: {
            isSkipped: {
                type: Boolean,
                default: false
            },
            skippedAt: Date,
            skipReason: String,
            creditsRefunded: {
                type: Boolean,
                default: false
            }
        },
        cancellationDetails: {
            isCancelled: {
                type: Boolean,
                default: false
            },
            cancelledAt: Date,
            cancelReason: String,
            cancelledBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        },
        deliveryConfirmation: {
            confirmedAt: Date,
            confirmedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            deliveryNotes: String,
            deliveryPhotos: [String]
        },
        specialInstructions: {
            type: String,
            maxlength: 500
        }
    },
    { timestamps: true }
)

// Indexes for performance
orderSchema.index({ orderNumber: 1 }, { unique: true })
orderSchema.index({ userId: 1 })
orderSchema.index({ userSubscriptionId: 1 })
orderSchema.index({ deliveryDate: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ 'vendorDetails.vendorId': 1 })
orderSchema.index({ mealType: 1 })
orderSchema.index({ orderDate: 1 })
orderSchema.index({ isCreditsDeducted: 1 })

// Compound indexes for common queries
orderSchema.index({ userId: 1, status: 1 })
orderSchema.index({ userId: 1, deliveryDate: 1 })
orderSchema.index({ 'vendorDetails.vendorId': 1, status: 1 })
orderSchema.index({ deliveryDate: 1, status: 1 })
orderSchema.index({ userSubscriptionId: 1, deliveryDate: 1 })
orderSchema.index({ status: 1, deliveryDate: 1 })

// Pre-save hook to generate order number
orderSchema.pre('save', async function (next) {
    try {
        if (this.isNew && !this.orderNumber) {
            console.log('🔢 Generating order number for new order...', {
                orderDate: this.orderDate,
                userId: this.userId,
                mealType: this.mealType
            })

            if (!this.orderDate) {
                console.error('❌ orderDate is missing for order number generation')
                throw new Error('orderDate is required to generate orderNumber')
            }

            let date, count;
            try {
                // Try using TimezoneUtil first
                date = TimezoneUtil.format(this.orderDate, 'date').replace(/\//g, '')
                count = await this.constructor.countDocuments({
                    orderDate: {
                        $gte: TimezoneUtil.startOfDay(this.orderDate),
                        $lte: TimezoneUtil.endOfDay(this.orderDate)
                    }
                })
            } catch (timezoneError) {
                console.error('❌ TimezoneUtil error, using fallback:', timezoneError)
                // Fallback to basic date formatting
                const orderDate = new Date(this.orderDate)
                date = orderDate.getFullYear().toString() +
                    (orderDate.getMonth() + 1).toString().padStart(2, '0') +
                    orderDate.getDate().toString().padStart(2, '0')

                const startOfDay = new Date(orderDate)
                startOfDay.setHours(0, 0, 0, 0)
                const endOfDay = new Date(orderDate)
                endOfDay.setHours(23, 59, 59, 999)

                count = await this.constructor.countDocuments({
                    orderDate: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                })
            }

            this.orderNumber = `TFX-${date}-${(count + 1).toString().padStart(4, '0')}`
            console.log(`✅ Generated order number: ${this.orderNumber}`)
        }
        next()
    } catch (error) {
        console.error('❌ Error generating order number:', error)
        next(error)
    }
})

// Instance methods
orderSchema.methods.updateStatus = function (newStatus, updatedBy, notes = '') {
    this.status = newStatus
    this.statusHistory.push({
        status: newStatus,
        updatedAt: TimezoneUtil.now(),
        updatedBy: updatedBy,
        notes: notes
    })
    return this.save()
}

orderSchema.methods.canSkip = function () {
    const now = TimezoneUtil.now()
    const deliveryTime = TimezoneUtil.parseTimeString(this.deliveryTime, this.deliveryDate)

    // Can skip if delivery is at least 2 hours away and status is upcoming
    return this.status === EOrderStatus.UPCOMING &&
        (deliveryTime.getTime() - now.getTime()) > (2 * 60 * 60 * 1000)
}

orderSchema.methods.canCancel = function () {
    const now = TimezoneUtil.now()
    const deliveryTime = TimezoneUtil.parseTimeString(this.deliveryTime, this.deliveryDate)

    // Can cancel if delivery is at least 1 hour away and status is upcoming
    return this.status === EOrderStatus.UPCOMING &&
        (deliveryTime.getTime() - now.getTime()) > (1 * 60 * 60 * 1000)
}

orderSchema.methods.skipOrder = function (skipReason = '', userId) {
    if (!this.canSkip()) {
        throw new Error('Order cannot be skipped at this time')
    }

    this.status = EOrderStatus.SKIPPED
    this.skipDetails = {
        isSkipped: true,
        skippedAt: TimezoneUtil.now(),
        skipReason: skipReason,
        creditsRefunded: true
    }

    this.statusHistory.push({
        status: EOrderStatus.SKIPPED,
        updatedAt: TimezoneUtil.now(),
        updatedBy: userId,
        notes: `Order skipped by user: ${skipReason}`
    })

    return this.save()
}

orderSchema.methods.cancelOrder = function (cancelReason = '', userId) {
    if (!this.canCancel()) {
        throw new Error('Order cannot be cancelled at this time')
    }

    this.status = EOrderStatus.CANCELLED
    this.cancellationDetails = {
        isCancelled: true,
        cancelledAt: TimezoneUtil.now(),
        cancelReason: cancelReason,
        cancelledBy: userId
    }

    this.statusHistory.push({
        status: EOrderStatus.CANCELLED,
        updatedAt: TimezoneUtil.now(),
        updatedBy: userId,
        notes: `Order cancelled by user: ${cancelReason}`
    })

    // Credits are still deducted for cancellation
    this.isCreditsDeducted = true

    return this.save()
}

orderSchema.methods.confirmDelivery = function (confirmedBy, notes = '', photos = []) {
    if (this.status !== EOrderStatus.OUT_FOR_DELIVERY) {
        throw new Error('Order must be out for delivery to confirm')
    }

    this.status = EOrderStatus.DELIVERED
    this.deliveryConfirmation = {
        confirmedAt: TimezoneUtil.now(),
        confirmedBy: confirmedBy,
        deliveryNotes: notes,
        deliveryPhotos: photos
    }

    this.statusHistory.push({
        status: EOrderStatus.DELIVERED,
        updatedAt: TimezoneUtil.now(),
        updatedBy: confirmedBy,
        notes: 'Order delivered and confirmed by admin'
    })

    this.isCreditsDeducted = true

    return this.save()
}

orderSchema.methods.isToday = function () {
    const today = TimezoneUtil.startOfDay()
    const orderDay = TimezoneUtil.startOfDay(this.deliveryDate)
    return today.getTime() === orderDay.getTime()
}

orderSchema.methods.isPast = function () {
    const today = TimezoneUtil.startOfDay()
    const orderDay = TimezoneUtil.startOfDay(this.deliveryDate)
    return orderDay.getTime() < today.getTime()
}

orderSchema.methods.isFuture = function () {
    const today = TimezoneUtil.startOfDay()
    const orderDay = TimezoneUtil.startOfDay(this.deliveryDate)
    return orderDay.getTime() > today.getTime()
}

// Static methods
orderSchema.statics.findByUser = function (userId, options = {}) {
    const { status, startDate, endDate, limit = 50, page = 1 } = options

    const query = { userId }

    if (status) {
        query.status = status
    }

    if (startDate || endDate) {
        query.deliveryDate = {}
        if (startDate) query.deliveryDate.$gte = TimezoneUtil.startOfDay(startDate)
        if (endDate) query.deliveryDate.$lte = TimezoneUtil.endOfDay(endDate)
    }

    return this.find(query)
        .populate('selectedMenus', 'foodTitle foodImage price')
        .populate('vendorDetails.vendorId', 'businessInfo.businessName')
        .sort({ deliveryDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
}

orderSchema.statics.findByVendor = function (vendorId, options = {}) {
    const { status, startDate, endDate, limit = 50, page = 1 } = options

    const query = { 'vendorDetails.vendorId': vendorId }

    if (status) {
        query.status = status
    }

    if (startDate || endDate) {
        query.deliveryDate = {}
        if (startDate) query.deliveryDate.$gte = TimezoneUtil.startOfDay(startDate)
        if (endDate) query.deliveryDate.$lte = TimezoneUtil.endOfDay(endDate)
    }

    return this.find(query)
        .populate('userId', 'name phoneNumber')
        .populate('selectedMenus', 'foodTitle foodImage')
        .sort({ deliveryDate: 1, deliveryTime: 1 })
        .limit(limit)
        .skip((page - 1) * limit)
}

orderSchema.statics.findTodayOrders = function (vendorId = null) {
    const today = TimezoneUtil.startOfDay()
    const tomorrow = TimezoneUtil.addDays(1, today)

    const query = {
        deliveryDate: {
            $gte: today,
            $lt: tomorrow
        },
        status: { $nin: [EOrderStatus.SKIPPED, EOrderStatus.CANCELLED] }
    }

    if (vendorId) {
        query['vendorDetails.vendorId'] = vendorId
    }

    return this.find(query)
        .populate('userId', 'name phoneNumber')
        .populate('selectedMenus', 'foodTitle')
        .populate('vendorDetails.vendorId', 'businessInfo.businessName')
        .sort({ deliveryTime: 1 })
}

orderSchema.statics.findUpcomingOrders = function (vendorId = null, days = 7) {
    const today = TimezoneUtil.startOfDay()
    const futureDate = TimezoneUtil.addDays(days, today)

    const query = {
        deliveryDate: {
            $gte: today,
            $lte: futureDate
        },
        status: EOrderStatus.UPCOMING
    }

    if (vendorId) {
        query['vendorDetails.vendorId'] = vendorId
    }

    return this.find(query)
        .populate('userId', 'name phoneNumber')
        .populate('selectedMenus', 'foodTitle')
        .populate('vendorDetails.vendorId', 'businessInfo.businessName')
        .sort({ deliveryDate: 1, deliveryTime: 1 })
}

orderSchema.statics.findPendingDeliveries = function () {
    return this.find({
        status: EOrderStatus.OUT_FOR_DELIVERY
    })
        .populate('userId', 'name phoneNumber')
        .populate('vendorDetails.vendorId', 'businessInfo.businessName')
        .sort({ deliveryDate: 1, deliveryTime: 1 })
}

orderSchema.statics.getOrderStats = function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                orderDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalCredits: { $sum: '$creditsUsed' }
            }
        }
    ])
}

export default mongoose.model('Order', orderSchema)