/**
 * Tests for Fantasy Football Routes
 * These tests verify the fantasy lineup and scoring functionality
 */

const request = require('supertest');
const express = require('express');
const fantasyRoutes = require('../routes/fantasyRoutes');
const jwt = require('jsonwebtoken');

// Mock the authentication middlewares
jest.mock('../adminAuth', () => (req, res, next) => next());


// Mock the models
jest.mock('../models/PlayerLineup');
jest.mock('../models/User');
jest.mock('../models/Information');
jest.mock('../models/NFLPlayer');

// Mock the fantasy service
jest.mock('../services/fantasyService');

// Mock the NFL API service
jest.mock('../services/nflApiService');

const PlayerLineup = require('../models/PlayerLineup');
const Information = require('../models/Information');
const NFLPlayer = require('../models/NFLPlayer');
const fantasyService = require('../services/fantasyService');
const nflApiService = require('../services/nflApiService');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api', fantasyRoutes);

// Helper to generate test token
const SECRET_KEY = 'yourSecretKey';
const generateTestToken = (userId = 'user1', admin = false) => {
    const payload = { userId, admin };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
};

describe('Fantasy Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/fantasy/availablePlayers', () => {
        test('should return available players for a position', async () => {
            const mockPlayers = [
                { id: '123', name: 'Player 1', position: 'QB', team: 'Team A' },
                { id: '456', name: 'Player 2', position: 'QB', team: 'Team B' }
            ];
            
            Information.findOne.mockResolvedValue({ weekNumber: 1, currentWeek: true, editsAllowed: true });
            fantasyService.getAvailablePlayersByPosition.mockResolvedValue(mockPlayers);
            
            const response = await request(app)
                .get('/api/fantasy/availablePlayers')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .query({ position: 'QB' })
                .expect(200);
            
            expect(response.body).toHaveProperty('availablePlayers');
            expect(response.body.availablePlayers).toEqual(mockPlayers);
            expect(response.body.position).toBe('QB');
            expect(response.body.weekNumber).toBe(1);
        });

        test('should require authorization token', async () => {
            const response = await request(app)
                .get('/api/fantasy/availablePlayers')
                .query({ position: 'QB' })
                .expect(401);
            
            expect(response.body.message).toContain('No authorization token provided');
        });

        test('should require position parameter', async () => {
            const response = await request(app)
                .get('/api/fantasy/availablePlayers')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .expect(400);
            
            expect(response.body.message).toContain('required');
        });

        test('should validate position', async () => {
            Information.findOne.mockResolvedValue({ weekNumber: 1, currentWeek: true, editsAllowed: true });
            
            const response = await request(app)
                .get('/api/fantasy/availablePlayers')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .query({ position: 'INVALID' })
                .expect(400);
            
            expect(response.body.message).toContain('Invalid position');
        });

        test('should return 404 if no current week found', async () => {
            Information.findOne.mockResolvedValue(null);
            
            const response = await request(app)
                .get('/api/fantasy/availablePlayers')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .query({ position: 'QB' })
                .expect(404);
            
            expect(response.body.message).toContain('No current week found');
        });
    });

    describe('POST /api/fantasy/submitLineup', () => {
        test('should submit a new lineup', async () => {
            const lineup = {
                QB: '123',
                RB1: '456',
                RB2: '789',
                WR1: '111',
                WR2: '222',
                TE: '333',
                FLEX: '444',
                PK: '555',
                DEF: '666'
            };
            
            Information.findOne.mockResolvedValue({ weekNumber: 1, currentWeek: true, editsAllowed: true });
            PlayerLineup.find.mockResolvedValue([]);
            PlayerLineup.findOne.mockResolvedValue(null);
            PlayerLineup.prototype.save = jest.fn().mockResolvedValue({ userId: 'user1', weekNumber: 1, lineup });
            
            const response = await request(app)
                .post('/api/fantasy/submitLineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .send({ lineup })
                .expect(201);
            
            expect(response.body.message).toContain('submitted successfully');
        });

        test('should update existing lineup', async () => {
            const existingLineup = {
                userId: 'user1',
                weekNumber: 1,
                lineup: {},
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue({ weekNumber: 1, currentWeek: true, editsAllowed: true });
            PlayerLineup.find.mockResolvedValue([]);
            PlayerLineup.findOne.mockResolvedValue(existingLineup);
            
            const response = await request(app)
                .post('/api/fantasy/submitLineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .send({
                    lineup: {
                        QB: '123',
                        RB1: '456',
                        RB2: '789',
                        WR1: '111',
                        WR2: '222',
                        TE: '333',
                        FLEX: '444',
                        PK: '555',
                        DEF: '666'
                    }
                })
                .expect(200);
            
            expect(response.body.message).toContain('updated successfully');
        });

        test('should validate required positions', async () => {
            Information.findOne.mockResolvedValue({ weekNumber: 1, currentWeek: true, editsAllowed: true });
            
            const response = await request(app)
                .post('/api/fantasy/submitLineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .send({
                    lineup: {
                        QB: '123'
                        // Missing other positions
                    }
                })
                .expect(400);
            
            expect(response.body.message).toContain('Missing required positions');
        });

        test('should reject submission when edits are not allowed', async () => {
            Information.findOne.mockResolvedValue({
                weekNumber: 1,
                currentWeek: true,
                editsAllowed: false
            });
            
            const response = await request(app)
                .post('/api/fantasy/submitLineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .send({
                    lineup: {
                        QB: '123',
                        RB1: '456',
                        RB2: '789',
                        WR1: '111',
                        WR2: '222',
                        TE: '333',
                        FLEX: '444',
                        PK: '555',
                        DEF: '666'
                    }
                })
                .expect(403);
            
            expect(response.body.message).toContain('Lineup submissions are not allowed');
        });

        test('should reject duplicate players in lineup', async () => {
            Information.findOne.mockResolvedValue({
                weekNumber: 1,
                currentWeek: true,
                editsAllowed: true
            });
            PlayerLineup.find.mockResolvedValue([]);
            
            const response = await request(app)
                .post('/api/fantasy/submitLineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .send({
                    lineup: {
                        QB: '123',
                        RB1: '456',
                        RB2: '456', // Duplicate of RB1
                        WR1: '111',
                        WR2: '222',
                        TE: '333',
                        FLEX: '444',
                        PK: '555',
                        DEF: '666'
                    }
                })
                .expect(400);
            
            expect(response.body.message).toContain('Duplicate players in lineup');
        });

        test('should reject players used in previous weeks', async () => {
            Information.findOne.mockResolvedValue({
                weekNumber: 2,
                currentWeek: true,
                editsAllowed: true
            });
            
            // Mock previous lineups
            PlayerLineup.find.mockResolvedValue([
                {
                    userId: 'user1',
                    weekNumber: 1,
                    lineup: {
                        QB: '123', // This player was used in week 1
                        RB1: '999',
                        RB2: '888',
                        WR1: '777',
                        WR2: '666',
                        TE: '555',
                        FLEX: '444',
                        PK: '333',
                        DEF: '222'
                    }
                }
            ]);
            
            const response = await request(app)
                .post('/api/fantasy/submitLineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .send({
                    lineup: {
                        QB: '123', // Trying to reuse player from week 1
                        RB1: '456',
                        RB2: '789',
                        WR1: '111',
                        WR2: '222',
                        TE: '333',
                        FLEX: '444',
                        PK: '555',
                        DEF: '666'
                    }
                })
                .expect(400);
            
            expect(response.body.message).toContain('already been used in previous weeks');
        });

        test('should allow lineup with edits allowed and no duplicates', async () => {
            Information.findOne.mockResolvedValue({
                weekNumber: 1,
                currentWeek: true,
                editsAllowed: true
            });
            PlayerLineup.find.mockResolvedValue([]);
            PlayerLineup.findOne.mockResolvedValue(null);
            PlayerLineup.prototype.save = jest.fn().mockResolvedValue(true);
            
            const response = await request(app)
                .post('/api/fantasy/submitLineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .send({
                    lineup: {
                        QB: '123',
                        RB1: '456',
                        RB2: '789',
                        WR1: '111',
                        WR2: '222',
                        TE: '333',
                        FLEX: '444',
                        PK: '555',
                        DEF: '666'
                    }
                })
                .expect(201);
            
            expect(response.body.message).toContain('submitted successfully');
        });

        test('should return 404 if no current week found', async () => {
            Information.findOne.mockResolvedValue(null);
            
            const response = await request(app)
                .post('/api/fantasy/submitLineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .send({
                    lineup: {
                        QB: '123',
                        RB1: '456',
                        RB2: '789',
                        WR1: '111',
                        WR2: '222',
                        TE: '333',
                        FLEX: '444',
                        PK: '555',
                        DEF: '666'
                    }
                })
                .expect(404);
            
            expect(response.body.message).toContain('No current week found');
        });
    });

    describe('POST /api/admin/fantasy/calculateScores', () => {
        test('should calculate fantasy scores for current week', async () => {
            const mockWeekInfo = { weekNumber: 1, currentWeek: true };
            const mockLineups = [
                { userId: 'user1', weekNumber: 1, lineup: {} },
                { userId: 'user2', weekNumber: 1, lineup: {} }
            ];
            
            const mockResults = [
                { userId: 'user1', weekNumber: 1, totalPoints: 120.5 },
                { userId: 'user2', weekNumber: 1, totalPoints: 98.3 }
            ];
            
            Information.findOne.mockResolvedValue(mockWeekInfo);
            PlayerLineup.find.mockResolvedValue(mockLineups);
            fantasyService.calculateLineupPPR
                .mockResolvedValueOnce(mockResults[0])
                .mockResolvedValueOnce(mockResults[1]);
            
            const response = await request(app)
                .post('/api/admin/fantasy/calculateScores')
                .send({})
                .expect(200);
            
            expect(response.body.message).toContain('calculated successfully');
            expect(response.body.results).toHaveLength(2);
            expect(response.body.weekNumber).toBe(1);
        });

        test('should handle no current week found', async () => {
            Information.findOne.mockResolvedValue(null);
            
            const response = await request(app)
                .post('/api/admin/fantasy/calculateScores')
                .send({})
                .expect(404);
            
            expect(response.body.message).toContain('No current week found');
        });

        test('should handle no lineups found', async () => {
            const mockWeekInfo = { weekNumber: 1, currentWeek: true };
            Information.findOne.mockResolvedValue(mockWeekInfo);
            PlayerLineup.find.mockResolvedValue([]);
            
            const response = await request(app)
                .post('/api/admin/fantasy/calculateScores')
                .send({})
                .expect(404);
            
            expect(response.body.message).toContain('No lineups found');
        });
    });

    describe('GET /api/fantasy/lineup', () => {
        test('should return lineup for user and week', async () => {
            const mockLineup = {
                userId: 'user1',
                weekNumber: 1,
                lineup: { QB: '123' },
                totalPoints: 100,
                toObject: function() { return { userId: this.userId, weekNumber: this.weekNumber, lineup: this.lineup, totalPoints: this.totalPoints }; }
            };
            
            PlayerLineup.findOne.mockResolvedValue(mockLineup);
            NFLPlayer.findOne.mockResolvedValue({ name: 'Test Player' });
            nflApiService.getTeams.mockResolvedValue([]);
            
            const response = await request(app)
                .get('/api/fantasy/lineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .query({ weekNumber: 1 })
                .expect(200);
            
            expect(response.body.lineup.userId).toBe('user1');
            expect(response.body.lineup.weekNumber).toBe(1);
        });

        test('should return lineup for user using current week', async () => {
            const mockWeekInfo = { weekNumber: 2, currentWeek: true };
            const mockLineup = {
                userId: 'user1',
                weekNumber: 2,
                lineup: { QB: '456' },
                totalPoints: 110,
                toObject: function() { return { userId: this.userId, weekNumber: this.weekNumber, lineup: this.lineup, totalPoints: this.totalPoints }; }
            };
            
            Information.findOne.mockResolvedValue(mockWeekInfo);
            PlayerLineup.findOne.mockResolvedValue(mockLineup);
            NFLPlayer.findOne.mockResolvedValue({ name: 'Test Player' });
            nflApiService.getTeams.mockResolvedValue([]);
            
            const response = await request(app)
                .get('/api/fantasy/lineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .expect(200);
            
            expect(response.body.lineup.userId).toBe('user1');
            expect(response.body.lineup.weekNumber).toBe(2);
        });

        test('should return 404 if lineup not found', async () => {
            PlayerLineup.findOne.mockResolvedValue(null);
            
            const response = await request(app)
                .get('/api/fantasy/lineup')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .query({ weekNumber: 1 })
                .expect(404);
            
            expect(response.body.message).toContain('No lineup found');
        });
    });

    describe('GET /api/fantasy/leaderboard', () => {
        test('should return leaderboard for a week', async () => {
            const mockLineups = [
                {
                    userId: { _id: 'user1', username: 'player1' },
                    weekNumber: 1,
                    totalPoints: 150,
                    lineup: {}
                },
                {
                    userId: { _id: 'user2', username: 'player2' },
                    weekNumber: 1,
                    totalPoints: 120,
                    lineup: {}
                }
            ];
            
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue(mockLineups)
            };
            
            PlayerLineup.find.mockReturnValue(mockQuery);
            
            const response = await request(app)
                .get('/api/fantasy/leaderboard')
                .query({ weekNumber: 1 })
                .expect(200);
            
            expect(response.body.leaderboard).toHaveLength(2);
            expect(response.body.leaderboard[0].rank).toBe(1);
            expect(response.body.leaderboard[0].username).toBe('player1');
        });

        test('should return leaderboard for current week when weekNumber not provided', async () => {
            const mockWeekInfo = { weekNumber: 2, currentWeek: true };
            const mockLineups = [
                {
                    userId: { _id: 'user1', username: 'player1' },
                    weekNumber: 2,
                    totalPoints: 150,
                    lineup: {}
                }
            ];
            
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue(mockLineups)
            };
            
            Information.findOne.mockResolvedValue(mockWeekInfo);
            PlayerLineup.find.mockReturnValue(mockQuery);
            
            const response = await request(app)
                .get('/api/fantasy/leaderboard')
                .expect(200);
            
            expect(response.body.weekNumber).toBe(2);
            expect(response.body.leaderboard).toHaveLength(1);
        });
    });

    describe('GET /api/fantasy/playerHistory', () => {
        test('should return player history for a user', async () => {
            const mockLineups = [
                {
                    userId: 'user1',
                    weekNumber: 1,
                    lineup: { QB: '123', RB1: '456' }
                },
                {
                    userId: 'user1',
                    weekNumber: 2,
                    lineup: { QB: '789', RB1: '111' }
                }
            ];
            
            const mockQuery = {
                sort: jest.fn().mockResolvedValue(mockLineups)
            };
            
            PlayerLineup.find.mockReturnValue(mockQuery);
            
            const response = await request(app)
                .get('/api/fantasy/playerHistory')
                .set('authorization', `Bearer ${generateTestToken()}`)
                .expect(200);
            
            expect(response.body.totalWeeks).toBe(2);
            expect(response.body.usedPlayers).toContain('123');
            expect(response.body.usedPlayers).toContain('456');
            expect(response.body.usedPlayers).toContain('789');
            expect(response.body.usedPlayers).toContain('111');
        });
    });
});
