import mongoose from 'mongoose'

const complainSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function(v) {
                    return /^[0-9]{10}$/.test(v);
                },
                message: props => `${props.value} is not a valid phone number! Must be 10 digits.`
            }
        }
    },
    {
        timestamps: true
    }
)

// Index for phone number lookups
complainSchema.index({ phoneNumber: 1 })
complainSchema.index({ createdAt: -1 })

export default mongoose.model('Complain', complainSchema)
