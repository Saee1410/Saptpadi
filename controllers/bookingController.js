const Booking = require('../models/Booking');
const mongoose = require('mongoose');   
const Service = require('../models/Service');
const redis = require('redis');

const client = redis.createClient({ url: 'redis://127.0.0.1:6379' });
client.on('error', (err) => console.log('Redis Error', err));
(async () => { if (!client.isOpen) await client.connect(); })();


exports.createAtomicBooking = async (req, res) => {
    let lockKey = null;
    try {
        const { serviceId, userId, startDate, endDate, message, eventCity, vendorId: providedVendorId } = req.body;

        let finalVendorId = providedVendorId;

        // Service check
        if (!serviceId.startsWith('65f123')) {
            const service = await Service.findById(serviceId);
            if (!service) return res.status(404).json({ success: false, message: "Service not found" });
            finalVendorId = service.vendorId;
        }

        if (!finalVendorId) return res.status(400).json({ success: false, message: "Vendor ID missing" });

        // Redis Lock - Safe Check
        try {
            if (client.isOpen) {
                lockKey = `lock:vendor:${finalVendorId}`;
                const acquired = await client.set(lockKey, "locked", { NX: true, EX: 10 });
                if (!acquired) return res.status(429).json({ success: false, message: "Vendor busy." });
            }
        } catch (rErr) { console.log("Redis skip"); }

        // Mongoose logic
        const newBooking = new Booking({
            serviceId, 
            userId, 
            vendorId: finalVendorId, 
            startDate: new Date(startDate), 
            endDate: new Date(endDate),
            message, 
            eventCity, 
            status: "Pending"
        });

        await newBooking.save();
        res.status(201).json({ success: true, message: "Booking Request Sent!" });

    } catch (err) {
        console.error("Booking Error:", err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (lockKey && client.isOpen) await client.del(lockKey);
    }
};

// exports.createAtomicBooking = async (req, res) => {
//     let lockKey = null;
//     try {
//         const { serviceId, userId, startDate, endDate, message, eventCity, vendorId: providedVendorId } = req.body;

//         let finalVendorId = providedVendorId;

//         // १. जर serviceId मॅन्युअल असेल (६५फ१२३ ने सुरू होणारा), तर DB चेक स्किप करा
//         if (!serviceId.startsWith('65f123')) {
//             const service = await Service.findById(serviceId);
//             if (!service) return res.status(404).json({ success: false, message: "Service not found" });
//             finalVendorId = service.vendorId;
//         }

//         if (!finalVendorId) return res.status(400).json({ success: false, message: "Vendor ID missing" });

//         lockKey = `lock:vendor:${finalVendorId}`;
//         const acquired = await client.set(lockKey, "locked", { NX: true, EX: 10 });
        
//         if (!acquired) {
//             return res.status(429).json({ success: false, message: "Vendor is busy. Try again." });
//         }

//         const start = new Date(startDate);
//         const end = new Date(endDate);

//         const existingConflict = await Booking.findOne({
//             vendorId: finalVendorId,
//             status: { $in: ['Pending', 'Accepted'] },
//             $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }]
//         });

//         if (existingConflict) {
//             return res.status(400).json({ success: false, message: "Dates already booked!" });
//         }

//         const newBooking = new Booking({
//             serviceId, userId, vendorId: finalVendorId, startDate: start, endDate: end,
//             message, eventCity, status: "Pending"
//         });

//         await newBooking.save();
//         res.status(201).json({ success: true, message: "Booking Request Sent!" });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     } finally {
//         if (lockKey) await client.del(lockKey);
//     }
// };


exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { status },
            { returnDocument: 'after', runValidators: true }
        );

       if (!updatedBooking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        } 

        res.status(200).json({ success: true, booking: updatedBooking });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// exports.getVendorBookings = async (req, res) => {
//     try {
//         const { vendorId} = req.params;

//         const bookings = await Booking.find({ vendorId: vendorId })
//            .populate('userId', 'name email contact')
//            .populate('serviceId', 'businessName price photo style')
//            .sort({ createdAt: -1 });

//            res.status(200).json({ success: true, bookings });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message }); 
//     }
// };

// exports.getVendorBookings = async (req, res) => {
//     try {
//         const { vendorId } = req.params;

//         // ID valid aahe ka te check kara ani conversion kara
//         const bookings = await Booking.find({ 
//             vendorId: new mongoose.Types.ObjectId(vendorId) 
//         })
//         .populate('userId', 'name email contact')
//         .populate('serviceId', 'businessName price photo style')
//         .sort({ createdAt: -1 });

//         console.log(`Found ${bookings.length} bookings for vendor: ${vendorId}`);
//         res.status(200).json({ success: true, bookings });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message }); 
//     }
// };

exports.getVendorBookings = async (req, res) => {
    try {
        const { vendorId } = req.params;

        const bookings = await Booking.find({ 
            // String kiva ObjectId kontahi asel tari shodhel
            $or: [
                { vendorId: vendorId }, 
                { vendorId: new mongoose.Types.ObjectId(vendorId) }
            ]
        })
        .populate('userId', 'name email contact')
        .populate('serviceId', 'businessName price photo style')
        .sort({ createdAt: -1 });

        console.log(`Found ${bookings.length} bookings for vendor: ${vendorId}`);
        res.status(200).json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message }); 
    }
};

const cancleBooking = async (req, res) => {
    try {
        const {id} = req.params;

        const updatetedBooking = await Booking.findByIdAndUpdate(
            id,
            {status: "Cancelled"},
            {new: true}
        );

        if (!updatetedBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            booking: updatetedBooking
        });

    } catch (error) {
        console.error("Cancellation error:", error);
        res.status(500).json({
            success: false,
            message: "Cancellation failed",
            error: error.message
    
            });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBooking = await Booking.findByIdAndDelete(id);

        if(!deletedBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Booking deleted successfully"
        });
    } catch (error) {
        console.error("Deletion error:", error);
        res.status(500).json({
            success: false,
            message: "Deletion failed",
            error: error.message
        });
    };
}


module.exports = {
     createAtomicBooking: exports.createAtomicBooking,
     updateBookingStatus: exports.updateBookingStatus,
     getVendorBookings: exports.getVendorBookings,
     cancleBooking,
        deleteBooking
    };    
