import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { EAuthProvider, EUserRole } from '../constant/application'

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 2,
            maxlength: 72
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
                minlength: 6,
                maxlength: 6
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
                minlength: 6,
                maxlength: 6
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
            discountUsed: {
                type: Boolean,
                default: false
            },
            discountAmount: {
                type: Number,
                default: 0
            }
        }
    },
    { timestamps: true }
)

userSchema.index({ emailAddress: 1 }, { unique: true })
userSchema.index({ 'phoneNumber.internationalNumber': 1 })
userSchema.index({ googleId: 1 })
userSchema.index({ role: 1 })
userSchema.index({ provider: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ createdAt: 1 })
userSchema.index({ 'referral.referredBy': 1 })
userSchema.index({ 'referral.usedReferralCode': 1 })

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

userSchema.methods.hasReferralDiscount = function () {
    return this.referral.referredBy && !this.referral.discountUsed
}

userSchema.methods.useReferralDiscount = function (amount = 30) {
    if (this.hasReferralDiscount()) {
        this.referral.discountUsed = true
        this.referral.discountAmount = amount
        return this.save()
    }
    return false
}

userSchema.statics.findReferredUsers = function (userId) {
    return this.find({ 'referral.referredBy': userId })
}

userSchema.methods.toJSON = function () {
    const user = this.toObject()
    delete user.password
    delete user.accountConfirmation.otp
    delete user.passwordReset.otp
    return user
}

export default mongoose.model('User', userSchema)