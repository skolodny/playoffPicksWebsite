const express = require('express');
const Information = require('../models/Information');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const router1 = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'yourSecretKey';

router1.get('/getInfo', async (req, res) => {
    try {
        const information = await Information.findOne({ currentWeek: true });
        
        if (!information) {
            return res.status(404).json({ message: 'No current week found' });
        }
        
        // Initialize questionEditsAllowed if it doesn't exist
        if (!information.questionEditsAllowed || information.questionEditsAllowed.length !== information.options.length) {
            information.questionEditsAllowed = Array(information.options.length).fill(true);
            await information.save();
        }
        
        return res.status(200).json({ information });
    } catch { 
        return res.status(400).json({ message: 'Invalid token' });
    }
});

router1.post('/findResponse', async (req, res) => {
    try {
        const header = req.header('authorization');
        const authorization = header.split(' ');
        const token = authorization.length == 2 ? authorization[1] : authorization[0];  
        const decodedToken = jwt.verify(token, SECRET_KEY);
        const information = await Information.findOne({ currentWeek: true });
        for (let i = 0; i < information.responses.length; i++) {
            if (information.responses[i].users_id.toString() === decodedToken.userId) {
                return res.status(200).json({ response: information.responses[i].response });
            } 
        }
        information.responses.push({ users_id: mongoose.Types.ObjectId.createFromHexString(decodedToken.userId), response: Array(information.options.length), date: new Date() });
        await information.save();
        return res.status(200).json({ response: Array(information.options.length) });
    } catch (err) { 
        console.log(err);
        return res.status(400).json({ message: err });
    }
});

router1.post('/submitResponse', async (req, res) => {
    try {    
        const information = await Information.findOne({ currentWeek: true });
        
        if (!information) {
            return res.status(404).json({ message: 'No current week found' });
        }
        
        const { choices } = req.body;
        if (!Array.isArray(choices)) {
            return res.status(400).json({ message: 'Invalid request: choices must be an array.' });
        }
        
        // Validate that no choice is an array (prevent multiple answers in personal picks)
        if (choices.some(choice => Array.isArray(choice))) {
            return res.status(400).json({ 
                message: 'Cannot submit multiple answers for a single question. Please select only one answer per question for your personal picks.' 
            });
        }
        
        const header = req.header('authorization');
        const authorization = header.split(' ');
        const token = authorization.length == 2 ? authorization[1] : authorization[0]; 
        const decodedToken = jwt.verify(token, SECRET_KEY);
        
        // Initialize questionEditsAllowed if it doesn't exist
        if (!information.questionEditsAllowed || information.questionEditsAllowed.length !== information.options.length) {
            information.questionEditsAllowed = Array(information.options.length).fill(true);
        }
        
        for (let i = 0; i < information.responses.length; i++) {
            if (information.responses[i].users_id.toString() === decodedToken.userId) {
                // Check per-question edit status and only update allowed fields
                const updatedResponse = [...information.responses[i].response];
                
                for (let j = 0; j < choices.length && j < information.questionEditsAllowed.length; j++) {
                    // Only update if editing is allowed for this specific question
                    if (information.questionEditsAllowed[j]) {
                        updatedResponse[j] = choices[j];
                    }
                }
                
                information.responses[i].response = updatedResponse;
                information.responses[i].date = new Date();
                await information.save();
                return res.status(200).json({ message: 'Response submitted' });
            }
        }
        return res.status(400).json({ message: 'Response not found' });
    } catch (err) {
        return res.status(400).json({ message: 'Invalid request' });
    }
});

router1.get('/getAllResponses', async (req, res) => { 
    try {
        const information = await Information.findOne({ currentWeek: true });
        const responses = [];
        const questions = [];
        questions.push({ "title": "Username", "dataIndex": "username", "key": "username" });
        for (let i = 0; i < information.responses.length; i++) {
            const user = await User.findOne({ _id: information.responses[i].users_id })
            const object = {"username": user.username}
            for (let j = 0; j < information.responses[i].response.length; j++) {
                object["q" + j] = information.responses[i].response[j];
            }
            responses.push(object);
        }
        for (let i = 0; i < information.options.length; i++) {
            questions.push({ "title": information.options[i].question, "dataIndex": "q" + i, "key": "q" + i})
        }
        return res.status(200).json({ questions: questions, responses: responses });
    } catch(err) {
        console.log(err);
        return res.status(400).json({ message: 'Invalid request' });
    }
});


module.exports = router1;