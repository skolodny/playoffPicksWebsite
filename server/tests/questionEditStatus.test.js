/**
 * Tests for per-question edit status functionality
 * These tests verify the new per-question editing controls
 */

const request = require('supertest');
const express = require('express');
const adminRoutes = require('../routes/adminRoutes');
const informationRoutes = require('../routes/informationRoutes');

// Mock the authentication middleware
jest.mock('../adminAuth', () => (req, res, next) => next());

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 'test-user-id' }))
}));

// Mock the models
jest.mock('../models/Information');

const Information = require('../models/Information');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/information', informationRoutes);

describe('Per-Question Edit Status', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/admin/setQuestionEditStatus', () => {
        test('should update question edit status successfully', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', type: 'text', options: [] },
                    { question: 'Q2', type: 'text', options: [] },
                    { question: 'Q3', type: 'text', options: [] }
                ],
                questionEditsAllowed: [true, true, true],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/admin/setQuestionEditStatus')
                .send({ questionIndex: 1, editsAllowed: false })
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
            expect(mockInfo.questionEditsAllowed[1]).toBe(false);
            expect(mockInfo.save).toHaveBeenCalled();
        });

        test('should initialize questionEditsAllowed if not present', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', type: 'text', options: [] },
                    { question: 'Q2', type: 'text', options: [] }
                ],
                questionEditsAllowed: null,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/admin/setQuestionEditStatus')
                .send({ questionIndex: 0, editsAllowed: false })
                .expect(200);
            
            expect(mockInfo.questionEditsAllowed).toBeDefined();
            expect(mockInfo.questionEditsAllowed.length).toBe(2);
            expect(mockInfo.questionEditsAllowed[0]).toBe(false);
        });

        test('should reject invalid question index', async () => {
            const mockInfo = {
                options: [{ question: 'Q1', type: 'text', options: [] }],
                questionEditsAllowed: [true],
                save: jest.fn()
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/admin/setQuestionEditStatus')
                .send({ questionIndex: 5, editsAllowed: false })
                .expect(400);
            
            expect(response.body.message).toContain('Invalid question index');
        });

        test('should reject missing parameters', async () => {
            const response = await request(app)
                .post('/api/admin/setQuestionEditStatus')
                .send({ questionIndex: 0 })
                .expect(400);
            
            expect(response.body.message).toContain('Invalid parameters');
        });
    });

    describe('GET /api/information/getInfo', () => {
        test('should return questionEditsAllowed with information', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', type: 'text', options: [] },
                    { question: 'Q2', type: 'text', options: [] }
                ],
                questionEditsAllowed: [true, false],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .get('/api/information/getInfo')
                .expect(200);
            
            expect(response.body.information).toBeDefined();
            expect(response.body.information.questionEditsAllowed).toEqual([true, false]);
        });

        test('should initialize questionEditsAllowed if not present', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', type: 'text', options: [] },
                    { question: 'Q2', type: 'text', options: [] }
                ],
                questionEditsAllowed: null,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .get('/api/information/getInfo')
                .expect(200);
            
            expect(mockInfo.questionEditsAllowed).toBeDefined();
            expect(mockInfo.questionEditsAllowed.length).toBe(2);
            expect(mockInfo.questionEditsAllowed.every(v => v === true)).toBe(true);
        });
    });

    describe('POST /api/information/submitResponse', () => {
        test('should respect per-question edit status', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', type: 'text', options: [] },
                    { question: 'Q2', type: 'text', options: [] },
                    { question: 'Q3', type: 'text', options: [] }
                ],
                questionEditsAllowed: [true, false, true], // Q2 is locked
                responses: [
                    {
                        users_id: { toString: () => 'test-user-id' },
                        response: ['old1', 'old2', 'old3']
                    }
                ],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/information/submitResponse')
                .set('authorization', 'Bearer test-token')
                .send({ choices: ['new1', 'new2', 'new3'] })
                .expect(200);
            
            // Q1 and Q3 should be updated, Q2 should remain unchanged
            expect(mockInfo.responses[0].response[0]).toBe('new1');
            expect(mockInfo.responses[0].response[1]).toBe('old2'); // Locked
            expect(mockInfo.responses[0].response[2]).toBe('new3');
        });

        test('should allow all edits when all questions are editable', async () => {
            const mockInfo = {
                options: [
                    { question: 'Q1', type: 'text', options: [] },
                    { question: 'Q2', type: 'text', options: [] }
                ],
                questionEditsAllowed: [true, true],
                responses: [
                    {
                        users_id: { toString: () => 'test-user-id' },
                        response: ['old1', 'old2']
                    }
                ],
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(mockInfo);
            
            const response = await request(app)
                .post('/api/information/submitResponse')
                .set('authorization', 'Bearer test-token')
                .send({ choices: ['new1', 'new2'] })
                .expect(200);
            
            expect(mockInfo.responses[0].response[0]).toBe('new1');
            expect(mockInfo.responses[0].response[1]).toBe('new2');
        });
    });

    describe('POST /api/admin/createNewWeek', () => {
        test('should initialize questionEditsAllowed for new week', async () => {
            const oldWeekInfo = {
                weekNumber: 1,
                currentWeek: true,
                save: jest.fn().mockResolvedValue(true)
            };
            
            Information.findOne.mockResolvedValue(oldWeekInfo);
            Information.mockImplementation(function(data) {
                this.options = data.options;
                this.weekNumber = data.weekNumber;
                this.questionEditsAllowed = data.questionEditsAllowed;
                this.currentWeek = data.currentWeek;
                this.save = jest.fn().mockResolvedValue(true);
                return this;
            });
            
            const response = await request(app)
                .post('/api/admin/createNewWeek')
                .send({
                    options: [
                        { question: 'Q1', type: 'text', options: [] },
                        { question: 'Q2', type: 'text', options: [] },
                        { question: 'Q3', type: 'text', options: [] }
                    ]
                })
                .expect(200);
            
            expect(response.body.message).toContain('successfully');
        });
    });
});
