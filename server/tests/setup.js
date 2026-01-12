/**
 * Jest test setup file
 * Sets up environment variables needed for testing
 */

// Set SECRET_KEY for JWT token generation and verification in tests
process.env.SECRET_KEY = 'yourSecretKey';
