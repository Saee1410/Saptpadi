// const mongoose = require('mongoose');

// const BookingSchema = new mongoose.Schema({
//     serviceId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Service', 
//         required: true
//     },
//     vendorId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User', 
//         required: true
//     },
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User', 
//         required: true
//     },
//     startDate: { type: Date, required: true },
//     endDate: { type: Date, required: true },
//     eventCity: { type: String, required: true },
//     status: {
//         type: String,
//         enum: ['Pending', 'Confirmed', 'Cancelled'],
//         default: 'Pending'
//     },
//     message: { type: String }
// }, { timestamps: true });

// // ✅ ही ओळ सगळ्यात महत्त्वाची आहे:
// // आधी चेक करा की 'Booking' मॉडेल आधीच बनले आहे का, जर असेल तर तेच वापरा.
// const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// module.exports = Booking;









const mongoose = require('mongoose');



const ServiceSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    businessName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    style: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    contactInfo: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    externalUrl: {
        type: String
    },
    videoUrl: {
        type: String,
        default: ""
    },
    photo: {
        type: String
    }
}, {timestamps: true}); 


module.exports = mongoose.model('Service', ServiceSchema);  