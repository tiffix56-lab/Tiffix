import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import { validateJoiSchema } from '../../service/validationService.js'
import User from '../../models/user.model.js'
import UserSubscription from '../../models/userSubscription.model.js'
import TimezoneUtil from '../../util/timezone.js'
import {
    ValidateUserFilters,
    ValidateBanUser,
    ValidateUnbanUser
} from '../../service/validationService.js'
import { EUserRole } from '../../constant/application.js'

export default {
    // Get user overview statistics
    getUserOverview: async (req, res, next) => {
        try {
            const userStats = await User.getUserStats()

            // Get premium users count (users with at least one subscription)
            const premiumUsersCount = await User.aggregate([
                {
                    $lookup: {
                        from: 'usersubscriptions',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'subscriptions'
                    }
                },
                {
                    $match: {
                        'subscriptions.0': { $exists: true }
                    }
                },
                {
                    $count: 'premiumUsers'
                }
            ])

            const stats = userStats[0] || {
                totalUsers: 0,
                totalActiveUsers: 0,
                totalBannedUsers: 0,
                totalVendors: 0,
                totalAdmins: 0
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                overview: {
                    totalUsers: stats.totalUsers,
                    totalActiveUsers: stats.totalActiveUsers,
                    totalBannedUsers: stats.totalBannedUsers,
                    totalVendors: stats.totalVendors,
                    totalAdmins: stats.totalAdmins,
                    totalPremiumUsers: premiumUsersCount[0]?.premiumUsers || 0
                },
                generatedAt: TimezoneUtil.format(TimezoneUtil.now(), 'datetime')
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get all users with filters and pagination
    getAllUsers: async (req, res, next) => {
        try {
            const { query } = req

            const { error, value } = validateJoiSchema(ValidateUserFilters, query)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const {
                page = 1,
                limit = 10,
                role,
                status,
                search,
                userType,
                hasSubscription,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = value

            const filters = {
                role,
                status,
                search,
                userType,
                hasSubscription
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                sortOrder
            }

            const users = await User.findWithFilters(filters, options)
            const totalCount = await User.countWithFilters(filters)
            const total = totalCount[0]?.total || 0

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                users: users.map(user => ({
                    id: user._id,
                    name: user.name,
                    emailAddress: user.emailAddress,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    isActive: user.isActive,
                    isBanned: user.isBanned,
                    subscriptionCount: user.subscriptionCount || 0,
                    hasActiveSubscription: user.hasActiveSubscription || false,
                    lastLogin: user.lastLogin,
                    location: user.location,
                    createdAt: user.createdAt,
                    banDetails: user.banDetails
                })),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                filters: {
                    role,
                    status,
                    search,
                    userType,
                    hasSubscription,
                    sortBy,
                    sortOrder
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get user by ID with detailed information
    getUserById: async (req, res, next) => {
        try {
            const { id } = req.params

            const user = await User.findById(id)
                .populate('referral.referredBy', 'name emailAddress')

            if (!user) {
                return httpError(next, new Error('User not found'), req, 404)
            }

            // Get user subscriptions
            const subscriptions = await UserSubscription.find({ userId: id })
                .populate('subscriptionId', 'planName duration category')
                .populate('transactionId', 'transactionId finalAmount status')
                .sort({ createdAt: -1 })

            // Get user referrals
            const referrals = await User.findReferredUsers(id)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                user: {
                    ...user.toJSON(),
                    subscriptions,
                    referrals: referrals.map(ref => ({
                        id: ref._id,
                        name: ref.name,
                        emailAddress: ref.emailAddress,
                        createdAt: ref.createdAt
                    })),
                    totalReferrals: referrals.length,
                    totalSubscriptions: subscriptions.length,
                    activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Ban user
    banUser: async (req, res, next) => {
        try {
            const { id } = req.params
            const { body } = req
            const { userId: adminId } = req.authenticatedUser

            const { error, value } = validateJoiSchema(ValidateBanUser, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { reason } = value

            const user = await User.findById(id)
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404)
            }

            if (user.isBanned) {
                return httpError(next, new Error('User is already banned'), req, 400)
            }

            if (user.role === EUserRole.ADMIN) {
                return httpError(next, new Error('Cannot ban admin users'), req, 403)
            }

            await user.banUser(adminId, reason)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'User banned successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    emailAddress: user.emailAddress,
                    isBanned: user.isBanned,
                    banDetails: user.banDetails
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Unban user
    unbanUser: async (req, res, next) => {
        try {
            const { id } = req.params
            const { userId: adminId } = req.authenticatedUser

            const user = await User.findById(id)
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404)
            }

            if (!user.isBanned) {
                return httpError(next, new Error('User is not banned'), req, 400)
            }

            await user.unbanUser(adminId)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'User unbanned successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    emailAddress: user.emailAddress,
                    isBanned: user.isBanned,
                    banDetails: user.banDetails
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Toggle user active status
    toggleUserStatus: async (req, res, next) => {
        try {
            const { id } = req.params

            const user = await User.findById(id)
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404)
            }

            if (user.role === EUserRole.ADMIN) {
                return httpError(next, new Error('Cannot modify admin user status'), req, 403)
            }

            user.isActive = !user.isActive
            await user.save()

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
                user: {
                    id: user._id,
                    name: user.name,
                    emailAddress: user.emailAddress,
                    isActive: user.isActive
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Delete user (soft delete - ban permanently)
    deleteUser: async (req, res, next) => {
        try {
            const { id } = req.params
            const { userId: adminId } = req.authenticatedUser

            const user = await User.findById(id)
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404)
            }

            if (user.role === EUserRole.ADMIN) {
                return httpError(next, new Error('Cannot delete admin users'), req, 403)
            }

            // Check if user has active subscriptions
            const activeSubscriptions = await UserSubscription.countDocuments({
                userId: id,
                status: 'active',
                endDate: { $gte: TimezoneUtil.now() }
            })

            if (activeSubscriptions > 0) {
                return httpError(next, new Error('Cannot delete user with active subscriptions'), req, 400)
            }

            // Soft delete by banning permanently
            await user.banUser(adminId, 'Account deleted by admin')
            user.isActive = false
            user.emailAddress = `deleted_${user._id}@deleted.com`
            await user.save()

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'User deleted successfully'
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // Get user activity stats
    getUserActivityStats: async (req, res, next) => {
        try {
            const { startDate, endDate } = req.query

            const start = startDate ? TimezoneUtil.toIST(startDate) : TimezoneUtil.addDays(-30)
            const end = endDate ? TimezoneUtil.endOfDay(endDate) : TimezoneUtil.endOfDay()

            const activityStats = await User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        newUsers: { $sum: 1 },
                        newVendors: {
                            $sum: { $cond: [{ $eq: ['$role', 'VENDOR'] }, 1, 0] }
                        },
                        activeUsers: {
                            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                        }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
                }
            ])

            const roleDistribution = await User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                }
            ])

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                activityStats,
                roleDistribution,
                dateRange: {
                    startDate: TimezoneUtil.format(start, 'datetime'),
                    endDate: TimezoneUtil.format(end, 'datetime')
                }
            })
        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },


}