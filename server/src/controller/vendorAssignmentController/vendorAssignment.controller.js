

import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import {
    validateJoiSchema,
    ValidateVendorAssignmentQuery,
    ValidateAssignVendor,
    ValidateRejectRequest,
    ValidateUpdatePriority
} from '../../service/validationService.js'
import VendorAssignmentRequest from '../../models/vendorSwitchRequest.model.js'
import UserSubscription from '../../models/userSubscription.model.js'
import VendorProfile from '../../models/vendorProfile.model.js'
import LocationZone from '../../models/locationZone.model.js'
import TimezoneUtil from '../../util/timezone.js'

export default {
    // Get all pending vendor assignment requests (both initial and switches)
    getAllPendingRequests: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateVendorAssignmentQuery, req.query);
            if (error) {
                return httpError(next, new Error(error), req, 422);
            }

            const {
                page = 1,
                limit = 20,
                requestType,
                priority,
                deliveryZone,
                sortBy = 'priority',
                sortOrder = 'asc'
            } = req.query

            const skip = (page - 1) * limit
            const query = { status: 'pending' }

            // Apply filters
            if (requestType) query.requestType = requestType
            if (priority) query.priority = priority
            if (deliveryZone) query.deliveryZone = deliveryZone

            const sortObj = {}
            if (sortBy === 'priority') {
                sortObj.priority = 1
                sortObj.requestedAt = 1
            } else {
                sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1
            }

            const requests = await VendorAssignmentRequest.find(query)
                .populate('userId', 'name emailAddress phoneNumber')
                .populate('userSubscriptionId', 'startDate endDate deliveryAddress mealTiming')
                .populate('currentVendorId', 'businessInfo contactInfo')
                .populate('deliveryZone', 'zoneName city supportedVendorTypes')
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))

            const totalRequests = await VendorAssignmentRequest.countDocuments(query)
            const totalPages = Math.ceil(totalRequests / limit)

            const stats = await VendorAssignmentRequest.aggregate([
                { $match: { status: 'pending' } },
                {
                    $group: {
                        _id: { requestType: '$requestType', priority: '$priority' },
                        count: { $sum: 1 }
                    }
                }
            ])

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                requests,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalRequests,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                stats
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Get pending initial assignments only
    getPendingInitialAssignments: async (req, res, next) => {
        try {
            const requests = await VendorAssignmentRequest.findPendingInitialAssignments()

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                requests,
                count: requests.length
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Get pending vendor switches only
    getPendingVendorSwitches: async (req, res, next) => {
        try {
            const requests = await VendorAssignmentRequest.findPendingVendorSwitches()

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                requests,
                count: requests.length
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Get urgent requests that need immediate attention
    getUrgentRequests: async (req, res, next) => {
        try {
            const requests = await VendorAssignmentRequest.findUrgentRequests()

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                requests,
                count: requests.length
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Get requests by delivery zone
    getRequestsByZone: async (req, res, next) => {
        try {
            const { zoneId } = req.params
            const requests = await VendorAssignmentRequest.findByZone(zoneId)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                requests,
                count: requests.length
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Get available vendors for assignment based on zone and subscription category
    getAvailableVendors: async (req, res, next) => {
        try {
            const { requestId } = req.params

            const request = await VendorAssignmentRequest.findById(requestId)
                .populate('userSubscriptionId')
                .populate('deliveryZone')

            if (!request) {
                return httpError(next, 'Assignment request not found', req, 404)
            }

            // Get subscription to determine category
            const userSubscription = request.userSubscriptionId
            await userSubscription.populate('subscriptionId')
            const subscriptionCategory = userSubscription.subscriptionId.category

            const query = {
                isVerified: true,
                isAvailable: true,
                vendorType: subscriptionCategory
            }

            if (request.deliveryZone) {
                const vendors = await VendorProfile.find(query)
                    .populate('userId', 'name emailAddress phoneNumber')
                    .sort({ 'rating.average': -1, 'capacity.dailyOrders': -1 })

                httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    vendors,
                    requestDetails: {
                        requestId: request._id,
                        requestType: request.requestType,
                        subscriptionCategory,
                        deliveryZone: request.deliveryZone,
                        customerAddress: userSubscription.deliveryAddress
                    }
                })
            } else {
                const vendors = await VendorProfile.find(query)
                    .populate('userId', 'name emailAddress phoneNumber')
                    .sort({ 'rating.average': -1, 'capacity.dailyOrders': -1 })

                httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    vendors,
                    requestDetails: {
                        requestId: request._id,
                        requestType: request.requestType,
                        subscriptionCategory,
                        customerAddress: userSubscription.deliveryAddress
                    }
                })
            }

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Assign vendor to a request
    assignVendor: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateAssignVendor, req.body);
            if (error) {
                return httpError(next, new Error(error), req, 422);
            }

            const { requestId } = req.params
            const { vendorId, adminNotes } = req.body
            const adminUserId = req.authenticatedUser._id

            // Validate request exists and is pending
            const request = await VendorAssignmentRequest.findById(requestId)
                .populate('userSubscriptionId')

            if (!request) {
                return httpError(next, 'Assignment request not found', req, 404)
            }

            if (request.status !== 'pending') {
                return httpError(next, 'Request has already been processed', req, 400)
            }

            // Validate vendor exists and is available
            const vendor = await VendorProfile.findById(vendorId)
            if (!vendor) {
                return httpError(next, 'Vendor not found', req, 404)
            }

            if (!vendor.isAvailable || !vendor.isVerified) {
                return httpError(next, 'Vendor is not available for assignment', req, 400)
            }

            const userSubscription = request.userSubscriptionId

            // Assign vendor to the subscription
            await userSubscription.assignVendor(vendorId, vendor.vendorType, adminUserId)

            // Mark the switch as used if this is a vendor switch request
            if (request.requestType === 'vendor_switch') {
                await userSubscription.useVendorSwitch()
            }

            await request.approve(adminUserId, vendorId, adminNotes)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Vendor assigned successfully',
                request: request,
                assignedVendor: {
                    vendorId: vendor._id,
                    businessName: vendor.businessInfo.businessName,
                    vendorType: vendor.vendorType
                }
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Reject a vendor assignment request
    rejectRequest: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateRejectRequest, req.body);
            if (error) {
                return httpError(next, new Error(error), req, 422);
            }

            const { requestId } = req.params
            const { rejectionReason, adminNotes } = req.body
            const adminUserId = req.authenticatedUser._id

            const request = await VendorAssignmentRequest.findById(requestId)

            if (!request) {
                return httpError(next, 'Assignment request not found', req, 404)
            }

            if (request.status !== 'pending') {
                return httpError(next, 'Request has already been processed', req, 400)
            }

            await request.reject(adminUserId, rejectionReason, adminNotes)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Request rejected successfully',
                request: request
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Update request priority
    updatePriority: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateUpdatePriority, req.body);
            if (error) {
                return httpError(next, new Error(error), req, 422);
            }

            const { requestId } = req.params
            const { priority } = req.body

            const request = await VendorAssignmentRequest.findById(requestId)

            if (!request) {
                return httpError(next, 'Assignment request not found', req, 404)
            }

            if (request.status !== 'pending') {
                return httpError(next, 'Cannot update priority of processed request', req, 400)
            }

            await request.updatePriority(priority)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Priority updated successfully',
                request: request
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Get assignment request details
    getRequestDetails: async (req, res, next) => {
        try {
            const { requestId } = req.params

            const request = await VendorAssignmentRequest.findById(requestId)
                .populate('userId', 'name emailAddress phoneNumber')
                .populate('userSubscriptionId')
                .populate('currentVendorId', 'businessInfo contactInfo')
                .populate('newVendorId', 'businessInfo contactInfo')
                .populate('processedBy', 'name emailAddress')
                .populate('deliveryZone', 'zoneName city supportedVendorTypes')

            if (!request) {
                return httpError(next, 'Assignment request not found', req, 404)
            }

            // Also populate subscription details
            await request.userSubscriptionId.populate('subscriptionId', 'planName category duration')

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                request
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Get assignment statistics and dashboard data
    getAssignmentStats: async (req, res, next) => {
        try {
            const { startDate, endDate } = req.query

            const start = startDate ? TimezoneUtil.toIST(startDate) : TimezoneUtil.addDays(-30)
            const end = endDate ? TimezoneUtil.endOfDay(endDate) : TimezoneUtil.endOfDay()

            const overallStats = await VendorAssignmentRequest.getRequestStats(start, end)

            const pendingStats = await VendorAssignmentRequest.aggregate([
                { $match: { status: 'pending' } },
                {
                    $group: {
                        _id: { requestType: '$requestType', priority: '$priority' },
                        count: { $sum: 1 }
                    }
                }
            ])

            // Processing time analytics
            const processingTimeStats = await VendorAssignmentRequest.aggregate([
                {
                    $match: {
                        status: { $in: ['approved', 'completed'] },
                        processedAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $project: {
                        requestType: 1,
                        processingTime: {
                            $divide: [
                                { $subtract: ['$processedAt', '$requestedAt'] },
                                1000 * 60 * 60
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$requestType',
                        averageProcessingTime: { $avg: '$processingTime' },
                        count: { $sum: 1 }
                    }
                }
            ])

            // Zone-wise distribution
            const zoneStats = await VendorAssignmentRequest.aggregate([
                { $match: { status: 'pending' } },
                {
                    $lookup: {
                        from: 'locationzones',
                        localField: 'deliveryZone',
                        foreignField: '_id',
                        as: 'zone'
                    }
                },
                { $unwind: { path: '$zone', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: {
                            zoneId: '$zone._id',
                            zoneName: '$zone.zoneName',
                            city: '$zone.city'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ])

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                overallStats,
                pendingStats,
                processingTimeStats,
                zoneStats,
                dateRange: {
                    startDate: TimezoneUtil.format(start, 'date'),
                    endDate: TimezoneUtil.format(end, 'date')
                }
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    },

    // Get all assignment requests with advanced filtering
    getAllRequests: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateVendorAssignmentQuery, req.query);
            if (error) {
                return httpError(next, new Error(error), req, 422);
            }

            const {
                page = 1,
                limit = 20,
                status,
                requestType,
                priority,
                deliveryZone,
                startDate,
                endDate,
                sortBy = 'requestedAt',
                sortOrder = 'desc'
            } = req.query

            const skip = (page - 1) * limit
            const query = {}

            // Apply filters
            if (status) query.status = status
            if (requestType) query.requestType = requestType
            if (priority) query.priority = priority
            if (deliveryZone) query.deliveryZone = deliveryZone

            // Date range filter
            if (startDate || endDate) {
                query.requestedAt = {}
                if (startDate) query.requestedAt.$gte = TimezoneUtil.toIST(startDate)
                if (endDate) query.requestedAt.$lte = TimezoneUtil.endOfDay(endDate)
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const requests = await VendorAssignmentRequest.find(query)
                .populate('userId', 'name emailAddress phoneNumber')
                .populate('userSubscriptionId', 'startDate endDate')
                .populate('currentVendorId', 'businessInfo')
                .populate('newVendorId', 'businessInfo')
                .populate('processedBy', 'name')
                .populate('deliveryZone', 'zoneName city')
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))

            const totalRequests = await VendorAssignmentRequest.countDocuments(query)
            const totalPages = Math.ceil(totalRequests / limit)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                requests,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalRequests,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    status,
                    requestType,
                    priority,
                    deliveryZone,
                    startDate,
                    endDate
                }
            })

        } catch (error) {
            httpError(next, new Error(error), req, 500)
        }
    }
}