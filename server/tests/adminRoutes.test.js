/**
 * Tests for Admin Routes
 * These tests verify that admin endpoints return correct data structures
 */

const request = require('supertest');
const express = require('express');
const adminRoutes = require('../routes/adminRoutes');

// Mock the authentication middleware
jest.mock('../adminAuth', () => (req, res, next) => next());

// Mock the models
jest.mock('../models/Information');
jest.mock('../models/User');

// Mock the NFL API service
jest.mock('../services/nflApiService');

const nflApiService = require('../services/nflApiService');
const Information = require('../models/Information');
const User = require('../models/User');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/nfl/teams', () => {
        test('should return list of teams', async () => {
            const mockTeams = [
                { id: '1', name: 'Team A', abbreviation: 'TMA' },
                { id: '2', name: 'Team B', abbreviation: 'TMB' }
            ];
            
            nflApiService.getTeams.mockResolvedValue(mockTeams);
            
            const response = await request(app)
                .get('/api/admin/nfl/teams')
                .expect(200);
            
            expect(response.body).toHaveProperty('teams');
            expect(response.body.teams).toEqual(mockTeams);
        });

        test('should handle errors', async () => {
            nflApiService.getTeams.mockRejectedValue(new Error('API Error'));
            
            const response = await request(app)
                .get('/api/admin/nfl/teams')
                .expect(500);
            
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /api/admin/nfl/games', () => {
        test('should return games for a week', async () => {
            const mockGames = [
                {
                    id: '123',
                    name: 'Team A vs Team B',
                    completed: true,
                    homeTeam: { name: 'Team A', score: 27 },
                    awayTeam: { name: 'Team B', score: 24 }
                }
            ];
            
            nflApiService.getGamesByWeek.mockResolvedValue(mockGames);
            
            const response = await request(app)
                .get('/api/admin/nfl/games?week=1')
                .expect(200);
            
            expect(response.body).toHaveProperty('games');
            expect(response.body.games).toEqual(mockGames);
        });

        test('should require week parameter', async () => {
            const response = await request(app)
                .get('/api/admin/nfl/games')
                .expect(400);
            
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Week parameter is required');
        });

        test('should handle errors', async () => {
            nflApiService.getGamesByWeek.mockRejectedValue(new Error('API Error'));
            
            const response = await request(app)
                .get('/api/admin/nfl/games?week=1')
                .expect(500);
            
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /api/admin/nfl/game/:gameId', () => {
        test('should return game details', async () => {
            const mockGame = {
                completed: true,
                winnerId: '1',
                winnerName: 'Team A',
                homeTeam: { name: 'Team A', score: 27 },
                awayTeam: { name: 'Team B', score: 24 }
            };
            
            nflApiService.getGameWinner.mockResolvedValue(mockGame);
            
            const response = await request(app)
                .get('/api/admin/nfl/game/123456')
                .expect(200);
            
            expect(response.body).toHaveProperty('game');
            expect(response.body.game).toEqual(mockGame);
        });

        test('should handle errors', async () => {
            nflApiService.getGameWinner.mockRejectedValue(new Error('Game not found'));
            
            const response = await request(app)
                .get('/api/admin/nfl/game/invalid')
                .expect(500);
            
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /api/admin/nfl/game/:gameId/stats', () => {
        test('should return game statistics', async () => {
            const mockStats = {
                completed: true,
                players: [
                    {
                        playerId: '123',
                        playerName: 'Player A',
                        stats: { TD: '2', YDS: '250' }
                    }
                ]
            };
            
            nflApiService.getGameStats.mockResolvedValue(mockStats);
            
            const response = await request(app)
                .get('/api/admin/nfl/game/123456/stats')
                .expect(200);
            
            expect(response.body).toHaveProperty('stats');
            expect(response.body.stats).toEqual(mockStats);
            expect(response.body.stats.players).toBeDefined();
        });

        test('should handle errors', async () => {
            nflApiService.getGameStats.mockRejectedValue(new Error('Stats not available'));
            
            const response = await request(app)
                .get('/api/admin/nfl/game/invalid/stats')
                .expect(500);
            
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /api/admin/nfl/game/:gameId/player/:playerId/stat/:statName', () => {
        test('should return player stat', async () => {
            const mockPlayerStat = {
                completed: true,
                found: true,
                playerId: '123',
                playerName: 'Player A',
                statName: 'TD',
                statValue: 2
            };
            
            nflApiService.getPlayerStat.mockResolvedValue(mockPlayerStat);
            
            const response = await request(app)
                .get('/api/admin/nfl/game/123456/player/123/stat/TD')
                .expect(200);
            
            expect(response.body).toHaveProperty('playerStat');
            expect(response.body.playerStat).toEqual(mockPlayerStat);
            expect(response.body.playerStat.statValue).toBe(2);
        });

        test('should handle player not found', async () => {
            const mockPlayerStat = {
                completed: true,
                found: false,
                message: 'Player not found',
                statValue: 0
            };
            
            nflApiService.getPlayerStat.mockResolvedValue(mockPlayerStat);
            
            const response = await request(app)
                .get('/api/admin/nfl/game/123456/player/999/stat/TD')
                .expect(200);
            
            expect(response.body.playerStat.found).toBe(false);
            expect(response.body.playerStat.statValue).toBe(0);
        });

        test('should handle errors', async () => {
            nflApiService.getPlayerStat.mockRejectedValue(new Error('Failed to fetch'));
            
            const response = await request(app)
                .get('/api/admin/nfl/game/invalid/player/123/stat/TD')
                .expect(500);
            
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('POST /api/admin/autoScore', () => {
        test('should return error if no current week', async () => {
            Information.findOne.mockResolvedValue(null);
            
            const response = await request(app)
                .post('/api/admin/autoScore')
                .expect(404);
            
            expect(response.body.message).toContain('No current week found');
        });

        test('should auto-score questions with apiConfig', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', options: ['A', 'B'], apiConfig: { type: 'game_winner', gameId: '123' } },
                    { question: 'Q2', options: ['C', 'D'] }
                ],
                correctAnswers: [],
                responses: [],
                weekNumber: 1,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            nflApiService.autoScoreQuestions.mockResolvedValue(['A', null]);
            
            const response = await request(app)
                .post('/api/admin/autoScore')
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
            expect(response.body.gamesScored).toBe(1);
        });
    });

    describe('POST /api/admin/calculateScores', () => {
        test('should calculate scores successfully', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', options: ['A', 'B'] }
                ],
                correctAnswers: ['A', 'B'],
                responses: [
                    {
                        users_id: 'user1',
                        response: ['A', 'B']
                    }
                ],
                weekNumber: 1,
                save: jest.fn().mockResolvedValue(true)
            };
            
            const mockUser = {
                scores: [],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            User.findById.mockResolvedValue(mockUser);
            nflApiService.autoScoreQuestions.mockResolvedValue([null]); // Mock auto-score
            
            const response = await request(app)
                .post('/api/admin/calculateScores')
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
        });
    });
});
