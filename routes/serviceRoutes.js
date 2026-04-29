const express = require('express');
const router = express.Router();
const multer = require('multer');
const Service = require('../models/Service');
const { protect } = require('../middleware/authMiddleware');
const { updateService, deleteService } = require('../controllers/serviceControllers');
const { storage } = require('../config/cloudinaryConfig');

 const upload = multer({ storage: storage });

//router.put('/:id', upload.single('photo'), updateService);

// Routes
router.post('/add', protect, upload.single('photo'), async(req, res) => {
    try {
        const { businessName, category, style, price, contactInfo, location, description, videoUrl, externalUrl } = req.body;
        const photoUrl = req.file ? req.file.path : (req.body.photo || '');

        const newService = new Service({
            vendorId: req.user.id,
            businessName, category, style, price, contactInfo, location, description, videoUrl, externalUrl,
            photo: photoUrl
        });
        
        await newService.save();
        res.status(201).json({msg: "service added successfully", service: newService});
    } catch (err) {
        res.status(500).json({msg: "Failed to add service", error: err.message});
    }
});

router.get('/all', async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({ message: "Failed to retrieve services" });
    }
});

// // 4. GET BY STYLE
router.get('/style/:styleName', async (req, res) => {
    try {
        const { styleName } = req.params;
        const services = await Service.find({ 
            style: { $regex: new RegExp(styleName, 'i') } 
        }).sort({ createdAt: -1 });
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({msg: "Failed to retrieve services by style"});
    }
});


router.get('/', async (req, res) => {
    try {
        const { location } = req.query;
        let filter = {};
        if (location && location !== "undefined") {
            // जर location मध्ये 'goa' येत असेल तर ते DB मध्ये शोधेल
            filter.location = { $regex: location, $options: 'i' }; 
        }
        const services = await Service.find(filter).sort({ createdAt: -1 });
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({msg: "Failed to retrieve services"}); 
    }
});

router.get('/my-services', protect, async (req, res) => {
    try {
        const services = await Service.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({msg: "Failed to retrieve services"});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({msg: "Service not found"});
        res.status(200).json(service);
    } catch (err) {
        res.status(500).json({msg: "Error fetching service"});
    }
});

router.put('/:id', protect, upload.single('photo'), updateService);
router.delete('/:id', protect, deleteService);


module.exports = router;
