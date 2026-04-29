const multer = require('multer');
const { storage } = require('../config/cloudinaryConfig'); // तुझी क्लाउडिनरी फाईल

const upload = multer({ storage: storage });

module.exports = upload;