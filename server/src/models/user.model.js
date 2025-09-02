import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { EAuthProvider, EUserRole } from '../constant/application.js'

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 2,
            maxlength: 72
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            default: 'male'
        },
        avatar: {
            type: String,
            default: null
        },
        emailAddress: {
            type: String,
            required: true,
            unique: true
        },
        phoneNumber: {
            _id: false,
            isoCode: {
                type: String,
                required: function () {
                    return this.provider === 'LOCAL'
                }
            },
            countryCode: {
                type: String,
                required: function () {
                    return this.provider === 'LOCAL'
                }
            },
            internationalNumber: {
                type: String,
                required: function () {
                    return this.provider === 'LOCAL'
                }
            }
        },
        timezone: {
            type: String,
            trim: true,
            required: true
        },
        password: {
            type: String,
            required: function () {
                return this.provider === 'LOCAL'
            }
        },
        googleId: {
            type: String,
            default: null
        },
        facebookId: {
            type: String,
            default: null
        },
        provider: {
            type: String,
            enum: [...Object.values(EAuthProvider)],
            default: 'LOCAL'
        },
        accountConfirmation: {
            _id: false,
            status: {
                type: Boolean,
                default: false,
                required: true
            },
            otp: {
                type: String,
                required: true,

            },
            timestamp: {
                type: Date,
                default: null
            }
        },
        passwordReset: {
            _id: false,
            otp: {
                type: String,
                default: null,

            },
            expiry: {
                type: Number,
                default: null
            },
            lastResetAt: {
                type: Date,
                default: null
            }
        },
        consent: {
            type: Boolean,
            required: true
        },
        role: {
            type: String,
            enum: [...Object.values(EUserRole)],
            required: function () {
                return this.provider === 'LOCAL'
            },
            default: function () {
                return this.provider === 'LOCAL' ? EUserRole.USER : undefined
            }
        },
        isActive: {
            type: Boolean,
            default: false
        },
        isBanned: {
            type: Boolean,
            default: false
        },
        banDetails: {
            _id: false,
            bannedAt: {
                type: Date,
                default: null
            },
            bannedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            },
            banReason: {
                type: String,
                default: null
            },
            unbannedAt: {
                type: Date,
                default: null
            },
            unbannedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            }
        },
        location: {
            _id: false,
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            },
            address: {
                type: String,
                default: null
            },
            city: {
                type: String,
                default: null
            },
            state: {
                type: String,
                default: null
            },
            country: {
                type: String,
                default: null
            },
            pincode: {
                type: String,
                default: null
            },
            lastUpdated: {
                type: Date,
                default: null
            }
        },
        lastLogin: {
            type: Date,
            default: null
        },
        referral: {
            _id: false,
            referredBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            },
            usedReferralCode: {
                type: String,
                default: null
            },
            isReferralUsed: {
                type: Boolean,
                default: false
            },
            referralUsedAt: {
                type: Date,
                default: null
            },
            userReferralCode: {
                type: String,
                unique: true,
                sparse: true,
                default: null
            },
            referralCodeGeneratedAt: {
                type: Date,
                default: null
            },
            totalreferralCredits: {
                type: Number,
                default: 0
            },
            referralStats: {
                totalReferrals: {
                    type: Number,
                    default: 0
                },
                successfulReferrals: {
                    type: Number,
                    default: 0
                },
                pendingReferrals: {
                    type: Number,
                    default: 0
                }
            },
            canRefer: {
                type: Boolean,
                default: function() {
                    return this.role === 'user'
                }
            }
        }
    },
    { timestamps: true }
)

userSchema.index({ 'phoneNumber.internationalNumber': 1 })
userSchema.index({ googleId: 1 })
userSchema.index({ role: 1 })
userSchema.index({ provider: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ isBanned: 1 })
userSchema.index({ 'location.coordinates': '2dsphere' })
userSchema.index({ createdAt: 1 })
userSchema.index({ 'referral.referredBy': 1 })
userSchema.index({ 'referral.usedReferralCode': 1 })
userSchema.index({ 'referral.userReferralCode': 1 })
userSchema.index({ 'referral.totalreferralCredits': -1 })
userSchema.index({ 'referral.canRefer': 1 })
userSchema.index({ 'referral.isReferralUsed': 1 })
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ role: 1, isBanned: 1 })
userSchema.index({ role: 1, 'referral.canRefer': 1 })

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next()
    }

    try {
        const saltRounds = 12
        this.password = await bcrypt.hash(this.password, saltRounds)
        next()
    } catch (error) {
        next(error)
    }
})

userSchema.methods.comparePassword = async function (password) {
    if (!this.password) return false
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.isAccountConfirmed = function () {
    return this.accountConfirmation.status === true
}

userSchema.methods.isPasswordResetValid = function () {
    if (!this.passwordReset.expiry) return false
    return Date.now() < this.passwordReset.expiry
}

userSchema.statics.findByEmail = function (email) {
    return this.findOne({ emailAddress: email.toLowerCase() })
}

userSchema.statics.findByPhoneNumber = function (internationalNumber) {
    return this.findOne({ 'phoneNumber.internationalNumber': internationalNumber })
}

userSchema.statics.findByGoogleId = function (googleId) {
    return this.findOne({ googleId })
}


userSchema.statics.findReferredUsers = function (userId) {
    return this.find({ 'referral.referredBy': userId })
}

userSchema.statics.findByReferralCode = function (referralCode) {
    return this.findOne({ 'referral.userReferralCode': referralCode.toUpperCase() })
}

userSchema.statics.generateUniqueReferralCode = async function () {
    const MAX_ATTEMPTS = 10
    let attempts = 0
    
    while (attempts < MAX_ATTEMPTS) {
        // Generate date-based code with timestamp
        const now = new Date()
        const timestamp = now.getTime().toString(36).toUpperCase()
        const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase()
        const code = `${randomPart}${timestamp}`.substring(0, 8)
        
        // Check if code already exists
        const existingUser = await this.findOne({ 'referral.userReferralCode': code })
        if (!existingUser) {
            return code
        }
        
        attempts++
    }
    
    // Fallback to random code if all attempts failed
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let fallbackCode = ''
    for (let i = 0; i < 8; i++) {
        fallbackCode += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return fallbackCode
}

userSchema.statics.getReferralLeaderboard = function (limit = 10) {
    return this.aggregate([
        {
            $match: {
                'referral.totalreferralCredits': { $gt: 0 },
                'referral.canRefer': true,
                role: 'user'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: 'referral.referredBy',
                as: 'referredUsers'
            }
        },
        {
            $addFields: {
                totalReferrals: { $size: '$referredUsers' },
                successfulReferrals: {
                    $size: {
                        $filter: {
                            input: '$referredUsers',
                            cond: { $eq: ['$$this.referral.isReferralUsed', true] }
                        }
                    }
                }
            }
        },
        {
            $project: {
                name: 1,
                'referral.userReferralCode': 1,
                'referral.totalreferralCredits': 1,
                totalReferrals: 1,
                successfulReferrals: 1,
                createdAt: 1
            }
        },
        {
            $sort: { 'referral.totalreferralCredits': -1 }
        },
        {
            $limit: limit
        }
    ])
}

userSchema.statics.getReferralStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalReferrers: {
                    $sum: { $cond: [{ $gt: ['$referral.totalreferralCredits', 0] }, 1, 0] }
                },
                totalReferralUsers: {
                    $sum: { $cond: [{ $ne: ['$referral.referredBy', null] }, 1, 0] }
                },
                totalCreditsAwarded: { $sum: '$referral.totalreferralCredits' },
                activeReferrers: {
                    $sum: { $cond: [{ $and: [
                        { $eq: ['$referral.canRefer', true] },
                        { $gt: ['$referral.totalreferralCredits', 0] }
                    ]}, 1, 0] }
                }
            }
        }
    ])
}

userSchema.methods.banUser = function (bannedBy, reason) {
    this.isBanned = true
    this.banDetails = {
        bannedAt: new Date(),
        bannedBy: bannedBy,
        banReason: reason,
        unbannedAt: null,
        unbannedBy: null
    }
    return this.save()
}

userSchema.methods.unbanUser = function (unbannedBy) {
    this.isBanned = false
    this.banDetails.unbannedAt = new Date()
    this.banDetails.unbannedBy = unbannedBy
    return this.save()
}

userSchema.methods.updateLocation = function (locationData) {
    this.location = {
        ...this.location,
        ...locationData,
        lastUpdated: new Date()
    }
    return this.save()
}

userSchema.statics.getUserStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalActiveUsers: {
                    $sum: {
                        $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                    }
                },
                totalBannedUsers: {
                    $sum: {
                        $cond: [{ $eq: ['$isBanned', true] }, 1, 0]
                    }
                },
                totalVendors: {
                    $sum: {
                        $cond: [{ $eq: ['$role', 'VENDOR'] }, 1, 0]
                    }
                },
                totalAdmins: {
                    $sum: {
                        $cond: [{ $eq: ['$role', 'admin'] }, 1, 0]
                    }
                }
            }
        }
    ])
}

userSchema.statics.findWithFilters = function (filters = {}, options = {}) {
    const {
        role,
        status,
        search,
        userType,
        hasSubscription
    } = filters

    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options

    const matchQuery = {}

    if (role) matchQuery.role = role

    if (status) {
        switch (status) {
            case 'active':
                matchQuery.isActive = true
                matchQuery.isBanned = false
                break
            case 'inactive':
                matchQuery.isActive = false
                break
            case 'banned':
                matchQuery.isBanned = true
                break
        }
    }

    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { emailAddress: { $regex: search, $options: 'i' } },
            { 'phoneNumber.internationalNumber': { $regex: search, $options: 'i' } }
        ]
    }

    const pipeline = [{ $match: matchQuery }]

    if (hasSubscription === 'true') {
        pipeline.push({
            $lookup: {
                from: 'usersubscriptions',
                localField: '_id',
                foreignField: 'userId',
                as: 'subscriptions'
            }
        })
        pipeline.push({
            $match: {
                'subscriptions.0': { $exists: true }
            }
        })
    }

    pipeline.push({
        $lookup: {
            from: 'usersubscriptions',
            localField: '_id',
            foreignField: 'userId',
            as: 'subscriptions'
        }
    })

    pipeline.push({
        $addFields: {
            subscriptionCount: { $size: '$subscriptions' },
            hasActiveSubscription: {
                $gt: [
                    {
                        $size: {
                            $filter: {
                                input: '$subscriptions',
                                cond: { $eq: ['$$this.status', 'active'] }
                            }
                        }
                    },
                    0
                ]
            }
        }
    })

    const sortObj = {}
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1
    pipeline.push({ $sort: sortObj })

    const skip = (page - 1) * limit
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: parseInt(limit) })

    return this.aggregate(pipeline)
}

userSchema.statics.countWithFilters = function (filters = {}) {
    const {
        role,
        status,
        search,
        hasSubscription
    } = filters

    const matchQuery = {}

    if (role) matchQuery.role = role

    if (status) {
        switch (status) {
            case 'active':
                matchQuery.isActive = true
                matchQuery.isBanned = false
                break
            case 'inactive':
                matchQuery.isActive = false
                break
            case 'banned':
                matchQuery.isBanned = true
                break
        }
    }

    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { emailAddress: { $regex: search, $options: 'i' } },
            { 'phoneNumber.internationalNumber': { $regex: search, $options: 'i' } }
        ]
    }

    const pipeline = [{ $match: matchQuery }]

    if (hasSubscription === 'true') {
        pipeline.push({
            $lookup: {
                from: 'usersubscriptions',
                localField: '_id',
                foreignField: 'userId',
                as: 'subscriptions'
            }
        })
        pipeline.push({
            $match: {
                'subscriptions.0': { $exists: true }
            }
        })
    }

    pipeline.push({ $count: 'total' })

    return this.aggregate(pipeline)
}

userSchema.methods.toJSON = function () {
    const user = this.toObject()
    delete user.password
    if (user.accountConfirmation && user.accountConfirmation.otp) {
        delete user.accountConfirmation.otp
    }
    if (user.passwordReset && user.passwordReset.otp) {
        delete user.passwordReset.otp
    }
    return user
}

export default mongoose.model('User', userSchema)