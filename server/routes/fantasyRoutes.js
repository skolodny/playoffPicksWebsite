const express = require('express');
const router = express.Router();
const PlayerLineup = require('../models/PlayerLineup');
const Information = require('../models/Information');
const NFLPlayer = require('../models/NFLPlayer');
const fantasyService = require('../services/fantasyService');
const adminAuth = require('../adminAuth');
const jwt = require('jsonwebtoken');

// Use environment variable for SECRET_KEY in production
// Fallback to 'yourSecretKey' for test environment only
const SECRET_KEY = process.env.SECRET_KEY || 'yourSecretKey';

/**
 * USER-AUTHENTICATED ROUTES
 * These routes use the same authentication pattern as informationRoutes
 * JWT token extracted from 'authorization' header and decoded manually
 */

/**
 * Middleware to extract and verify userId from JWT token
 * Same pattern as informationRoutes for consistency
 */
function extractUserFromToken(req, res, next) {
    const header = req.header('authorization');
    if (!header) {
        return res.status(401).json({ message: 'No authorization token provided' });
    }
    const authorization = header.split(' ');
    const token = authorization.length == 2 ? authorization[1] : authorization[0];
    try {
        const decodedToken = jwt.verify(token, SECRET_KEY);
        req.userId = decodedToken.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

/**
 * Get available players by position for the authenticated user and current week
 * Excludes players the user has already selected in previous weeks
 * Automatically uses the current week from the database
 * 
 * Query params:
 * - position: Position (QB, RB, WR, TE, K, DEF, FLEX) OR 'ALL' for all positions (required)
 * 
 * Headers:
 * - authorization: Bearer token or token
 * 
 * Security: Requires authentication - userId extracted from JWT token
 */
router.get('/fantasy/availablePlayers', extractUserFromToken, async (req, res) => {
    try {
        const { position } = req.query;
        const userId = req.userId; // Extracted by middleware
        
        if (!position) {
            return res.status(400).json({ 
                message: 'position is required' 
            });
        }
        
        const validPositions = ['QB', 'RB', 'WR', 'TE', 'PK', 'DEF', 'FLEX', 'ALL'];
        if (!validPositions.includes(position)) {
            return res.status(400).json({ 
                message: `Invalid position. Must be one of: ${validPositions.join(', ')}` 
            });
        }
        
        // Get current week from database
        const weekInfo = await Information.findOne({ currentWeek: true });
        
        if (!weekInfo) {
            return res.status(404).json({ 
                message: 'No current week found. Please contact administrator.' 
            });
        }
        
        const weekNumber = weekInfo.weekNumber;
        
        // Handle 'ALL' position to return all available players grouped by position
        if (position === 'ALL') {
            const allPlayers = await fantasyService.getAvailablePlayersAllPositions(
                userId,
                weekNumber
            );
            
            res.status(200).json({ 
                weekNumber,
                availablePlayers: allPlayers
            });
        } else {
            // Single position query
            const players = await fantasyService.getAvailablePlayersByPosition(
                userId,
                position,
                weekNumber
            );
            
            res.status(200).json({ 
                position,
                weekNumber,
                availablePlayers: players
            });
        }
    } catch (error) {
        console.error('Error fetching available players:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Submit a fantasy lineup for the current week
 * Automatically uses the current week from the database
 * Accepts player names (not IDs) in the lineup
 * 
 * Body:
 * - lineup: Object with positions (QB, RB1, RB2, WR1, WR2, TE, FLEX, K, DEF) and player names (required)
 * 
 * Headers:
 * - authorization: Bearer token or token
 * 
 * Security: Requires authentication - userId extracted from JWT token
 */
router.post('/fantasy/submitLineup', extractUserFromToken, async (req, res) => {
    try {
        const { lineup } = req.body;
        const userId = req.userId; // Extracted by middleware
        
        if (!lineup) {
            return res.status(400).json({ 
                message: 'lineup is required' 
            });
        }
        
        // Get current week from database
        const weekInfo = await Information.findOne({ currentWeek: true });
        
        if (!weekInfo) {
            return res.status(404).json({ 
                message: 'No current week found. Please contact administrator.' 
            });
        }
        
        const weekNumber = weekInfo.weekNumber;
        
        // Check if edits are allowed for this week
        if (weekInfo.editsAllowed === false) {
            return res.status(403).json({ 
                message: 'Lineup submissions are not allowed for this week. Edits have been disabled.' 
            });
        }
        
        // Validate lineup has all required positions
        const requiredPositions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'TE', 'FLEX', 'PK', 'DEF'];
        const missingPositions = requiredPositions.filter(pos => !lineup[pos]);
        
        if (missingPositions.length > 0) {
            return res.status(400).json({ 
                message: `Missing required positions: ${missingPositions.join(', ')}` 
            });
        }
        
        // Validate no duplicate players in lineup using Set size comparison
        const playerNames = Object.values(lineup);
        const uniquePlayerNames = new Set(playerNames);

        if (uniquePlayerNames.size !== playerNames.length) {
            return res.status(400).json({
                message: 'Duplicate players in lineup detected. Each player can only be selected once per week.'
            });
        }
        
        // Check if any players have been used in previous weeks
        const previousLineups = await PlayerLineup.find({
            userId: userId,
            weekNumber: { $lt: weekNumber }
        });
        
        const usedPlayerNames = new Set();
        previousLineups.forEach(prevLineup => {
            Object.values(prevLineup.lineup).forEach(playerName => {
                usedPlayerNames.add(playerName);
            });
        });
        
        const reusedPlayers = playerNames.filter(playerName => usedPlayerNames.has(playerName));
        
        if (reusedPlayers.length > 0) {
            return res.status(400).json({ 
                message: `The following players have already been used in previous weeks: ${reusedPlayers.join(', ')}. Players cannot be reused across multiple weeks.` 
            });
        }
        
        // Check if user has already submitted a lineup for this week
        const existingLineup = await PlayerLineup.findOne({ userId, weekNumber });
        
        if (existingLineup) {
            // Update existing lineup
            existingLineup.lineup = lineup;
            existingLineup.submittedAt = new Date();
            await existingLineup.save();
            
            return res.status(200).json({ 
                message: 'Lineup updated successfully',
                lineup: existingLineup
            });
        } else {
            // Create new lineup
            const newLineup = new PlayerLineup({
                userId,
                weekNumber,
                lineup
            });
            await newLineup.save();
            
            return res.status(201).json({ 
                message: 'Lineup submitted successfully',
                lineup: newLineup
            });
        }
    } catch (error) {
        console.error('Error submitting lineup:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * ADMIN ROUTE - Calculate PPR fantasy scores
 * Calculate and update PPR fantasy scores for the current week (Admin only)
 * This endpoint calculates PPR points for all submitted lineups for the current week
 * Automatically uses the current week from the database
 * 
 * Security: ADMIN ONLY - Protected by adminAuth middleware
 */
router.post('/admin/fantasy/calculateScores', adminAuth, async (req, res) => {
    try {
        // Get current week from database
        const weekInfo = await Information.findOne({ currentWeek: true });
        
        if (!weekInfo) {
            return res.status(404).json({ message: 'No current week found in database' });
        }
        
        const weekNumber = weekInfo.weekNumber;
        
        // Get all lineups for this week
        const lineups = await PlayerLineup.find({ weekNumber: parseInt(weekNumber) });
        
        if (lineups.length === 0) {
            return res.status(404).json({ 
                message: `No lineups found for week ${weekNumber}` 
            });
        }
        
        const results = [];
        
        // Calculate points for each lineup
        for (const lineup of lineups) {
            try {
                const result = await fantasyService.calculateLineupPPR(
                    lineup.userId.toString(),
                    parseInt(weekNumber)
                );
                results.push(result);
            } catch (error) {
                console.error(`Error calculating points for user ${lineup.userId}:`, error);
                results.push({
                    userId: lineup.userId,
                    weekNumber: parseInt(weekNumber),
                    error: error.message,
                    totalPoints: 0
                });
            }
        }
        
        res.status(200).json({ 
            message: 'Fantasy scores calculated successfully',
            weekNumber: parseInt(weekNumber),
            results
        });
    } catch (error) {
        console.error('Error calculating fantasy scores:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get fantasy lineup for the authenticated user
 * Automatically uses the current week from the database
 * Already returns player names (stored directly in the lineup)
 * 
 * Query params:
 * - weekNumber: Week number (optional, defaults to current week)
 * 
 * Headers:
 * - authorization: Bearer token or token
 * 
 * Security: Requires authentication - userId extracted from JWT token
 */
router.get('/fantasy/lineup', extractUserFromToken, async (req, res) => {
    try {
        const { weekNumber } = req.query;
        const userId = req.userId; // Extracted by middleware
        
        let targetWeek = weekNumber;
        
        // If weekNumber not provided, get current week from database
        if (!targetWeek) {
            const weekInfo = await Information.findOne({ currentWeek: true });
            if (!weekInfo) {
                return res.status(404).json({ message: 'No current week found in database' });
            }
            targetWeek = weekInfo.weekNumber;
        }
        
        const lineup = await PlayerLineup.findOne({ 
            userId, 
            weekNumber: parseInt(targetWeek) 
        });
        
        if (!lineup) {
            return res.status(404).json({ 
                message: 'No lineup found for this user and week' 
            });
        }
        
        // Lineup already contains player names, return as-is
        res.status(200).json({ 
            lineup: lineup.toObject()
        });
    } catch (error) {
        console.error('Error fetching lineup:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get fantasy leaderboard
 * Automatically uses the current week from the database
 * 
 * Query params:
 * - weekNumber: Week number (optional, defaults to current week)
 * 
 * Security: Public route - anyone can view leaderboard
 */
router.get('/fantasy/leaderboard', async (req, res) => {
    try {
        const { weekNumber } = req.query;
        
        let targetWeek = weekNumber;
        
        // If weekNumber not provided, get current week from database
        if (!targetWeek) {
            const weekInfo = await Information.findOne({ currentWeek: true });
            if (!weekInfo) {
                return res.status(404).json({ message: 'No current week found in database' });
            }
            targetWeek = weekInfo.weekNumber;
        }
        
        const lineups = await PlayerLineup.find({ 
            weekNumber: parseInt(targetWeek) 
        })
        .sort({ totalPoints: -1 })
        .populate('userId', 'username');
        
        const leaderboard = lineups.map((lineup, index) => ({
            rank: index + 1,
            username: lineup.userId.username,
            userId: lineup.userId._id,
            totalPoints: lineup.totalPoints,
            ...lineup.lineup
        }));
        
        res.status(200).json({ 
            weekNumber: parseInt(targetWeek),
            leaderboard 
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get user's previously selected players across all weeks
 * Returns player names (not IDs) since that's what's stored in the lineup
 * 
 * Headers:
 * - authorization: Bearer token or token
 * 
 * Security: Requires authentication - userId extracted from JWT token
 */
router.get('/fantasy/playerHistory', extractUserFromToken, async (req, res) => {
    try {
        const userId = req.userId; // Extracted by middleware
        
        const lineups = await PlayerLineup.find({ userId }).sort({ weekNumber: 1 });
        
        const usedPlayers = new Set();
        const historyByWeek = {};
        
        lineups.forEach(lineup => {
            Object.values(lineup.lineup).forEach(playerName => {
                usedPlayers.add(playerName);
            });
            
            historyByWeek[lineup.weekNumber] = lineup.lineup;
        });
        
        res.status(200).json({ 
            userId,
            totalWeeks: lineups.length,
            usedPlayers: Array.from(usedPlayers),
            historyByWeek
        });
    } catch (error) {
        console.error('Error fetching player history:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
