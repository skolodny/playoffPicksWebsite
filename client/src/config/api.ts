/**
 * API Configuration
 * 
 * To use a local server for testing:
 * 1. Create a .env file in the root directory
 * 2. Add: VITE_API_BASE_URL=http://localhost:5000
 * 3. Restart the dev server
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://playoffpickswebsite.onrender.com';

export default API_BASE_URL;
