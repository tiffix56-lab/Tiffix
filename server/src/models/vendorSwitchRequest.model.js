import mongoose from 'mongoose'
import { EVendorType } from '../constant/application.js'
import TimezoneUtil from '../util/timezone.js'

const vendorAssignmentRequestSchema = new mongoose.Schema(
    {
        userSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserSubscription',
            required: true
        },
        requestType: {
            type: String,
            enum: ['initial_assignment', 'vendor_switch'],
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        currentVendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorProfile',
            default: null // Can be null for initial assignments
        },
        reason: {
            type: String,
            enum: [
                'initial_purchase', // For initial assignments
                'poor_food_quality',
                'late_delivery',
                'vendor_unavailable',
                'dietary_restrictions',
                'customer_preference',
                'vendor_switch_request',
                'admin_reassignment',
                'other'
            ],
            required: true
        },
        description: {
            type: String,
            maxlength: 500
        },
        requestedVendorType: {
            type: String,
            enum: [...Object.values(EVendorType)],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed'],
            default: 'pending'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: function() {
                return this.requestType === 'initial_assignment' ? 'high' : 'medium'
            }
        },
        deliveryZone: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LocationZone',
            default: null
        },
        preferredVendors: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorProfile'
        }],
        requestedAt: {
            type: Date,
            default: () => TimezoneUtil.now()
        },
        processedAt: {
            type: Date,
            default: null
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        newVendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorProfile',
            default: null
        },
        adminNotes: {
            type: String,
            maxlength: 500
        },
        rejectionReason: {
            type: String,
            maxlength: 300
        }
    },
    { timestamps: true }
)

// Indexes for performance
vendorAssignmentRequestSchema.index({ userSubscriptionId: 1 })
vendorAssignmentRequestSchema.index({ userId: 1 })
vendorAssignmentRequestSchema.index({ currentVendorId: 1 })
vendorAssignmentRequestSchema.index({ status: 1 })
vendorAssignmentRequestSchema.index({ requestType: 1 })
vendorAssignmentRequestSchema.index({ priority: 1 })
vendorAssignmentRequestSchema.index({ requestedAt: -1 })
vendorAssignmentRequestSchema.index({ processedAt: -1 })
vendorAssignmentRequestSchema.index({ deliveryZone: 1 })

// Compound indexes
vendorAssignmentRequestSchema.index({ status: 1, requestType: 1, priority: 1, requestedAt: -1 })
vendorAssignmentRequestSchema.index({ processedBy: 1, processedAt: -1 })
vendorAssignmentRequestSchema.index({ requestType: 1, status: 1 })

// Instance methods
vendorAssignmentRequestSchema.methods.approve = function (processedBy, newVendorId, adminNotes = null) {
    this.status = 'approved'
    this.processedAt = TimezoneUtil.now()
    this.processedBy = processedBy
    this.newVendorId = newVendorId
    this.adminNotes = adminNotes
    return this.save()
}

vendorAssignmentRequestSchema.methods.reject = function (processedBy, rejectionReason, adminNotes = null) {
    this.status = 'rejected'
    this.processedAt = TimezoneUtil.now()
    this.processedBy = processedBy
    this.rejectionReason = rejectionReason
    this.adminNotes = adminNotes
    return this.save()
}

vendorAssignmentRequestSchema.methods.complete = function () {
    this.status = 'completed'
    return this.save()
}

vendorAssignmentRequestSchema.methods.isPending = function () {
    return this.status === 'pending'
}

vendorAssignmentRequestSchema.methods.isProcessed = function () {
    return ['approved', 'rejected', 'completed'].includes(this.status)
}

vendorAssignmentRequestSchema.methods.isInitialAssignment = function () {
    return this.requestType === 'initial_assignment'
}

vendorAssignmentRequestSchema.methods.isVendorSwitch = function () {
    return this.requestType === 'vendor_switch'
}

vendorAssignmentRequestSchema.methods.updatePriority = function (priority) {
    this.priority = priority
    return this.save()
}

// Static methods
vendorAssignmentRequestSchema.statics.findPendingRequests = function (requestType = null) {
    const query = { status: 'pending' }
    if (requestType) query.requestType = requestType
    
    return this.find(query)
        .populate('userId', 'name emailAddress phoneNumber')
        .populate('userSubscriptionId', 'startDate endDate deliveryAddress')
        .populate('currentVendorId', 'businessInfo')
        .populate('deliveryZone', 'zoneName city supportedVendorTypes')
        .sort({ priority: 1, requestedAt: 1 }) // High priority first, then by time
}

vendorAssignmentRequestSchema.statics.findApprovedRequests = function () {
    return this.find({ status: 'approved' })
        .populate('userId', 'name emailAddress phoneNumber')
        .populate('userSubscriptionId', 'startDate endDate')
        .populate('currentVendorId', 'businessInfo')
        .populate('newVendorId', 'businessInfo')
        .populate('processedBy', 'name')
        .sort({ processedAt: -1 })
}

vendorAssignmentRequestSchema.statics.findByUser = function (userId) {
    return this.find({ userId })
        .populate('currentVendorId', 'businessInfo')
        .populate('newVendorId', 'businessInfo')
        .populate('processedBy', 'name')
        .sort({ requestedAt: -1 })
}

vendorAssignmentRequestSchema.statics.findBySubscription = function (userSubscriptionId) {
    return this.find({ userSubscriptionId })
        .populate('currentVendorId', 'businessInfo')
        .populate('newVendorId', 'businessInfo')
        .populate('processedBy', 'name')
        .sort({ requestedAt: -1 })
}

vendorAssignmentRequestSchema.statics.findByVendor = function (vendorId) {
    return this.find({ currentVendorId: vendorId })
        .populate('userId', 'name emailAddress')
        .populate('userSubscriptionId', 'startDate endDate')
        .sort({ requestedAt: -1 })
}

vendorAssignmentRequestSchema.statics.getRequestStats = function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                requestedAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: { status: '$status', requestType: '$requestType' },
                count: { $sum: 1 }
            }
        }
    ])
}

vendorAssignmentRequestSchema.statics.findRecentRequests = function (days = 7) {
    const cutoffDate = TimezoneUtil.addDays(-days)
    
    return this.find({
        requestedAt: { $gte: cutoffDate }
    })
    .populate('userId', 'name emailAddress')
    .populate('currentVendorId', 'businessInfo')
    .sort({ requestedAt: -1 })
}

// New methods for admin dashboard
vendorAssignmentRequestSchema.statics.findPendingInitialAssignments = function () {
    return this.findPendingRequests('initial_assignment')
}

vendorAssignmentRequestSchema.statics.findPendingVendorSwitches = function () {
    return this.findPendingRequests('vendor_switch')
}

vendorAssignmentRequestSchema.statics.findByZone = function (deliveryZone) {
    return this.find({ deliveryZone, status: 'pending' })
        .populate('userId', 'name emailAddress phoneNumber')
        .populate('userSubscriptionId', 'startDate endDate')
        .sort({ priority: 1, requestedAt: 1 })
}

vendorAssignmentRequestSchema.statics.findUrgentRequests = function () {
    return this.find({ 
        status: 'pending', 
        priority: { $in: ['high', 'urgent'] }
    })
    .populate('userId', 'name emailAddress phoneNumber')
    .populate('userSubscriptionId', 'startDate endDate')
    .populate('deliveryZone', 'zoneName city')
    .sort({ priority: 1, requestedAt: 1 })
}

export default mongoose.model('VendorAssignmentRequest', vendorAssignmentRequestSchema)