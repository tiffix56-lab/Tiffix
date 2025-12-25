import mongoose from 'mongoose';

const sequenceSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true 
    }, // ID will be the sequence name, e.g., "order_20251225"
    sequence_value: { 
        type: Number, 
        default: 0 
    }
}, { 
    timestamps: true,
    _id: false // Use manual string _id
});

export default mongoose.model('Sequence', sequenceSchema);
