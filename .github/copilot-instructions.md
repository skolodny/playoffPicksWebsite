# Copilot Instructions for Playoff Picks Website

## Repository Overview

This is a **monorepo** for an NFL playoff picks website with automatic scoring. The repository consists of:
- **Client**: React + TypeScript + Vite frontend (deployed to GitHub Pages)
- **Server**: Node.js + Express + MongoDB backend (deployed to Render.com)

**Key Features**: User authentication, weekly NFL questions, auto-scoring using ESPN API, fantasy football with PPR scoring, leaderboards.

**Repository Structure**:
```
/client          - Frontend application
/server          - Backend API and services
/.github         - CI/CD workflows
```

## Build & Validation Commands

### **IMPORTANT: Always run commands in the correct directory (client/ or server/)**

### Client (React + TypeScript + Vite)

**Dependencies**: Node.js 22.x (v20+ compatible), npm

```bash
cd client

# Install dependencies (REQUIRED before any other command)
npm ci                    # Takes ~5-6 seconds, always use 'ci' not 'install' for clean builds

# Lint (required by CI)
npm run lint              # Takes ~1-2 seconds, must pass with no errors

# Build (required by CI)
npm run build             # Takes ~6-10 seconds, runs TypeScript compiler then Vite
                          # Warning about chunk size is expected and not an error

# Development server
npm run dev               # Starts Vite dev server on port 5173

# Preview production build
npm run preview           # Preview the built dist/ folder
```

**Build Order**: Always run `npm ci` → `npm run lint` → `npm run build`

**Configuration Files**:
- `eslint.config.js` - ESLint configuration
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configs
- `vite.config.ts` - Vite build configuration (base path: '/playoffPicksWebsite')
- `.env.example` - Template for local API configuration

### Server (Node.js + Express + MongoDB)

**Dependencies**: Node.js 22.x (v20+ compatible), npm, MongoDB connection (optional for tests)

```bash
cd server

# Install dependencies (REQUIRED before any other command)
npm ci                    # Takes ~2-3 seconds, always use 'ci' not 'install'

# Run tests (required by CI)
npm test                  # Takes ~2-3 seconds, runs Jest test suite
                          # All 72 tests must pass
                          # Console warnings/errors during tests are expected (intentional error testing)

# Start server (for local development)
npm start                 # Requires MONGODB_URL environment variable
                          # Health check endpoint works without MongoDB: curl http://localhost:5000/health

# Start server with .env file (recommended for local dev)
npm run dev               # Reads .env file automatically using --env-file flag
```

**Environment Setup**: Create `.env` file based on `.env.example`:
```
MONGODB_URL=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
```

**Configuration Files**:
- `package.json` - Contains Jest configuration
- `.env.example` - Template for environment variables

## CI/CD Workflows

### Three GitHub Actions workflows run on every PR to `master` branch:

#### 1. Client Build & Lint (`.github/workflows/client-build-lint.yml`)
- **Triggers**: Pull requests to master
- **Steps**:
  1. `npm ci` in client/ directory
  2. `npm run lint` - Must pass with no errors
  3. `npm run build` - Must complete successfully
- **Common Failures**: ESLint errors, TypeScript compilation errors

#### 2. Server Test (`.github/workflows/server-test.yml`)
- **Triggers**: Pull requests to master
- **Steps**:
  1. `npm ci` in server/ directory
  2. `npm test` - All 72 tests must pass
  3. Start server and verify health check endpoint responds
- **Common Failures**: Test failures, server startup issues (health check still works without MongoDB)

#### 3. Client Deploy (`.github/workflows/client-deploy.yml`)
- **Triggers**: Push to master branch (after PR merge)
- **Steps**:
  1. `npm ci` in client/ directory
  2. `npm run deploy` - Deploys to GitHub Pages using gh-pages
- **Note**: Only runs on merge to master, not on PRs

### Running CI Checks Locally

Before pushing, run these commands to replicate CI:

```bash
# Client checks
cd client && npm ci && npm run lint && npm run build

# Server checks  
cd server && npm ci && npm test
```

## Project Architecture

### Client Structure (`/client`)

```
client/
├── src/
│   ├── App.tsx              - Main application component
│   ├── main.tsx             - Application entry point
│   ├── components/          - Reusable React components
│   ├── pages/               - Page-level components (routes)
│   ├── routes/              - React Router configuration
│   ├── provider/            - Context providers
│   └── config/              - Configuration files
├── public/                  - Static assets
├── index.html               - HTML template
├── package.json             - Dependencies and scripts
├── eslint.config.js         - ESLint configuration
├── tsconfig.json            - TypeScript configuration (references)
├── tsconfig.app.json        - TypeScript app configuration
├── tsconfig.node.json       - TypeScript node configuration
├── vite.config.ts           - Vite configuration
└── .env.example             - Environment variable template
```

**Key Files**:
- `vite.config.ts`: Sets base path to '/playoffPicksWebsite' for GitHub Pages deployment
- API calls default to production server at `https://my-node-app-ua0d.onrender.com` unless `VITE_API_BASE_URL` is set

### Server Structure (`/server`)

```
server/
├── server.js                - Express app entry point, routes, middleware
├── models/                  - MongoDB Mongoose models
│   ├── User.js              - User model (username, password, scores, admin)
│   ├── Information.js       - Week/questions model (options, correctAnswers, responses)
│   ├── NFLPlayer.js         - NFL player data model
│   └── PlayerLineup.js      - Fantasy lineup model
├── routes/                  - API route handlers
│   ├── userRoutes.js        - User authentication endpoints
│   ├── informationRoutes.js - Question/response endpoints
│   ├── adminRoutes.js       - Admin endpoints (auto-scoring, NFL API)
│   └── fantasyRoutes.js     - Fantasy football endpoints
├── services/                - Business logic services
│   ├── nflApiService.js     - ESPN API integration and auto-scoring logic
│   └── fantasyService.js    - Fantasy football PPR scoring logic
├── tests/                   - Jest test suites
│   ├── nflApiService.test.js      - API service tests
│   ├── adminRoutes.test.js        - Admin routes tests
│   ├── fantasyRoutes.test.js      - Fantasy routes tests
│   ├── questionEditStatus.test.js - Edit status tests
│   └── healthCheck.test.js        - Health check tests
├── auth.js                  - User JWT authentication middleware
├── adminAuth.js             - Admin JWT authentication middleware
├── package.json             - Dependencies and scripts
├── .env.example             - Environment variable template
├── README.md                - Comprehensive API documentation
├── TESTING.md               - Test suite documentation
├── AUTOSCORING_GUIDE.md     - Auto-scoring system guide
├── FANTASY_GUIDE.md         - Fantasy football guide
└── API_DOCUMENTATION.md     - API endpoint reference
```

**Key Files**:
- `server.js`: Main entry point, sets up Express, MongoDB, CORS, rate limiting, and routes
- `services/nflApiService.js`: All ESPN API integration logic and auto-scoring algorithms
- Authentication: User routes use `x-auth-token` header, admin routes use `authorization: Bearer <token>` header

## Known Issues & Workarounds

### 1. MongoDB Connection and Environment Variables

**Issue**: Server requires `MONGODB_URL` environment variable to start.

**Workaround**: 
- For local dev: Create `.env` file with both `MONGODB_URL` and `SECRET_KEY`, then use `npm run dev`
- Health check endpoint (`/health`) works without MongoDB
- Tests run successfully without MongoDB (use mocked database)
- Production deployments must use environment variables from hosting platform

### 2. Environment Variable Configuration

**Issue**: Both `MONGODB_URL` (server.js) and `SECRET_KEY` (fantasyRoutes.js) need to be properly configured.

**Current State**: 
- Use `.env` file for local development; production uses environment variables from hosting platform

### 3. Client Build Chunk Size Warning

**Issue**: Vite build shows warning about chunks larger than 500 kB

**Status**: This is expected and not an error; the application builds successfully

### 4. Test Console Output

**Issue**: Tests show console.error and console.warn messages during execution

**Status**: These are intentional - tests verify error handling and logging behavior. All 72 tests pass successfully.

### 5. npm Deprecation Warnings

**Issue**: Server shows deprecation warnings for `inflight` and `glob` during `npm ci`

**Status**: These are from transitive dependencies and do not affect functionality. Can be safely ignored.

## Key Development Tips

1. **Always use `npm ci`** instead of `npm install` for reproducible builds matching CI environment
2. **Run from correct directory**: Commands must be run from `/client` or `/server`, not from repository root
3. **Test before committing**: Run lint and build (client) or tests (server) before pushing
4. **MongoDB not required for tests**: Server tests use mocked database and pass without MongoDB connection
5. **Build order matters**: For client, always install deps → lint → build (in that order)
6. **Jest configuration**: In `package.json`, tests match `**/tests/**/*.test.js` pattern

## Documentation Resources

The server has extensive documentation:
- `README.md`: Complete feature overview, API endpoints, authentication, usage examples
- `TESTING.md`: Test suite structure, how to run tests, coverage information
- `AUTOSCORING_GUIDE.md`: Auto-scoring system with ESPN API configuration
- `FANTASY_GUIDE.md`: Fantasy football feature documentation
- `API_DOCUMENTATION.md`: API endpoint reference

**Tip**: Consult these files for detailed API behavior before making changes to server routes or services.

## Trust These Instructions

These instructions have been validated by running all commands and workflows. If you need information not covered here:
1. First, check the documentation files listed above
2. Then search the codebase for specific implementation details
3. Only explore beyond these instructions if the information is incomplete or found to be incorrect
