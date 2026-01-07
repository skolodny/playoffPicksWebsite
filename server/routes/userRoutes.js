const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'yourSecretKey';

/*
router.post('/register', async (req, res) => {
   const { username, password } = req.body; 
   
    let existingUser = await User.find({ username }); 
    if (existingUser.length > 0) { 
        return res.status(400).json({ message: 'User already exists' }); 
    } 
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword }); 
        await user.save(); 
        
        return res.status(201).json({ 
            message: 'User registered successfully', 
            user: { username: user.username, password: hashedPassword, date: new Date().toISOString().split('T')[0] } 
        }); 
        
    });
*/
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: username });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password is not correct'});
        }
        const payload = { userId: user._id, admin: user.admin }; // Ensure payload contains userId
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
        return res.status(200).json({ token, admin: user.admin });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/getTotalUserScores', async(req, res) => {
    try {
        const users = await User.find({});
        let userScores = [];
        users.forEach((user) => {
            let totalScore = 0;
            user.scores.forEach((score) => {
                totalScore += score;
            });
            userScores.push({ username: user.username, score: totalScore });
        });
        userScores.sort((a, b) => b.score - a.score);
        return res.status(200).json({ userScores });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;