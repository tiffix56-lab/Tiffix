import mongoose from 'mongoose'
import { EVendorType } from '../constant/application.js'

const menuSchema = new mongoose.Schema(
    {
        foodImage: {
            type: String,
            required: true
        },
        foodSubImages: [
            {
                type: String,
            }
        ],
        foodTitle: {
            type: String,
            required: true,
            maxlength: 60,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            short: {
                type: String,
                required: true,
                maxlength: 200,
                trim: true
            },
            long: {
                type: String,
                maxlength: 1000,
                trim: true
            },
        },
        detailedItemList: {
            type: String,
            required: true,
            trim: true
        },
        vendorCategory: {
            type: String,
            enum: [...Object.values(EVendorType)],
            required: true
        },
        cuisine: {
            type: String,
            required: true,
            trim: true
        },
        prepTime: {
            type: Number,
            required: true,
            min: 1
        },
        calories: {
            type: Number,
            required: true,
            min: 0
        },
        dietaryOptions: [{
            type: String,
            enum: ['vegetarian', 'vegan', 'gluten-free', 'non-vegetarian', 'dairy-free', 'halal', 'kosher', 'nut-free']
        }],
        isAvailable: {
            type: Boolean,
            default: true
        },
        rating: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            totalReviews: {
                type: Number,
                default: 0
            }
        },
        tags: [String],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
)

// Indexes for performance
menuSchema.index({ category: 1 })
menuSchema.index({ cuisine: 1 })
menuSchema.index({ isAvailable: 1 })
menuSchema.index({ isActive: 1 })
menuSchema.index({ 'rating.average': -1 })
menuSchema.index({ price: 1 })
menuSchema.index({ dietaryOptions: 1 })
menuSchema.index({ createdAt: -1 })

// Compound indexes for common queries
menuSchema.index({ category: 1, isAvailable: 1, isActive: 1 })
menuSchema.index({ cuisine: 1, 'rating.average': -1 })
menuSchema.index({ dietaryOptions: 1, 'rating.average': -1 })



// Instance methods
menuSchema.methods.updateRating = function (newRating) {
    const totalRating = this.rating.average * this.rating.totalReviews
    this.rating.totalReviews += 1
    this.rating.average = (totalRating + newRating) / this.rating.totalReviews
    return this.save()
}





// Static methods
menuSchema.statics.findAvailable = function () {
    return this.find({ isAvailable: true, isActive: true })
        .sort({ 'rating.average': -1 })
}

menuSchema.statics.findByCategory = function (category) {
    return this.find({ category, isAvailable: true, isActive: true })
        .sort({ 'rating.average': -1 })
}

menuSchema.statics.findByCuisine = function (cuisine) {
    return this.find({ cuisine, isAvailable: true, isActive: true })
        .sort({ 'rating.average': -1 })
}

menuSchema.statics.findByDietaryOptions = function (dietaryOptions) {
    return this.find({
        dietaryOptions: { $in: dietaryOptions },
        isAvailable: true,
        isActive: true
    })
        .sort({ 'rating.average': -1 })
}

menuSchema.statics.findByPriceRange = function (minPrice, maxPrice) {
    return this.find({
        price: { $gte: minPrice, $lte: maxPrice },
        isAvailable: true,
        isActive: true
    })
        .sort({ price: 1 })
}

menuSchema.statics.searchFood = function (searchTerm) {
    return this.find({
        $and: [
            { isAvailable: true, isActive: true },
            {
                $or: [
                    { foodTitle: { $regex: searchTerm, $options: 'i' } },
                    { shortDescription: { $regex: searchTerm, $options: 'i' } },
                    { cuisine: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $regex: searchTerm, $options: 'i' } }
                ]
            }
        ]
    })
        .sort({ 'rating.average': -1 })
}

export default mongoose.model('Menu', menuSchema)