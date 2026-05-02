const Booking = require('../models/Booking');
const mongoose = require('mongoose');   
const Service = require('../models/Service');
const redis = require('redis');

// ✅ Redis client with timeout
const client = redis.createClient({
  url: 'redis://default:********@coherent-filly-112366.upstash.io:6379',
  socket: {
    connectTimeout: 5000
  }
});

client.on('error', (err) => console.log('Redis Error:', err));

// ✅ Safe Redis connect (no hang)
(async () => {
  try {
    if (!client.isOpen) {
      await Promise.race([
        client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis connect timeout")), 5000)
        )
      ]);
      console.log("✅ Redis connected");
    }
  } catch (err) {
    console.log("⚠️ Redis skipped:", err.message);
  }
})();


// ================= CREATE BOOKING =================
exports.createAtomicBooking = async (req, res) => {
  let lockKey = null;

  try {
    console.log("Incoming Booking:", req.body);

    const { serviceId, userId, startDate, endDate, message, eventCity, vendorId: providedVendorId } = req.body;

    let finalVendorId = providedVendorId;

    // ✅ Service check
    const serviceInDb = await Service.findById(serviceId).catch(() => null);

    if (serviceInDb) {
      finalVendorId = serviceInDb.vendorId;
    }

    if (!finalVendorId) {
      return res.status(400).json({ success: false, message: "Vendor ID missing" });
    }

    // ================= REDIS LOCK (SAFE) =================
    try {
      if (client.isOpen) {
        lockKey = `lock:vendor:${finalVendorId}`;

        const acquired = await Promise.race([
          client.set(lockKey, "locked", { NX: true, EX: 10 }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Redis timeout")), 3000)
          )
        ]);

        if (!acquired) {
          return res.status(429).json({
            success: false,
            message: "Vendor busy. Try again."
          });
        }
      }
    } catch (err) {
      console.log("⚠️ Redis lock skipped:", err.message);
    }

    // ================= SAVE BOOKING =================
    const newBooking = new Booking({
      serviceId: serviceInDb ? serviceInDb._id : null,
      userId: userId,
      vendorId: finalVendorId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      message,
      eventCity,
      status: "Pending"
    });

    console.log("Saving Booking:", newBooking);

   await Promise.race([
  newBooking.save(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Save timeout")), 5000)
  )
]);
    res.status(201).json({ success: true, message: "Booking Request Sent!" });      

  } catch (err) {
    console.error("❌ Booking Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });

  } finally {
    // ================= RELEASE LOCK =================
    try {
      if (lockKey && client.isOpen) {
        await client.del(lockKey);
      }
    } catch (err) {
      console.log("⚠️ Redis unlock skipped");
    }
  }
};


// ================= GET VENDOR BOOKINGS =================
exports.getVendorBookings = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const bookings = await Booking.find({
      $or: [
        { vendorId: vendorId },
        { vendorId: new mongoose.Types.ObjectId(vendorId) }
      ]
    })
      .populate('userId', 'name email contact')
      .populate('serviceId', 'businessName price photo style')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ================= UPDATE STATUS =================
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, booking: updatedBooking });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ================= CANCEL =================
exports.cancleBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { status: "Cancelled" },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: updatedBooking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cancellation failed",
      error: error.message
    });
  }
};


// ================= DELETE =================
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBooking = await Booking.findByIdAndDelete(id);

    if (!deletedBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Deletion failed",
      error: error.message
    });
  }
};


// const Booking = require('../models/Booking');
// const mongoose = require('mongoose');   
// const Service = require('../models/Service');
// const redis = require('redis');

// const client = redis.createClient({ 
//     url: 'redis://default:********@coherent-filly-112366.upstash.io:6379'
//  });
// client.on('error', (err) => console.log('Redis Error', err));
// (async () => { if (!client.isOpen) await client.connect(); })();


// exports.createAtomicBooking = async (req, res) => {
//     let lockKey = null;
//     try {
//         const { serviceId, userId, startDate, endDate, message, eventCity, vendorId: providedVendorId } = req.body;

//         let finalVendorId = providedVendorId;

//         // --- ERROR HIGHLIGHT: जुनी 'startsWith' वाली अट काढून टाका ---
//         // ✅ सुधारलेले लॉजिक: आधी DB मध्ये सर्विस आहे का ते तपासा
//         const serviceInDb = await Service.findById(serviceId).catch(() => null);
        
//         if (serviceInDb) {
//             finalVendorId = serviceInDb.vendorId;
//         } else {
//             // जर सर्विस DB मध्ये नसेल (उदा. मॅन्युअल स्टाईल), तर दिलेला providedVendorId वापरा
//             finalVendorId = providedVendorId;
//         }

//         // जर वेंडर आयडी नसेल तर एरर द्या
//         if (!finalVendorId) {
//             return res.status(400).json({ success: false, message: "Vendor ID missing" });
//         }
//         // -------------------------------------------------------

//         // Redis Lock logic... (बाकी कोड तसाच ठेवा)
        
//       const newBooking = new Booking({
//     // जर मॅन्युअल आयडी असेल, तर तो डेटाबेसमध्ये नसल्यामुळे एरर येऊ शकतो.
//     // खात्री करा की serviceId हा प्रॉपर 24-character hex string आहे.
//     serviceId: serviceInDb ? serviceInDb._id : null,
//     userId: userId, 
//     vendorId: finalVendorId, 
//     startDate: new Date(startDate), 
//     endDate: new Date(endDate),
//     message, 
//     eventCity, 
//     status: "Pending"
// });

// // सेव्ह करण्यापूर्वी एकदा लॉग करून बघा डेटा काय येतोय
// console.log("Saving Booking:", newBooking); 

//         await newBooking.save();
//         res.status(201).json({ success: true, message: "Booking Request Sent!" });

//     } catch (err) {
//         console.error("Booking Error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     } finally {
//         if (lockKey && client.isOpen) await client.del(lockKey);
//     }
// };

// exports.updateBookingStatus = async (req, res) => {
//     try {
//         const { bookingId } = req.params;
//         const { status } = req.body;

//         const updatedBooking = await Booking.findByIdAndUpdate(
//             bookingId,
//             { status },
//             { returnDocument: 'after', runValidators: true }
//         );

//        if (!updatedBooking) {
//             return res.status(404).json({ success: false, message: "Booking not found" });
//         } 

//         res.status(200).json({ success: true, booking: updatedBooking });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.getVendorBookings = async (req, res) => {
//     try {
//         const { vendorId } = req.params;

//         // वेंडर आयडी 'ObjectId' मध्ये कन्व्हर्ट करणे अनिवार्य आहे
//         const bookings = await Booking.find({ 
//             $or: [
//         { vendorId: vendorId },
//         { vendorId: new mongoose.Types.ObjectId(vendorId) }
//     ]
//             // vendorId: new mongoose.Types.ObjectId(vendorId) 
//         })
//         .populate('userId', 'name email contact')
//         .populate('serviceId', 'businessName price photo style')
//         .sort({ createdAt: -1 });

//         res.status(200).json({ success: true, bookings });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message }); 
//     }
// };



// const cancleBooking = async (req, res) => {
//     try {
//         const {id} = req.params;

//         const updatedBooking = await Booking.findByIdAndUpdate(
//             id,
//             {status: "Cancelled"},
//             {new: true}
//         );

//         if (!updatedBooking) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Booking not found"
//             });
//         }
//         res.status(200).json({
//             success: true,
//             message: "Booking cancelled successfully",
//             booking: updatedBooking
//         });
        

//     } catch (error) {
//         console.error("Cancellation error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Cancellation failed",
//             error: error.message
    
//             });
//     }
// };

// const deleteBooking = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const deletedBooking = await Booking.findByIdAndDelete(id);

//         if(!deletedBooking) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Booking not found"
//             });
//         }
//         res.status(200).json({
//             success: true,
//             message: "Booking deleted successfully"
//         });
//     } catch (error) {
//         console.error("Deletion error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Deletion failed",
//             error: error.message
//         });
//     };
// }


// module.exports = {
//      createAtomicBooking: exports.createAtomicBooking,
//      updateBookingStatus: exports.updateBookingStatus,
//      getVendorBookings: exports.getVendorBookings,
//      cancleBooking,
//         deleteBooking: exports.deleteBooking
//     };    
