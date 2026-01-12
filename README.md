# Playoff Picks Website

An NFL playoff picks website with automatic scoring, fantasy football with PPR scoring, and leaderboards.

## Repository Structure

- **client/** - React + TypeScript + Vite frontend (deployed to GitHub Pages)
- **server/** - Node.js + Express + MongoDB backend (deployed to Render.com)
- **scripts/** - Local development environment scripts
- **.github/** - CI/CD workflows and copilot instructions

## Quick Start - Local Development

To run the complete application locally with all services (frontend, backend, MongoDB):

```bash
# Start everything (MongoDB, backend, frontend)
./scripts/start-local-dev.sh

# Stop everything
./scripts/stop-local-dev.sh
```

**Requirements:** Docker, Node.js 20+

**Test Accounts:**
- Admin: `admin` / `admin123`
- Users: `user1`, `user2`, `testuser` / `password123` (or `test123` for testuser)

**Services:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017/playoff_picks

See [scripts/README.md](scripts/README.md) for detailed documentation.

## Development

### Client (Frontend)

```bash
cd client

# Install dependencies
npm ci

# Run dev server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build
```

### Server (Backend)

```bash
cd server

# Install dependencies
npm ci

# Run tests
npm test

# Start server (requires .env file)
npm run dev
```

## CI/CD

Three GitHub Actions workflows run on every PR:
1. **Client Build & Lint** - Validates frontend code
2. **Server Test** - Runs all backend tests (72 tests)
3. **Client Deploy** - Deploys to GitHub Pages (on merge to master)

## Documentation

- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Comprehensive guide for Copilot/developers
- [scripts/README.md](scripts/README.md) - Local development environment guide
- [server/README.md](server/README.md) - API documentation and features
- [server/TESTING.md](server/TESTING.md) - Test suite documentation
- [server/AUTOSCORING_GUIDE.md](server/AUTOSCORING_GUIDE.md) - Auto-scoring system guide
- [server/FANTASY_GUIDE.md](server/FANTASY_GUIDE.md) - Fantasy football guide

## Features

- **User Authentication** - JWT-based authentication with admin roles
- **Weekly NFL Questions** - Multiple choice questions with auto-scoring
- **Auto-Scoring** - Automatic scoring using ESPN API
- **Fantasy Football** - PPR scoring with position requirements (QB, RB, WR, TE, FLEX, K, DEF)
- **Leaderboards** - Real-time scoring and rankings
- **Admin Panel** - Question management, scoring control, user management

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router
- Ant Design + Bootstrap

**Backend:**
- Node.js
- Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs
- ESPN API Integration

**Development:**
- Docker (MongoDB)
- Jest (Testing)
- ESLint (Linting)
- GitHub Actions (CI/CD)
