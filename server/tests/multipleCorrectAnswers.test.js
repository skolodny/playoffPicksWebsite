/**
 * Tests for Multiple Correct Answers Feature
 * These tests verify that admins can set multiple correct answers per question
 * and that scoring works correctly with both single and multiple correct answers
 */

const request = require('supertest');
const express = require('express');
const adminRoutes = require('../routes/adminRoutes');
const informationRoutes = require('../routes/informationRoutes');

// Mock the authentication middleware
jest.mock('../adminAuth', () => (req, res, next) => next());
jest.mock('../auth', () => (req, res, next) => next());

// Mock the models
jest.mock('../models/Information');
jest.mock('../models/User');

// Mock the NFL API service
jest.mock('../services/nflApiService');

const nflApiService = require('../services/nflApiService');
const Information = require('../models/Information');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/information', informationRoutes);

describe('Multiple Correct Answers Feature', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock JWT verification
        jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'user123', admin: false });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('POST /api/admin/setCorrectAnswers', () => {
        test('should accept single correct answer per question (backward compatibility)', async () => {
            const mockInfo = {
                correctAnswers: [],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/admin/setCorrectAnswers')
                .send({ correctAnswers: ['Answer1', 'Answer2'] })
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
            expect(mockInfo.correctAnswers).toEqual(['Answer1', 'Answer2']);
        });

        test('should accept multiple correct answers per question', async () => {
            const mockInfo = {
                correctAnswers: [],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/admin/setCorrectAnswers')
                .send({ correctAnswers: [['Answer1', 'Answer2'], 'SingleAnswer', ['Option1', 'Option2', 'Option3']] })
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
            expect(mockInfo.correctAnswers).toEqual([['Answer1', 'Answer2'], 'SingleAnswer', ['Option1', 'Option2', 'Option3']]);
        });
    });

    describe('POST /api/admin/calculateScores - Multiple Correct Answers', () => {
        test('should score correctly with single correct answer per question', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', options: ['A', 'B', 'C'] },
                    { question: 'Q2', options: ['X', 'Y', 'Z'] }
                ],
                correctAnswers: ['B', 'Y'], // Single correct answers
                responses: [
                    { users_id: 'user1', response: ['B', 'Y'] }, // Both correct
                    { users_id: 'user2', response: ['A', 'Y'] }, // One correct
                    { users_id: 'user3', response: ['C', 'Z'] }  // None correct
                ],
                weekNumber: 1,
                save: jest.fn().mockResolvedValue(true)
            };
            
            const mockUser1 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            const mockUser2 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            const mockUser3 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            
            Information.findOne.mockResolvedValue(mockInfo);
            User.findById
                .mockResolvedValueOnce(mockUser1)
                .mockResolvedValueOnce(mockUser2)
                .mockResolvedValueOnce(mockUser3);
            
            nflApiService.autoScoreQuestions.mockResolvedValue([null, null]);
            
            const response = await request(app)
                .post('/api/admin/calculateScores')
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
            expect(mockUser1.scores[0]).toBe(60); // 2 * 30
            expect(mockUser2.scores[0]).toBe(30); // 1 * 30
            expect(mockUser3.scores[0]).toBe(0);  // 0 * 30
        });

        test('should score correctly with multiple correct answers per question', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', options: ['A', 'B', 'C'] },
                    { question: 'Q2', options: ['X', 'Y', 'Z'] }
                ],
                correctAnswers: [['A', 'B'], ['Y', 'Z']], // Multiple correct answers
                responses: [
                    { users_id: 'user1', response: ['A', 'Y'] }, // Both correct
                    { users_id: 'user2', response: ['B', 'Z'] }, // Both correct (different answers)
                    { users_id: 'user3', response: ['C', 'X'] }, // None correct
                    { users_id: 'user4', response: ['A', 'X'] }  // One correct
                ],
                weekNumber: 1,
                save: jest.fn().mockResolvedValue(true)
            };
            
            const mockUser1 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            const mockUser2 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            const mockUser3 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            const mockUser4 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            
            Information.findOne.mockResolvedValue(mockInfo);
            User.findById
                .mockResolvedValueOnce(mockUser1)
                .mockResolvedValueOnce(mockUser2)
                .mockResolvedValueOnce(mockUser3)
                .mockResolvedValueOnce(mockUser4);
            
            nflApiService.autoScoreQuestions.mockResolvedValue([null, null]);
            
            const response = await request(app)
                .post('/api/admin/calculateScores')
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
            expect(mockUser1.scores[0]).toBe(60); // 2 * 30
            expect(mockUser2.scores[0]).toBe(60); // 2 * 30
            expect(mockUser3.scores[0]).toBe(0);  // 0 * 30
            expect(mockUser4.scores[0]).toBe(30); // 1 * 30
        });

        test('should score correctly with mixed single and multiple correct answers', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', options: ['A', 'B', 'C'] },
                    { question: 'Q2', options: ['X', 'Y', 'Z'] },
                    { question: 'Q3', options: ['1', '2', '3'] }
                ],
                correctAnswers: ['B', ['Y', 'Z'], ['1', '2']], // Mixed format
                responses: [
                    { users_id: 'user1', response: ['B', 'Y', '1'] }, // All correct
                    { users_id: 'user2', response: ['B', 'Z', '2'] }, // All correct (different)
                    { users_id: 'user3', response: ['B', 'Y', '3'] }, // Two correct (Q1 and Q2)
                    { users_id: 'user4', response: ['C', 'X', '3'] }  // None correct
                ],
                weekNumber: 1,
                save: jest.fn().mockResolvedValue(true)
            };
            
            const mockUser1 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            const mockUser2 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            const mockUser3 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            const mockUser4 = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            
            Information.findOne.mockResolvedValue(mockInfo);
            User.findById
                .mockResolvedValueOnce(mockUser1)
                .mockResolvedValueOnce(mockUser2)
                .mockResolvedValueOnce(mockUser3)
                .mockResolvedValueOnce(mockUser4);
            
            nflApiService.autoScoreQuestions.mockResolvedValue([null, null, null]);
            
            const response = await request(app)
                .post('/api/admin/calculateScores')
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
            expect(mockUser1.scores[0]).toBe(90); // 3 * 30
            expect(mockUser2.scores[0]).toBe(90); // 3 * 30
            expect(mockUser3.scores[0]).toBe(60); // 2 * 30
            expect(mockUser4.scores[0]).toBe(0);  // 0 * 30
        });
    });

    describe('POST /api/information/submitResponse - Prevent Multiple Answer Submission', () => {
        test('should reject submission with array values (multiple answers)', async () => {
            const mockInfo = {
                currentWeek: true,
                options: [
                    { question: 'Q1', options: ['A', 'B', 'C'] }
                ],
                questionEditsAllowed: [true],
                responses: [
                    { users_id: 'user123', response: ['A'] }
                ],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/information/submitResponse')
                .set('authorization', 'Bearer fake-token')
                .send({ choices: [['A', 'B']] }) // Trying to submit multiple answers
                .expect(400);
            
            expect(response.body.message).toContain('Cannot submit multiple answers');
            expect(mockInfo.save).not.toHaveBeenCalled();
        });

        test('should accept submission with single values per question', async () => {
            const mockInfo = {
                currentWeek: true,
                options: [
                    { question: 'Q1', options: ['A', 'B', 'C'] },
                    { question: 'Q2', options: ['X', 'Y', 'Z'] }
                ],
                questionEditsAllowed: [true, true],
                responses: [
                    { users_id: 'user123', response: ['A', 'X'] }
                ],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/information/submitResponse')
                .set('authorization', 'Bearer fake-token')
                .send({ choices: ['B', 'Y'] })
                .expect(200);
            
            expect(response.body.message).toContain('submitted');
            expect(mockInfo.save).toHaveBeenCalled();
            expect(mockInfo.responses[0].response).toEqual(['B', 'Y']);
        });
    });

    describe('POST /api/admin/autoScore - Multiple Correct Answers', () => {
        test('should handle multiple correct answers in auto-scoring', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', options: ['A', 'B'], apiConfig: { type: 'game_winner', gameId: '123' } },
                    { question: 'Q2', options: ['C', 'D'] }
                ],
                correctAnswers: [['A', 'B'], 'C'], // Pre-existing multiple correct answers
                responses: [
                    { users_id: 'user1', response: ['A', 'C'] }
                ],
                weekNumber: 1,
                save: jest.fn().mockResolvedValue(true)
            };
            
            const mockUser = { scores: [0], save: jest.fn().mockResolvedValue(true) };
            
            Information.findOne.mockResolvedValue(mockInfo);
            User.findById.mockResolvedValue(mockUser);
            nflApiService.autoScoreQuestions.mockResolvedValue(['A', null]);
            
            const response = await request(app)
                .post('/api/admin/autoScore')
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
            expect(mockUser.scores[0]).toBe(2); // 2 questions correct (1 point each in autoScore)
        });
    });
});
