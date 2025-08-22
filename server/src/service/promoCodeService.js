import PromoCode from '../models/promoCode.model.js'
import UserSubscription from '../models/userSubscription.model.js'
import Subscription from '../models/subscription.model.js'
import TimezoneUtil from '../util/timezone.js'

class PromoCodeService {
    async validatePromoCode(code, userId, subscriptionId, orderValue) {
        try {
            const promoCode = await PromoCode.findValidPromoCode(code)

            if (!promoCode) {
                return {
                    valid: false,
                    error: 'Invalid or expired promo code',
                    discount: 0
                }
            }

            const subscription = await Subscription.findById(subscriptionId)
            if (!subscription) {
                return {
                    valid: false,
                    error: 'Invalid subscription',
                    discount: 0
                }
            }

            if (!promoCode.isApplicableToSubscription(subscriptionId, subscription.category)) {
                return {
                    valid: false,
                    error: 'Promo code not applicable to this subscription',
                    discount: 0
                }
            }

            const userUsageCount = await this.getUserPromoCodeUsage(userId, promoCode._id)
            if (userUsageCount >= promoCode.userUsageLimit) {
                return {
                    valid: false,
                    error: 'Promo code usage limit exceeded for this user',
                    discount: 0
                }
            }

            const discountResult = promoCode.calculateDiscount(orderValue)
            if (discountResult.error) {
                return {
                    valid: false,
                    error: discountResult.error,
                    discount: 0
                }
            }

            return {
                valid: true,
                discount: discountResult.discount,
                promoCode: promoCode,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
                maxDiscount: promoCode.maxDiscount
            }
        } catch (error) {
            console.error('Promo code validation error:', error)
            return {
                valid: false,
                error: 'Error validating promo code',
                discount: 0
            }
        }
    }

    async getUserPromoCodeUsage(userId, promoCodeId) {
        try {
            const count = await UserSubscription.countDocuments({
                userId: userId,
                promoCodeUsed: promoCodeId,
                status: { $ne: 'cancelled' }
            })
            return count
        } catch (error) {
            console.error('Error getting user promo code usage:', error)
            return 0
        }
    }

    async applyPromoCode(promoCodeId, userId, subscriptionId) {
        try {
            const promoCode = await PromoCode.findById(promoCodeId)
            if (!promoCode || !promoCode.canBeUsed()) {
                throw new Error('Promo code cannot be used')
            }

            await promoCode.incrementUsage()
            return promoCode
        } catch (error) {
            console.error('Error applying promo code:', error)
            throw error
        }
    }

    async getPromoCodeStats(promoCodeId) {
        try {
            const promoCode = await PromoCode.findById(promoCodeId)
            if (!promoCode) {
                throw new Error('Promo code not found')
            }

            const usageStats = await UserSubscription.aggregate([
                {
                    $match: {
                        promoCodeUsed: promoCodeId,
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalUsage: { $sum: 1 },
                        totalRevenue: { $sum: '$finalPrice' },
                        totalDiscount: { $sum: '$discountApplied' }
                    }
                }
            ])

            return {
                promoCode: promoCode,
                stats: usageStats[0] || {
                    totalUsage: 0,
                    totalRevenue: 0,
                    totalDiscount: 0
                },
                usagePercentage: (promoCode.usedCount / promoCode.usageLimit) * 100,
                isExpiring: this.isPromoCodeExpiring(promoCode),
                remainingUses: promoCode.usageLimit - promoCode.usedCount
            }
        } catch (error) {
            console.error('Error getting promo code stats:', error)
            throw error
        }
    }

    isPromoCodeExpiring(promoCode, days = 3) {
        const now = TimezoneUtil.now()
        const expiryThreshold = TimezoneUtil.addDays(days)

        return promoCode.validUntil <= expiryThreshold && promoCode.validUntil > now
    }

    async getExpiringPromoCodes(days = 3) {
        try {
            const now = TimezoneUtil.now()
            const futureDate = TimezoneUtil.addDays(days)

            return await PromoCode.find({
                isActive: true,
                validUntil: {
                    $gte: now,
                    $lte: futureDate
                }
            }).sort({ validUntil: 1 })
        } catch (error) {
            console.error('Error getting expiring promo codes:', error)
            return []
        }
    }

    async deactivateExpiredPromoCodes() {
        try {
            const now = TimezoneUtil.now()
            const result = await PromoCode.updateMany(
                {
                    isActive: true,
                    validUntil: { $lt: now }
                },
                { $set: { isActive: false } }
            )

            console.log(`Deactivated ${result.modifiedCount} expired promo codes`)
            return result.modifiedCount
        } catch (error) {
            console.error('Error deactivating expired promo codes:', error)
            return 0
        }
    }

    async bulkCreatePromoCodes(promoCodeData, count = 1) {
        try {
            const promoCodes = []
            for (let i = 0; i < count; i++) {
                const code = this.generateUniqueCode()
                promoCodes.push({
                    ...promoCodeData,
                    code: code
                })
            }

            const result = await PromoCode.insertMany(promoCodes)
            return result
        } catch (error) {
            console.error('Error creating bulk promo codes:', error)
            throw error
        }
    }

    generateUniqueCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const length = 8
        let result = ''

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        return result
    }
}

export default new PromoCodeService()