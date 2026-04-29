const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    price:{
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
    photo: {
        type: String
    },
    videoUrl: {
    type: String,
    default: ""
}
}, {timestamps: true});

module.exports = mongoose.model('Vendor', VendorSchema);