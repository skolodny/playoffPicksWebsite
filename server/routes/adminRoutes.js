const express = require('express');
const router = express.Router();
const Information = require('../models/Information');
const User = require('../models/User');
const nflApiService = require('../services/nflApiService');

/**
 * Utility function to merge API-generated answers with existing manual answers
 * @param {Array} apiAnswers - Answers from API (null for questions without API config)
 * @param {Array} existingAnswers - Existing manual answers
 * @param {Array} questions - Question objects
 * @returns {Array} Merged answers array
 */
function mergeCorrectAnswers(apiAnswers, existingAnswers, questions) {
    return questions.map((question, index) => {
        if (apiAnswers[index] !== null) {
            return apiAnswers[index]; // Use API answer
        } else if (existingAnswers && existingAnswers[index]) {
            return existingAnswers[index]; // Keep existing manual answer
        }
        return null; // No answer yet
    });
}

router.post('/calculateScores', async (req, res) => {
    try {
        const information = await Information.findOne({ currentWeek: true });
        
        // Attempt auto-scoring (service filters for questions with apiConfig)
        try {
            const apiAnswers = await nflApiService.autoScoreQuestions(information.options);
            const mergedAnswers = mergeCorrectAnswers(apiAnswers, information.correctAnswers, information.options);
            information.correctAnswers = mergedAnswers;
            await information.save();
        } catch (apiError) {
            console.error('Auto-scoring failed, falling back to manual scoring:', apiError);
            // Continue with manual scoring if API fails
        }
        
        // Calculate scores based on correctAnswers (whether from API or manual)
        for (let i = 0; i < information.responses.length; i++) {
            let score = 0;
            for (let j = 0; j < information.responses[i].response.length; j++) {
                if (information.responses[i].response[j] === information.correctAnswers[j]) {
                    score += 30;
                }
            }
            const user = await User.findById(information.responses[i].users_id);
            if (user) {
                user.scores[information.weekNumber - 1] = score;
                await user.save();
            }
        }
        return res.status(200).json({ message: 'Scores calculated successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
});

router.post('/createNewWeek', async (req, res) => { 
    try {
        const oldInformation = await Information.findOne({ currentWeek: true });
        const oldWeekNumber = oldInformation.weekNumber;
        oldInformation.currentWeek = false;
        await oldInformation.save();
        const newInformation = new Information({
            options: req.body.options,
            weekNumber: oldWeekNumber + 1,
            correctAnswers: [],
            responses: [],
            editsAllowed: true, // For fantasy lineup editing
            questionEditsAllowed: Array(req.body.options.length).fill(true), // Initialize all questions as editable
            currentWeek: true,
        });
        await newInformation.save();
        res.status(200).json({ message: 'New week created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/setEditStatus', async (req, res) => { 
    try {
        const information = await Information.findOne({ currentWeek: true });
        information.editsAllowed = req.body.editsAllowed;
        await information.save();
        res.status(200).json({ message: 'Edit status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });   
    }
});

router.post('/setQuestionEditStatus', async (req, res) => {
    try {
        const { questionIndex, editsAllowed } = req.body;
        
        if (typeof questionIndex !== 'number' || typeof editsAllowed !== 'boolean') {
            return res.status(400).json({ message: 'Invalid parameters' });
        }
        
        const information = await Information.findOne({ currentWeek: true });
        
        if (!information) {
            return res.status(404).json({ message: 'No current week found' });
        }
        
        if (questionIndex < 0 || questionIndex >= information.options.length) {
            return res.status(400).json({ message: 'Invalid question index' });
        }
        
        // Initialize questionEditsAllowed if it doesn't exist
        if (!information.questionEditsAllowed || information.questionEditsAllowed.length !== information.options.length) {
            information.questionEditsAllowed = Array(information.options.length).fill(true);
        }
        
        information.questionEditsAllowed[questionIndex] = editsAllowed;
        await information.save();
        
        res.status(200).json({ message: 'Question edit status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/setCorrectAnswers', async (req, res) => { 
    try {
        const information = await Information.findOne({ currentWeek: true });
        information.correctAnswers = req.body.correctAnswers;
        await information.save();
        res.status(200).json({ message: 'Correct answers updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }   
});

// NFL API Helper Routes

/**
 * Get all NFL teams
 */
router.get('/nfl/teams', async (req, res) => {
    try {
        const teams = await nflApiService.getTeams();
        res.status(200).json({ teams });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get games for a specific week
 * Query params: week (required), seasonYear (optional), seasonType (optional)
 */
router.get('/nfl/games', async (req, res) => {
    try {
        const { week, seasonYear, seasonType } = req.query;
        if (!week) {
            return res.status(400).json({ message: 'Week parameter is required' });
        }
        const games = await nflApiService.getGamesByWeek(
            parseInt(week),
            seasonYear ? parseInt(seasonYear) : null,
            seasonType ? parseInt(seasonType) : null
        );
        res.status(200).json({ games });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get game winner for a specific game
 * Query params: gameId (required)
 */
router.get('/nfl/game/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameResult = await nflApiService.getGameWinner(gameId);
        res.status(200).json({ game: gameResult });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get detailed game statistics including player stats
 * Query params: gameId (required)
 */
router.get('/nfl/game/:gameId/stats', async (req, res) => {
    try {
        const { gameId } = req.params;
        const gameStats = await nflApiService.getGameStats(gameId);
        res.status(200).json({ stats: gameStats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get specific player stat from a game
 * Query params: gameId (required), playerId (required), statName (required)
 */
router.get('/nfl/game/:gameId/player/:playerId/stat/:statName', async (req, res) => {
    try {
        const { gameId, playerId, statName } = req.params;
        const playerStat = await nflApiService.getPlayerStat(gameId, playerId, statName);
        res.status(200).json({ playerStat });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Auto-score the current week using NFL API
 * Automatically scores questions with apiConfig. Only completed games are scored
 * (filtering is handled by nflApiService).
 */
router.post('/autoScore', async (req, res) => {
    try {
        const information = await Information.findOne({ currentWeek: true });
        
        if (!information) {
            return res.status(404).json({ message: 'No current week found' });
        }
        
        // Get auto-scored answers from NFL API (only for completed games)
        const apiAnswers = await nflApiService.autoScoreQuestions(information.options);
        const mergedAnswers = mergeCorrectAnswers(apiAnswers, information.correctAnswers, information.options);
        
        information.correctAnswers = mergedAnswers;
        await information.save();
        
        // Now calculate scores with the updated correct answers
        for (let i = 0; i < information.responses.length; i++) {
            let score = 0;
            for (let j = 0; j < information.responses[i].response.length; j++) {
                if (information.responses[i].response[j] === information.correctAnswers[j]) {
                    score += 1;
                }
            }
            const user = await User.findById(information.responses[i].users_id);
            if (user) {
                user.scores[information.weekNumber - 1] = score;
                await user.save();
            }
        }
        
        res.status(200).json({ 
            message: 'Auto-scoring completed successfully',
            correctAnswers: mergedAnswers,
            gamesScored: apiAnswers.filter(a => a !== null).length
        });
    } catch (error) {
        console.error('Auto-scoring error:', error);
        res.status(500).json({ message: 'Auto-scoring failed: ' + error.message });
    }
});


module.exports = router;