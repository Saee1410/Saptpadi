const express = require('express');
const router = express.Router();
const { getUserById, updateUserProfile, updateUser } = require('../controllers/userController');

router.get('/:id', getUserById);

router.put('/update/:id', updateUserProfile);

router.put('/update-vendor/:id', updateUserProfile); // New route for vendor profilse update

router.put('/update-user/:id', updateUser); // New route for user profile update



module.exports = router;