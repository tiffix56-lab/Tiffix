import httpResponse from '../../util/httpResponse.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import { validateJoiSchema } from '../../service/validationService.js'
import PromoCode from '../../models/promoCode.model.js'
import Subscription from '../../models/subscription.model.js'
import promoCodeService from '../../service/promoCodeService.js'
import TimezoneUtil from '../../util/timezone.js'
import {
    ValidateCreatePromoCode,
    ValidateUpdatePromoCode,
    ValidatePromoCodeQuery,
    ValidateApplyPromoCode
} from '../../service/validationService.js'

export default {
    createPromoCode: async (req, res, next) => {
        try {
            const { body } = req
            const { userId } = req.authenticatedUser

            const { error, value } = validateJoiSchema(ValidateCreatePromoCode, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            // Check if promo code already exists
            const existingPromoCode = await PromoCode.findOne({
                code: value.code.toUpperCase()
            })
            if (existingPromoCode) {
                return httpError(next, new Error('Promo code already exists'), req, 409)
            }

            // Validate applicable subscriptions if provided
            if (value.applicableSubscriptions && value.applicableSubscriptions.length > 0) {
                const subscriptions = await Subscription.find({
                    _id: { $in: value.applicableSubscriptions }
                })
                if (subscriptions.length !== value.applicableSubscriptions.length) {
                    return httpError(next, new Error('One or more invalid subscription IDs'), req, 400)
                }
            }

            const promoCodeData = {
                ...value,
                code: value.code.toUpperCase(),
                createdBy: userId
            }

            const newPromoCode = new PromoCode(promoCodeData)
            const savedPromoCode = await newPromoCode.save()

            httpResponse(req, res, 201, responseMessage.SUCCESS, {
                promoCode: savedPromoCode,
                message: 'Promo code created successfully'
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    getAllPromoCodes: async (req, res, next) => {
        try {
            const { query } = req

            const { error, value } = validateJoiSchema(ValidatePromoCodeQuery, query)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const {
                page = 1,
                limit = 10,
                isActive,
                discountType,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search,
                status
            } = value

            const skip = (page - 1) * limit
            const filter = {}

            if (isActive !== undefined) filter.isActive = isActive === 'true'
            if (discountType) filter.discountType = discountType

            if (status === 'active') {
                const now = TimezoneUtil.now()
                filter.isActive = true
                filter.validFrom = { $lte: now }
                filter.validUntil = { $gte: now }
                filter.$expr = { $lt: ['$usedCount', '$usageLimit'] }
            } else if (status === 'expired') {
                filter.validUntil = { $lt: TimezoneUtil.now() }
            } else if (status === 'used_up') {
                filter.$expr = { $gte: ['$usedCount', '$usageLimit'] }
            }

            if (search) {
                filter.$or = [
                    { code: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const promoCodes = await PromoCode.find(filter)
                .populate('applicableSubscriptions', 'planName duration category')
                .populate('createdBy', 'name emailAddress')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))

            const total = await PromoCode.countDocuments(filter)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                promoCodes,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                filters: {
                    isActive,
                    discountType,
                    status,
                    search
                }
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    getPromoCodeById: async (req, res, next) => {
        try {
            const { id } = req.params

            const promoCode = await PromoCode.findById(id)
                .populate('applicableSubscriptions', 'planName duration category originalPrice discountedPrice')
                .populate('createdBy', 'name emailAddress')

            if (!promoCode) {
                return httpError(next, new Error('Promo code not found'), req, 404)
            }

            // Get usage statistics
            const stats = await promoCodeService.getPromoCodeStats(id)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                promoCode,
                stats: stats.stats,
                usagePercentage: stats.usagePercentage,
                isExpiring: stats.isExpiring,
                remainingUses: stats.remainingUses
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    updatePromoCode: async (req, res, next) => {
        try {
            const { id } = req.params
            const { body } = req

            const { error, value } = validateJoiSchema(ValidateUpdatePromoCode, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const existingPromoCode = await PromoCode.findById(id)
            if (!existingPromoCode) {
                return httpError(next, new Error('Promo code not found'), req, 404)
            }

            // Check if code is being changed and if new code already exists
            if (value.code && value.code.toUpperCase() !== existingPromoCode.code) {
                const codeExists = await PromoCode.findOne({
                    code: value.code.toUpperCase(),
                    _id: { $ne: id }
                })
                if (codeExists) {
                    return httpError(next, new Error('Promo code already exists'), req, 409)
                }
                value.code = value.code.toUpperCase()
            }

            // Validate applicable subscriptions if provided
            if (value.applicableSubscriptions && value.applicableSubscriptions.length > 0) {
                const subscriptions = await Subscription.find({
                    _id: { $in: value.applicableSubscriptions }
                })
                if (subscriptions.length !== value.applicableSubscriptions.length) {
                    return httpError(next, new Error('One or more invalid subscription IDs'), req, 400)
                }
            }

            const updatedPromoCode = await PromoCode.findByIdAndUpdate(id, value, {
                new: true,
                runValidators: true
            }).populate('applicableSubscriptions', 'planName duration category')

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                promoCode: updatedPromoCode,
                message: 'Promo code updated successfully'
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    deletePromoCode: async (req, res, next) => {
        try {
            const { id } = req.params

            const promoCode = await PromoCode.findById(id)
            if (!promoCode) {
                return httpError(next, new Error('Promo code not found'), req, 404)
            }

            // Check if promo code has been used
            if (promoCode.usedCount > 0) {
                return httpError(next, new Error('Cannot delete promo code that has been used'), req, 400)
            }

            await PromoCode.findByIdAndDelete(id)

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Promo code deleted successfully'
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    togglePromoCodeStatus: async (req, res, next) => {
        try {
            const { id } = req.params

            const promoCode = await PromoCode.findById(id)
            if (!promoCode) {
                return httpError(next, new Error('Promo code not found'), req, 404)
            }

            promoCode.isActive = !promoCode.isActive
            await promoCode.save()

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                promoCode,
                message: `Promo code ${promoCode.isActive ? 'activated' : 'deactivated'} successfully`
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    validatePromoCode: async (req, res, next) => {
        try {
            const { body } = req
            const { userId } = req.authenticatedUser

            const { error, value } = validateJoiSchema(ValidateApplyPromoCode, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { code, subscriptionId, orderValue } = value

            const validationResult = await promoCodeService.validatePromoCode(
                code,
                userId,
                subscriptionId,
                orderValue
            )

            if (!validationResult.valid) {
                return httpError(next, new Error(validationResult.error), req, 400)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                valid: true,
                discount: validationResult.discount,
                discountType: validationResult.discountType,
                discountValue: validationResult.discountValue,
                maxDiscount: validationResult.maxDiscount,
                finalAmount: orderValue - validationResult.discount,
                promoCode: {
                    id: validationResult.promoCode._id,
                    code: validationResult.promoCode.code,
                    description: validationResult.promoCode.description
                }
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },


    getPromoCodeStats: async (req, res, next) => {
        try {
            const { id } = req.params

            const stats = await promoCodeService.getPromoCodeStats(id)

            httpResponse(req, res, 200, responseMessage.SUCCESS, stats)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    getExpiringPromoCodes: async (req, res, next) => {
        try {
            const { days = 3 } = req.query

            const expiringPromoCodes = await promoCodeService.getExpiringPromoCodes(
                parseInt(days)
            )

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                expiringPromoCodes,
                count: expiringPromoCodes.length,
                daysThreshold: parseInt(days)
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    bulkCreatePromoCodes: async (req, res, next) => {
        try {
            const { body } = req
            const { userId } = req.authenticatedUser

            const { count = 1, ...promoCodeData } = body

            if (count > 100) {
                return httpError(next, new Error('Cannot create more than 100 promo codes at once'), req, 400)
            }

            const promoCodesData = {
                ...promoCodeData,
                createdBy: userId
            }

            const createdPromoCodes = await promoCodeService.bulkCreatePromoCodes(
                promoCodesData,
                count
            )

            httpResponse(req, res, 201, responseMessage.SUCCESS, {
                promoCodes: createdPromoCodes,
                count: createdPromoCodes.length,
                message: `${createdPromoCodes.length} promo codes created successfully`
            })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}