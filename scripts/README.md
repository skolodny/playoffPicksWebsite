# Local Development Scripts

This directory contains scripts for setting up and managing the local development environment.

## Scripts

### start-local-dev.sh

Starts the complete local development environment including:
- MongoDB database (via Docker)
- Backend server (on port 5000)
- Frontend dev server (on port 5173)

**Usage:**
```bash
./scripts/start-local-dev.sh
```

**What it does:**
1. Starts MongoDB in a Docker container
2. Initializes the database with mock data (users, questions, NFL players)
3. Creates `.env` files for both client and server
4. Starts the backend server
5. Starts the frontend dev server

**Test Accounts Created:**
- Admin: `admin` / `admin123`
- User 1: `user1` / `password123`
- User 2: `user2` / `password123`
- Test User: `testuser` / `test123`

**Services:**
- MongoDB: `mongodb://localhost:27017/playoff_picks`
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### stop-local-dev.sh

Stops all local development services.

**Usage:**
```bash
./scripts/stop-local-dev.sh
```

**What it does:**
1. Stops the frontend dev server
2. Stops the backend server
3. Stops the MongoDB Docker container
4. Preserves log files for inspection

## Requirements

- Docker installed and running
- Node.js 20+ (22.x recommended)
- npm

## Logs

When services are running, logs are saved to:
- Backend: `server.log` (in repository root)
- Frontend: `client.log` (in repository root)

These files are excluded from Git via `.gitignore`.

## Troubleshooting

### Port Already in Use

If you see warnings about ports 5000 or 5173 being in use:
1. Stop any existing services using those ports
2. Run `./scripts/stop-local-dev.sh` to clean up
3. Try starting again

### MongoDB Connection Issues

If MongoDB fails to start or connect:
1. Make sure Docker is running
2. Check if port 27017 is available
3. Try stopping and restarting: `docker-compose down && docker-compose up -d`

### Frontend Not Connecting to Backend

Make sure:
1. The backend is running on port 5000
2. The file `client/.env` exists and contains `VITE_API_BASE_URL=http://localhost:5000`
3. Restart the frontend dev server if you created the `.env` file after starting it

## Reinitializing Data

To reset the database with fresh mock data:
```bash
cd server
export MONGODB_URL="mongodb://localhost:27017/playoff_picks"
export SECRET_KEY="local-dev-secret-key-change-in-production"
node scripts/initMockData.js
```
