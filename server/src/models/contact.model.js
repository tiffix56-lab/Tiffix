import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: props => `${props.value} is not a valid email address!`
            }
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^[0-9]{10}$/.test(v);
                },
                message: props => `${props.value} is not a valid phone number! Must be 10 digits.`
            }
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

contactSchema.index({ email: 1 });

export default mongoose.model('Contact', contactSchema);