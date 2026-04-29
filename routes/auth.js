const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//SIGNUP ROUTE

router.post('/signup', async (req, res) => {
    try{
        const {name, email, password, role} = req.body;

        let user = await User.findOne({ email });
        if(user) return res.status(400).json({msg: "User already exists"});

        //protect password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name, 
            email,
            password: hashedPassword,
            role: role || 'customer'
        });

        // user = new User({ name, email, password: hashedPassword, role});
        await user.save();

        res.status(201).json({msg: "User created successfully"});
    }catch (err){
        console.error(err);
        res.status(500).send("server Error");
    }
});

//LOGIN 

router.post('/login', async(req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({msg: "User not found"});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({msg: "Invalid user"});

        //JWT TOKEN
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d'}
        );
        res.json({
            token,
            user: {
                id: user._id, name: user.name, email: user.email, role: user.role
            }
        });
    }catch (err){
        res.status(500).json({msg: "server error"});
    }
});

module.exports = router;