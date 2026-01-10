/**
 * Tests for Health Check Endpoint
 * Verifies that the health check endpoint is not rate-limited
 */

const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

describe('Health Check Endpoint', () => {
    let app;

    beforeEach(() => {
        // Create a fresh app instance for each test
        app = express();
        
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            limit: 5, // Low limit to make testing easier
        });

        // Health check endpoint (before rate limiter to prevent rate limiting)
        app.get('/health', (req, res) => {
            res.status(200).send('OK');
        });

        // Apply rate limiter to all requests
        app.use(limiter);

        // Add a test endpoint that should be rate limited
        app.get('/api/test', (req, res) => {
            res.status(200).json({ message: 'test' });
        });
    });

    describe('GET /health', () => {
        test('should return 200 OK', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.text).toBe('OK');
        });

        test('should not be rate limited after multiple requests', async () => {
            // Make more requests than the rate limit allows
            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(request(app).get('/health'));
            }

            const responses = await Promise.all(requests);

            // All health check requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.text).toBe('OK');
            });
        });
    });

    describe('GET /api/test (rate limited endpoint)', () => {
        test('should be rate limited after exceeding limit', async () => {
            // Make more requests than the rate limit allows
            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(
                    request(app)
                        .get('/api/test')
                );
            }

            const responses = await Promise.all(requests);

            // Some requests should be rate limited (429 status)
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
});
