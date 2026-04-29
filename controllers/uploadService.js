const Service = require("../models/Service");
const mongoose = require("mongoose");   

const getServices = async (req, res) => {
    try {
        const {style} = req.query;
        let filter = {};
        if(style) {
            filter.style = style;
        }
        const service = (await Service.find(filter)).toSorted({ createdAt: -1 });
        res.status(200).json(service);
    }catch (err) {
        console.error("Error in getServices:", err);
        res.status(500).json({ msg: "Failed to fetch services", error: err });
    }
};

const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "Invalid ID format" });
        }

        // Create a clean update object
        let updateData = { ...req.body };
        
        // Remove sensitive/immutable fields
        delete updateData._id;
        delete updateData.vendorId;

        // CRITICAL: Ensure price is a number, not an empty string or "NaN"
        if (updateData.price) {
            updateData.price = Number(updateData.price);
        }

        // IMAGE LOGIC: 
        if (req.file) {
            // If a new file was uploaded via Multer/Cloudinary
            updateData.photo = req.file.path; 
        } else if (req.body.photo) {
            // If it's a URL string from the frontend, keep it. 
            // If it's the string "null" or "undefined", remove it so it doesn't overwrite with junk
            if (updateData.photo === "null" || updateData.photo === "undefined") {
                delete updateData.photo;
            }
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedService) return res.status(404).json({ msg: "Not found" });
        res.status(200).json({ msg: "Updated!", data: updatedService });

    } catch (err) {
        console.error("SERVER ERROR:", err); // Check your terminal for this!
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};


// const uploadService = async (req, res) => {
//     try {
//         // १. फोटोचा पाथ ठरवणे (Hybrid Logic)
//         let imageUrl = "";

//         if (req.file) {
//             // जर गॅलरीमधून फाईल निवडली असेल तर Cloudinary पाथ वापरा
//             imageUrl = req.file.path; 
//         } else if (req.body.photo) {
//             // जर फाईल नसेल पण Pinterest/Direct URL असेल तर ती वापरा
//             imageUrl = req.body.photo;
//         }

//         // २. जर दोन्ही रिकामे असतील तरच एरर द्या
//         if (!imageUrl) {
//             return res.status(400).json({ msg: "Please upload an image or provide a photo URL." });
//         }

//         // ३. नवीन सर्व्हिस तयार करा
//         const newService = new Service({
//             ...req.body,
//             vendorId: req.user.id, // Auth middleware मधून आलेला ID
//             photo: imageUrl,       // हा आपला Hybrid Path
//         });

//         await newService.save();
        
//         res.status(201).json({ 
//             msg: "Service added successfully!", 
//             data: newService 
//         });

//     } catch (err) {
//         console.error("Error in uploadService:", err);
//         res.status(500).json({ msg: "Failed to add service", error: err.message });
//     }
// };



// const uploadService = async (req, res) => {
//     try {
//         if(!req.file) {
//             return res.status(400).json({ msg: "File missing"});
//         }

//         const imageUrl = req.file.path.replace(/\\/g, '/'); 

//         const newService = new Service({
//             ...req.body,
//             photo: imageUrl,
//         });
//         await newService.save();
//         res.status(201).json(
//             { msg: "service added successfully to cloudinary!",
//                 data: newService
//             }
//         );
    
//     } catch (err){
//         console.error("Error in uploadService:", err);
//         res.status(500).json({msg: "Failed to add service", error: err});
//     }
// };

const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if(!service){
            return res.status(404).json({ msg: "Service not found"});
        }
        await Service.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: "Service deleted successfully"});
    } catch (error) {
        console.error("Error in deleteService:", error);
        res.status(500).json({msg: "Failed to delete service", error: error.message });
    }
};

module.exports = { uploadService, deleteService, getServices };




// const Service = require('../models/Service');
// const sharp = require('sharp');
// const fs = require('fs');
// const path = require('path');

// const uploadService = async (req, res) => {
//     try {
//         if(!req.file) return res.status(400).json({ msg: "File missing" });

//         const compressedFileName = `compressed-${Date.now()}.webp`;
//         const outputPath = `uploads/${compressedFileName}`;

//         await sharp(req.file.path)
//         .resize(800)
//         .jpeg({ quality: 70})
//         .toFile(outputPath);

//         fs.unlinkSync(req.file.path);

//         const newService = new Service({
//             ...req.body,
//             photo: compressedFileName,

//         });
//         await newService.save();
//         res.status(201).json({ msg: "Service added successfully!", data: newService});

//     } catch (error){
//         console.error("Error in uploadService:", error);
//         res.status(500).json({ msg: "Failed to add service", error });
//     }
// };

// const deleteService = async (req, res) => {
//     try {
//         const service = await Service.findById(req.params.id);
//         if(!service) {
//             return res.status(404).json({ msg: "service not found"});
//         }

//         if(service.photo) {
//             const imagePath = path.join(__dirname, '..', 'uploads', service.photo);
//             if(fs.existsSync(imagePath)) {
//                 fs.unlinkSync(imagePath);
//             }
//         }
//         await Service.findByIdAndDelete(req.params.id);
//         res.status(200).json({ msg: "service deleted successfully"});
//     } catch (error) {
//         console.error("Error in deleteService:", error);
//         res.status(500).json({ msg: "Failed to delete service", error });
//     }
// }

// module.exports = { uploadService, deleteService };