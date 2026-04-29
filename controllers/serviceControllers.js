
const mongoose = require('mongoose');
const Service = require('../models/Service');



const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        
        // १. आधी बॉडीमधील डेटा घ्या
        let updateData = { ...req.body };

        // २. फोटोसाठी प्रायोरिटी ठरवा
        if (req.file) {
            // जर नवीन फाईल अपलोड केली असेल (Cloudinary)
            updateData.photo = req.file.path;
        } else if (req.body.photo && req.body.photo.trim() !== "") {
            // जर नवीन Pinterest URL असेल
            updateData.photo = req.body.photo;
        } else {
            // जर काहीच पाठवलं नसेल, तर फोटो अपडेट करू नका (जुनाच राहू द्या)
            delete updateData.photo;
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedService) return res.status(404).json({ msg: "Service not found" });

        res.status(200).json({ msg: "Updated successfully!", data: updatedService });
    } catch (err) {
        res.status(500).json({ msg: "Update failed", error: err.message });
    }
};

// 'style' नुसार सर्व्हिसेस फिल्टर करण्यासाठी




const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedService = await Service.findByIdAndDelete(id);

        if(!deletedService) {
            return res.status(404).json({message: "Service not found!" });
        }

        console.log("Service Deleted Successfully:", deletedService.businessName);
        res.status(200).json({message: "Service deleted successfully!" });
    } catch (error) {
        res.status(500).json({message: "Error deleting service!", error});
    }
}

module.exports = {
    updateService,
    deleteService
};