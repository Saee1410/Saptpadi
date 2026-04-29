const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    serviceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Service', 
        required: true 
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true},

    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
        default: 'Pending'
    },
    message: {
        type: String
    },
    eventCity: {
        type: String,
        required: true
    },
    travelBufferDays: {
        type: Number,
        default: 0
    }
}, { timestamps: true });


module.exports = mongoose.model('Booking', bookingSchema);