# Local Development Environment - MCP Integration

This document explains how the local development environment integrates with Model Context Protocol (MCP) for Copilot.

## Overview

The local development environment provides Copilot with the ability to:
1. Start a complete local stack (MongoDB + Backend + Frontend)
2. Initialize mock data for testing
3. Test code changes end-to-end
4. Debug issues in a production-like environment

## Architecture

```
┌─────────────────────────────────────────────┐
│  Copilot Agent                              │
│  - Can execute bash commands                │
│  - Can run scripts                          │
│  - Can access MongoDB via MCP               │
└───────────────────┬─────────────────────────┘
                    │
                    ├─ Run: ./scripts/start-local-dev.sh
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌─────────────┐         ┌─────────────┐
│   Docker    │         │  Bash       │
│   MongoDB   │◄────────│  Scripts    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │                       ├─ Install dependencies
       │                       ├─ Initialize mock data
       │                       ├─ Start backend
       │                       └─ Start frontend
       │
       ▼
┌──────────────────────────────┐
│  Local Services              │
│  - MongoDB:       :27017     │
│  - Backend API:   :5000      │
│  - Frontend:      :5173      │
└──────────────────────────────┘
```

## How It Works

### 1. Starting the Environment

When Copilot runs `./scripts/start-local-dev.sh`:

1. **Docker Check** - Verifies Docker is installed
2. **MongoDB Startup** - Launches MongoDB container via `docker compose`
3. **Health Check** - Waits for MongoDB to be ready
4. **Mock Data** - Runs `server/scripts/initMockData.js` to populate database
5. **Environment Files** - Creates `.env` files for backend and frontend
6. **Backend Start** - Launches Express server on port 5000
7. **Frontend Start** - Launches Vite dev server on port 5173

### 2. Mock Data Initialization

The `server/scripts/initMockData.js` script:
- Clears existing data
- Creates 4 test users (1 admin, 3 regular users)
- Creates 2 question sets (1 completed, 1 current)
- Creates 11 NFL players for fantasy football
- Creates 1 sample fantasy lineup
- Uses bcrypt to properly hash passwords (via User model pre-save hook)

### 3. Environment Configuration

**Backend (.env):**
```env
MONGODB_URL=mongodb://localhost:27017/playoff_picks
SECRET_KEY=INSECURE-LOCAL-ONLY-DO-NOT-USE-IN-PRODUCTION
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000
```

This ensures the frontend connects to the local backend instead of production.

## MCP Tools Available

While running locally, Copilot can use:

### MongoDB MCP Server
- `mongodb-list-databases` - List databases
- `mongodb-list-collections` - List collections
- `mongodb-find` - Query data
- `mongodb-aggregate` - Run aggregations
- `mongodb-count` - Count documents
- `mongodb-collection-schema` - Inspect schema
- And more...

### Bash Tool
- Run commands to check logs
- Query running services
- Restart individual services
- Test API endpoints with curl

## Testing Workflow

### Example: Testing a New Feature

```bash
# 1. Start environment
./scripts/start-local-dev.sh

# 2. Make code changes (Copilot modifies files)

# 3. Test manually
curl http://localhost:5000/api/user/getTotalUserScores

# 4. Or use MongoDB MCP to verify data
# Copilot can query: mongodb-find with database="playoff_picks", collection="users"

# 5. Check frontend in browser
# Open: http://localhost:5173

# 6. Clean up
./scripts/stop-local-dev.sh
```

### Example: Debugging an Issue

```bash
# Start environment
./scripts/start-local-dev.sh

# Check backend logs
tail -f server.log

# Check frontend logs
tail -f client.log

# Query database state
# Use MongoDB MCP: mongodb-find to inspect data

# Test API endpoint
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## File Locations

- **Scripts:** `/scripts/`
  - `start-local-dev.sh` - Startup orchestration
  - `stop-local-dev.sh` - Cleanup script
  - `README.md` - User documentation

- **Mock Data:** `/server/scripts/`
  - `initMockData.js` - Database seeding script

- **Docker:** `/docker-compose.yml`
  - MongoDB container configuration

- **Logs:** Root directory (git-ignored)
  - `server.log` - Backend logs
  - `client.log` - Frontend logs
  - `*.pid` - Process ID files

## Benefits for Copilot

1. **End-to-End Testing** - Test full stack integration
2. **Realistic Environment** - Similar to production
3. **Fast Iteration** - No deployment delays
4. **Safe Experimentation** - Isolated from production
5. **Database Access** - Can inspect and modify data via MCP
6. **Log Access** - Can debug issues with real logs

## Limitations

- **Not for CI/CD** - Only for local development
- **Requires Docker** - Docker must be installed
- **Port Requirements** - Ports 27017, 5000, 5173 must be available
- **Manual Cleanup** - Must run stop script to clean up

## Integration with Copilot Instructions

The `.github/copilot-instructions.md` file documents:
- When to use local development environment
- How to start and stop services
- Available test accounts
- Troubleshooting tips
- Where to find logs

This ensures Copilot knows:
- ✅ When to use local dev (testing features, debugging)
- ✅ How to start it (`./scripts/start-local-dev.sh`)
- ✅ What's available (MongoDB, API endpoints, frontend)
- ✅ How to clean up (`./scripts/stop-local-dev.sh`)
