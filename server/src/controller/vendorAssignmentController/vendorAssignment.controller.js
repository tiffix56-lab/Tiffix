

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
import VendorProfile from '../../models/vendorProfile.model.js'
import TimezoneUtil from '../../util/timezone.js'
import { ESubscriptionStatus } from '../../constant/application.js'

export default {
    // Get all pending vendor assignment requests (both initial and switches)
    getAllPendingRequests: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateVendorAssignmentQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                page = 1,
                limit = 20,
                requestType,
                priority,
                deliveryZone,
                search,
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

            let requests;
            if (search) {
                requests = await VendorAssignmentRequest.aggregate([
                    { $match: query },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userId'
                        }
                    },
                    {
                        $lookup: {
                            from: 'usersubscriptions',
                            localField: 'userSubscriptionId',
                            foreignField: '_id',
                            as: 'userSubscriptionId'
                        }
                    },
                    {
                        $lookup: {
                            from: 'vendorprofiles',
                            localField: 'currentVendorId',
                            foreignField: '_id',
                            as: 'currentVendorId'
                        }
                    },
                    {
                        $lookup: {
                            from: 'locationzones',
                            localField: 'deliveryZone',
                            foreignField: '_id',
                            as: 'deliveryZone'
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { description: { $regex: search, $options: 'i' } },
                                { adminNotes: { $regex: search, $options: 'i' } },
                                { rejectionReason: { $regex: search, $options: 'i' } },
                                { 'userId.name': { $regex: search, $options: 'i' } },
                                { 'userId.emailAddress': { $regex: search, $options: 'i' } },
                                { 'currentVendorId.businessInfo.businessName': { $regex: search, $options: 'i' } }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            userId: { $arrayElemAt: ['$userId', 0] },
                            userSubscriptionId: { $arrayElemAt: ['$userSubscriptionId', 0] },
                            currentVendorId: { $arrayElemAt: ['$currentVendorId', 0] },
                            deliveryZone: { $arrayElemAt: ['$deliveryZone', 0] }
                        }
                    },
                    { $sort: sortObj },
                    { $skip: skip },
                    { $limit: Number(limit) }
                ])
            } else {
                requests = await VendorAssignmentRequest.find(query)
                    .populate('userId', 'name emailAddress phoneNumber')
                    .populate('userSubscriptionId', 'startDate endDate deliveryAddress mealTiming')
                    .populate('currentVendorId', 'businessInfo contactInfo')
                    .populate('deliveryZone', 'zoneName city supportedVendorTypes')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(Number(limit))
            }

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
            const errorMessage = error.message || 'Internal server error while fetching pending requests';
            httpError(next, new Error(errorMessage), req, 500)
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
            const errorMessage = error.message || 'Internal server error while fetching pending initial assignments';
            httpError(next, new Error(errorMessage), req, 500)
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
            const errorMessage = error.message || 'Internal server error while fetching pending vendor switches';
            httpError(next, new Error(errorMessage), req, 500)
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
            const errorMessage = error.message || 'Internal server error while fetching urgent requests';
            httpError(next, new Error(errorMessage), req, 500)
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
            const errorMessage = error.message || 'Internal server error while fetching requests by zone';
            httpError(next, new Error(errorMessage), req, 500)
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
                return httpError(next, new Error('Assignment request not found'), req, 404)
            }

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
            const errorMessage = error.message || 'Internal server error while fetching available vendors';
            httpError(next, new Error(errorMessage), req, 500)
        }
    },

    // Assign vendor to a request
    assignVendor: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateAssignVendor, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { requestId } = req.params
            const { vendorId, adminNotes } = req.body
            const adminUserId = req.authenticatedUser._id

            const request = await VendorAssignmentRequest.findById(requestId)
                .populate('userSubscriptionId')

            if (!request) {
                return httpError(next, new Error('Assignment request not found'), req, 404)
            }

            if (request.status !== 'pending') {
                return httpError(next, new Error('Request has already been processed'), req, 400)
            }

            if (request.userSubscriptionId.status !== ESubscriptionStatus.ACTIVE) {
                request.status = "rejected";
                await request.save();
                return httpError(next, new Error('Subscription is not active'), req, 400);
            }

            // Validate vendor exists and is available
            const vendor = await VendorProfile.findById(vendorId)
            if (!vendor) {
                return httpError(next, new Error('Vendor not found'), req, 404)
            }

            if (!vendor.isAvailable || !vendor.isVerified) {
                return httpError(next, new Error('Vendor is not available for assignment'), req, 400)
            }

            const userSubscription = request.userSubscriptionId

            await userSubscription.assignVendor(vendorId, vendor.vendorType, adminUserId)

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
            const errorMessage = error.message || 'Internal server error while assigning vendor';
            httpError(next, new Error(errorMessage), req, 500)
        }
    },

    // Reject a vendor assignment request
    rejectRequest: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateRejectRequest, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { requestId } = req.params
            const { rejectionReason, adminNotes } = req.body
            const adminUserId = req.authenticatedUser._id

            const request = await VendorAssignmentRequest.findById(requestId)

            if (!request) {
                return httpError(next, new Error('Assignment request not found'), req, 404)
            }

            if (request.status !== 'pending') {
                return httpError(next, new Error('Request has already been processed'), req, 400)
            }

            await request.reject(adminUserId, rejectionReason, adminNotes)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Request rejected successfully',
                request: request
            })

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while rejecting request';
            httpError(next, new Error(errorMessage), req, 500)
        }
    },

    // Update request priority
    updatePriority: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateUpdatePriority, req.body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { requestId } = req.params
            const { priority } = req.body

            const request = await VendorAssignmentRequest.findById(requestId)
                .populate('userSubscriptionId');

            if (!request) {
                return httpError(next, new Error('Assignment request not found'), req, 404);
            }

            // Check if userSubscriptionId is populated and valid
            if (!request.userSubscriptionId) {
                return httpError(next, new Error('Associated subscription not found'), req, 404);
            }

            // Check subscription status
            if (request.userSubscriptionId.status !== ESubscriptionStatus.ACTIVE) {
                return httpError(next, new Error('Associated subscription is not active'), req, 400);
            }

            if (request.status !== 'pending') {
                return httpError(next, new Error('Cannot update priority of processed request'), req, 400);
            }

            await request.updatePriority(priority);


            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Priority updated successfully',
                request: request
            })

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while updating priority';
            httpError(next, new Error(errorMessage), req, 500)
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
                return httpError(next, new Error('Assignment request not found'), req, 404)
            }

            await request.userSubscriptionId.populate('subscriptionId', 'planName category duration')

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                request
            })

        } catch (error) {
            const errorMessage = error.message || 'Internal server error while fetching request details';
            httpError(next, new Error(errorMessage), req, 500)
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
            const errorMessage = error.message || 'Internal server error while fetching assignment stats';
            httpError(next, new Error(errorMessage), req, 500)
        }
    },

    // Get all assignment requests with advanced filtering
    getAllRequests: async (req, res, next) => {
        try {
            const { error } = validateJoiSchema(ValidateVendorAssignmentQuery, req.query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const {
                page = 1,
                limit = 20,
                status,
                requestType,
                priority,
                deliveryZone,
                search,
                startDate,
                endDate,
                sortBy = 'requestedAt',
                sortOrder = 'desc'
            } = req.query;

            const skip = (page - 1) * limit;
            const query = {};

            if (status) query.status = status;
            if (requestType) query.requestType = requestType;
            if (priority) query.priority = priority;
            if (deliveryZone) query.deliveryZone = deliveryZone;

            if (startDate || endDate) {
                query.requestedAt = {};
                if (startDate) query.requestedAt.$gte = TimezoneUtil.toIST(startDate);
                if (endDate) query.requestedAt.$lte = TimezoneUtil.endOfDay(endDate);
            }

            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const pipeline = [
                {
                    $lookup: {
                        from: 'usersubscriptions',
                        localField: 'userSubscriptionId',
                        foreignField: '_id',
                        as: 'userSubscription'
                    }
                },
                {
                    $match: {
                        'userSubscription.status': 'active',
                        'userSubscription.endDate': { $gte: TimezoneUtil.now() }
                    }
                },
                { $match: query },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userId'
                    }
                },
                {
                    $lookup: {
                        from: 'usersubscriptions',
                        localField: 'userSubscriptionId',
                        foreignField: '_id',
                        as: 'userSubscriptionId'
                    }
                },
                {
                    $lookup: {
                        from: 'vendorprofiles',
                        localField: 'currentVendorId',
                        foreignField: '_id',
                        as: 'currentVendorId'
                    }
                },
                {
                    $lookup: {
                        from: 'vendorprofiles',
                        localField: 'newVendorId',
                        foreignField: '_id',
                        as: 'newVendorId'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'processedBy',
                        foreignField: '_id',
                        as: 'processedBy'
                    }
                },
                {
                    $lookup: {
                        from: 'locationzones',
                        localField: 'deliveryZone',
                        foreignField: '_id',
                        as: 'deliveryZone'
                    }
                },
                {
                    $addFields: {
                        userId: { $arrayElemAt: ['$userId', 0] },
                        userSubscriptionId: { $arrayElemAt: ['$userSubscriptionId', 0] },
                        currentVendorId: { $arrayElemAt: ['$currentVendorId', 0] },
                        newVendorId: { $arrayElemAt: ['$newVendorId', 0] },
                        processedBy: { $arrayElemAt: ['$processedBy', 0] },
                        deliveryZone: { $arrayElemAt: ['$deliveryZone', 0] }
                    }
                },
                {
                    $lookup: {
                        from: 'vendorprofiles',
                        localField: 'userSubscriptionId.vendorDetails.currentVendor.vendorId',
                        foreignField: '_id',
                        as: 'subscriptionVendorDetails'
                    }
                },
                {
                    $addFields: {
                        'userSubscriptionId.vendorDetails.currentVendor.vendorBusinessName': {
                            $let: {
                                vars: { vendor: { $arrayElemAt: ['$subscriptionVendorDetails', 0] } },
                                in: '$$vendor.businessInfo.businessName'
                            }
                        }
                    }
                },
                {
                    $unset: 'subscriptionVendorDetails'
                }
            ];

            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { description: { $regex: search, $options: 'i' } },
                            { adminNotes: { $regex: search, $options: 'i' } },
                            { rejectionReason: { $regex: search, $options: 'i' } },
                            { 'userId.name': { $regex: search, $options: 'i' } },
                            { 'userId.emailAddress': { $regex: search, $options: 'i' } },
                            { 'currentVendorId.businessInfo.businessName': { $regex: search, $options: 'i' } },
                            { 'newVendorId.businessInfo.businessName': { $regex: search, $options: 'i' } },
                            { 'processedBy.name': { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            const dataPipeline = [...pipeline, { $sort: sortObj }, { $skip: skip }, { $limit: Number(limit) }];
            const requests = await VendorAssignmentRequest.aggregate(dataPipeline);

            const countPipeline = [
                {
                    $lookup: {
                        from: 'usersubscriptions',
                        localField: 'userSubscriptionId',
                        foreignField: '_id',
                        as: 'userSubscription'
                    }
                },
                {
                    $match: {
                        'userSubscription.status': 'active',
                        'userSubscription.endDate': { $gte: TimezoneUtil.now() }
                    }
                },
                { $match: query },
                { $count: 'total' }
            ];
            const countResult = await VendorAssignmentRequest.aggregate(countPipeline);
            const totalRequests = countResult.length > 0 ? countResult[0].total : 0;
            const totalPages = Math.ceil(totalRequests / limit);

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
                    search,
                    startDate,
                    endDate
                }
            });
        } catch (error) {
            const errorMessage = error.message || 'Internal server error while fetching all requests';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
}