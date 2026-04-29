const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const Booking = require('../models/Booking');

// 1. Create Booking
router.post('/request', bookingController.createAtomicBooking);

router.get('/vendor/:vendorId', bookingController.getVendorBookings);

router.put('/update-status/:bookingId', bookingController.updateBookingStatus); 

// 2. Get User's Bookings
router.get('/my-bookings/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.userId })
            .populate('serviceId', 'businessName price photo style') // Fields from Service Model
            .sort({ createdAt: -1 });
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/cancel/:id', bookingController.cancleBooking);

router.delete('/delete/:id', bookingController.deleteBooking    );

module.exports = router;
