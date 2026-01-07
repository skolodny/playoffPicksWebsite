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
        return res.status(200).json({ information });
    } catch (err) { 
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
        if (!information.editsAllowed) {
            return res.status(400).json({ message: 'Edits not allowed' });
        }
        const { choices } = req.body;
        const header = req.header('authorization');
        const authorization = header.split(' ');
        const token = authorization.length == 2 ? authorization[1] : authorization[0]; 
        const decodedToken = jwt.verify(token, SECRET_KEY);
        for (let i = 0; i < information.responses.length; i++) {
            if (information.responses[i].users_id.toString() === decodedToken.userId) {
                information.responses[i].response = choices;
                information.responses[i].date = new Date();
                information.save();
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