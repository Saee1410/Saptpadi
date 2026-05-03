const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const serviceRoutes = require('./routes/serviceRoutes');
//const ai = require('./routes/ai');
const budgetRoutes = require('./routes/budget');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

dotenv.config();
const app = express();

//Middleware
app.use(express.json());
app.use(cors({
  origin: [
    "https://saptpadi-frontend.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
// app.use(cors({
//     origin: "https://saptpadi-frontend.vercel.app", // Sarva origins la allow kara (development sathi)
//     methods: ["GET", "POST", "DELETE", "PUT"], // Allowed HTTP methods
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true, // Cookies and authentication headers sathi allow kara    
//     optionsSuccessStatus: 200 // Preflight requests sathi status code
// }));

//uploads foldera for storing images
const path = require('path'); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const fs = require('fs');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
   .then(() => console.log('MongoDB connected'))
   .catch(err => {
         console.error('MongoDB connection error:', err);
         
   })

  
    //Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/service', serviceRoutes);
    //app.use('/api/ai', ai);
    app.use('/api/budget', budgetRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/users', userRoutes);

    app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));