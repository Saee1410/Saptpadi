const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    phone: {
        type: String,
    },

    profilePic: {
        type: String,
        default: ''
    },

    role: {
        type: String,
        default: 'customer'
    },
    eventDate: {
        type: Date
    },
    eventCity: {
        type: String
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }]
}, {timestamps: true});

module.exports = mongoose.model('User', UserSchema);