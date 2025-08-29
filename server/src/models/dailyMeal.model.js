import mongoose from 'mongoose'
import TimezoneUtil from '../util/timezone.js'
import { EVendorType } from '../constant/application.js'

const dailyMealSchema = new mongoose.Schema(
    {
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
            required: true
        },
        mealDate: {
            type: Date,
            required: true
        },
        selectedMenus: {
            lunchMenus: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Menu'
            }],
            dinnerMenus: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Menu'
            }]
        },
        vendorType: {
            type: String,
            enum: [...Object.values(EVendorType)],
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        notes: {
            type: String,
            maxlength: 500,
            default: ''
        }
    },
    { timestamps: true }
)

dailyMealSchema.index({ subscriptionId: 1, mealDate: 1 }, { unique: true })
dailyMealSchema.index({ mealDate: 1 })
dailyMealSchema.index({ vendorType: 1 })
dailyMealSchema.index({ isActive: 1 })
dailyMealSchema.index({ createdBy: 1 })
dailyMealSchema.index({ subscriptionId: 1, mealDate: 1, isActive: 1 })

dailyMealSchema.methods.isForToday = function() {
    const today = TimezoneUtil.startOfDay()
    const mealDay = TimezoneUtil.startOfDay(this.mealDate)
    return today.getTime() === mealDay.getTime()
}

dailyMealSchema.methods.isForFutureDate = function() {
    const today = TimezoneUtil.startOfDay()
    const mealDay = TimezoneUtil.startOfDay(this.mealDate)
    return mealDay.getTime() > today.getTime()
}

dailyMealSchema.methods.updateMenus = function(lunchMenuIds, dinnerMenuIds, modifiedBy) {
    this.selectedMenus.lunchMenus = lunchMenuIds || []
    this.selectedMenus.dinnerMenus = dinnerMenuIds || []
    this.lastModifiedBy = modifiedBy
    return this.save()
}

dailyMealSchema.methods.hasLunchMenus = function() {
    return this.selectedMenus.lunchMenus && this.selectedMenus.lunchMenus.length > 0
}

dailyMealSchema.methods.hasDinnerMenus = function() {
    return this.selectedMenus.dinnerMenus && this.selectedMenus.dinnerMenus.length > 0
}

dailyMealSchema.statics.findBySubscriptionAndDate = function(subscriptionId, date) {
    const targetDate = TimezoneUtil.startOfDay(date)
    return this.findOne({
        subscriptionId: subscriptionId,
        mealDate: {
            $gte: targetDate,
            $lt: TimezoneUtil.addDays(1, targetDate)
        }
    }).populate('selectedMenus.lunchMenus selectedMenus.dinnerMenus')
}

dailyMealSchema.statics.findTodayMeals = function(vendorType = null) {
    const today = TimezoneUtil.startOfDay()
    const tomorrow = TimezoneUtil.addDays(1, today)
    
    const query = {
        mealDate: {
            $gte: today,
            $lt: tomorrow
        },
        isActive: true
    }
    
    if (vendorType) {
        query.vendorType = vendorType
    }
    
    return this.find(query)
        .populate('subscriptionId', 'planName category')
        .populate('selectedMenus.lunchMenus selectedMenus.dinnerMenus')
}

dailyMealSchema.statics.findByDateRange = function(startDate, endDate, vendorType = null) {
    const query = {
        mealDate: {
            $gte: TimezoneUtil.startOfDay(startDate),
            $lte: TimezoneUtil.endOfDay(endDate)
        },
        isActive: true
    }
    
    if (vendorType) {
        query.vendorType = vendorType
    }
    
    return this.find(query)
        .populate('subscriptionId', 'planName category')
        .populate('selectedMenus.lunchMenus selectedMenus.dinnerMenus')
        .sort({ mealDate: 1 })
}

dailyMealSchema.statics.findActiveBySubscription = function(subscriptionId) {
    return this.find({
        subscriptionId: subscriptionId,
        isActive: true
    })
        .populate('selectedMenus.lunchMenus selectedMenus.dinnerMenus')
        .sort({ mealDate: 1 })
}

export default mongoose.model('DailyMeal', dailyMealSchema)