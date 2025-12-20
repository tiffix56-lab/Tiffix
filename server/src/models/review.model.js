import mongoose from 'mongoose'
import TimezoneUtil from '../util/timezone.js'

export const EReviewType = Object.freeze({
    SUBSCRIPTION: 'subscription',
    VENDOR: 'vendor', 
    ORDER: 'order'
})

export const EReviewStatus = Object.freeze({
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    REPORTED: 'reported'
})

const reviewSchema = new mongoose.Schema(
    {
        reviewType: {
            type: String,
            enum: [...Object.values(EReviewType)],
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        
        // Reference fields based on review type
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
            required: function() {
                return this.reviewType === EReviewType.SUBSCRIPTION
            }
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorProfile',
            required: function() {
                return this.reviewType === EReviewType.VENDOR
            }
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: function() {
                return this.reviewType === EReviewType.ORDER
            }
        },
        
        // Review content
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        reviewText: {
            type: String,
            required: true,
            maxlength: 1000,
            trim: true
        },
        
        // Review metadata
        status: {
            type: String,
            enum: [...Object.values(EReviewStatus)],
            default: EReviewStatus.ACTIVE
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: true
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

// Indexes for performance
reviewSchema.index({ userId: 1 })
reviewSchema.index({ reviewType: 1 })
reviewSchema.index({ subscriptionId: 1 })
reviewSchema.index({ vendorId: 1 })
reviewSchema.index({ orderId: 1 })
reviewSchema.index({ rating: 1 })
reviewSchema.index({ status: 1 })
reviewSchema.index({ createdAt: -1 })

// Compound indexes for common queries
reviewSchema.index({ reviewType: 1, status: 1 })
reviewSchema.index({ vendorId: 1, status: 1, rating: -1 })
reviewSchema.index({ subscriptionId: 1, status: 1, rating: -1 })
reviewSchema.index({ userId: 1, reviewType: 1 })

// Ensure one review per user per item
// Unique constraint for Order Reviews - Keep this
reviewSchema.index(
    { userId: 1, orderId: 1, reviewType: 1 }, 
    { 
        unique: true, 
        partialFilterExpression: { reviewType: EReviewType.ORDER } 
    }
)

// Non-unique indexes for Subscription and Vendor reviews (previously unique)
// Allowed multiple reviews for same subscription/vendor by same user (e.g. per order)
reviewSchema.index({ userId: 1, subscriptionId: 1, reviewType: 1 })
reviewSchema.index({ userId: 1, vendorId: 1, reviewType: 1 })

// Virtual for formatted review date
reviewSchema.virtual('formattedDate').get(function() {
    return TimezoneUtil.format(this.createdAt, 'datetime')
})

// Instance methods
reviewSchema.methods.canEdit = function(userId) {
    return this.userId.toString() === userId.toString() && 
           TimezoneUtil.now().getTime() - this.createdAt.getTime() < (24 * 60 * 60 * 1000) // 24 hours
}

reviewSchema.methods.moderate = function(status, adminUserId) {
    this.status = status
    return this.save()
}

// Static methods
reviewSchema.statics.findByUser = function(userId, options = {}) {
    const { reviewType, status = EReviewStatus.ACTIVE, limit = 20, page = 1 } = options
    
    const query = { userId, status }
    if (reviewType) query.reviewType = reviewType
    
    return this.find(query)
        .populate('subscriptionId', 'planName category')
        .populate('vendorId', 'businessInfo.businessName')
        .populate('orderId', 'orderNumber mealType deliveryDate')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
}

reviewSchema.statics.findForSubscription = function(subscriptionId, options = {}) {
    const { status = EReviewStatus.ACTIVE, limit = 20, page = 1, sortBy = 'createdAt' } = options
    
    return this.find({ 
        subscriptionId, 
        reviewType: EReviewType.SUBSCRIPTION,
        status 
    })
        .populate('userId', 'name')
        .sort({ [sortBy]: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
}

reviewSchema.statics.findForVendor = function(vendorId, options = {}) {
    const { status = EReviewStatus.ACTIVE, limit = 20, page = 1, minRating, maxRating } = options
    
    const query = { 
        vendorId, 
        reviewType: EReviewType.VENDOR,
        status 
    }
    
    if (minRating) query.rating = { $gte: minRating }
    if (maxRating) query.rating = { ...query.rating, $lte: maxRating }
    
    return this.find(query)
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
}

reviewSchema.statics.findForOrder = function(orderId) {
    return this.findOne({ 
        orderId, 
        reviewType: EReviewType.ORDER,
        status: EReviewStatus.ACTIVE 
    }).populate('userId', 'name')
}

reviewSchema.statics.getAverageRating = function(targetId, reviewType) {
    const matchField = reviewType === EReviewType.SUBSCRIPTION ? 'subscriptionId' :
                      reviewType === EReviewType.VENDOR ? 'vendorId' : 'orderId'
    
    return this.aggregate([
        {
            $match: {
                [matchField]: targetId,
                reviewType: reviewType,
                status: EReviewStatus.ACTIVE
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        },
        {
            $project: {
                _id: 0,
                averageRating: { $round: ['$averageRating', 2] },
                totalReviews: 1,
                ratingDistribution: 1
            }
        }
    ])
}

reviewSchema.statics.getReviewStats = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$reviewType',
                count: { $sum: 1 },
                averageRating: { $avg: '$rating' }
            }
        }
    ])
}

export default mongoose.model('Review', reviewSchema)