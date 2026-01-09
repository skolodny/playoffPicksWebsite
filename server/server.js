const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const informationRoutes = require('./routes/informationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fantasyRoutes = require('./routes/fantasyRoutes');
const adminAuth = require('./adminAuth');
const auth = require('./auth');  
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URL = process.env.MONGODB_URL;

var limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // max 100 requests per windowMs per IP
});

// apply rate limiter to all requests
app.use(limiter);

app.use(cors());
app.use(express.json());


mongoose.connect(MONGODB_URL) //TODO: Move to .env 
    .then(() => console.log('Connected to MongoDB')) 
    .catch(err => console.error('Could not connect to MongoDB', err));

app.use('/api/users', userRoutes);
app.use('/api/information', informationRoutes);
app.use('/api/admin', adminAuth, adminRoutes);
// Fantasy routes - most endpoints require JWT authentication; some endpoints (e.g., leaderboard) are public, and admin-only routes are protected within the router
app.use('/api', fantasyRoutes);
app.use('/api/protected', auth, (req, res) => {
    res.json({ message: 'This is a protected route' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.post('/', (req, res) => { res.send('POST request received'); }); 
