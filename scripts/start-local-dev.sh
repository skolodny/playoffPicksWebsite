#!/bin/bash
# Local Development Environment Startup Script
# This script starts MongoDB, initializes mock data, and starts both backend and frontend

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the absolute path to the repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# MongoDB container name (must match docker-compose.yml)
MONGODB_CONTAINER="playoff-picks-mongodb"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Playoff Picks Local Development Environment${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker to use local development environment.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: docker compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    
    # Prefer lsof if available
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    # Fallback to netstat if lsof is not available
    elif command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | awk '{print $4}' | grep -E "[:.]${port}\$" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        echo -e "${RED}Error: Neither 'lsof' nor 'netstat' is installed.${NC}"
        echo -e "${YELLOW}Please install one of these tools to check port usage.${NC}"
        return 1
    fi
}

# Function to wait for MongoDB to be ready
wait_for_mongodb() {
    echo -e "${YELLOW}Waiting for MongoDB to be ready...${NC}"
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec "$MONGODB_CONTAINER" mongosh --eval "db.runCommand('ping')" --quiet &> /dev/null; then
            echo -e "${GREEN}MongoDB is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo -e "${RED}MongoDB failed to start within expected time${NC}"
    return 1
}

# Step 1: Start MongoDB using Docker Compose
echo -e "${YELLOW}Step 1: Starting MongoDB container...${NC}"
cd "$REPO_ROOT"
if docker ps | grep -q "$MONGODB_CONTAINER"; then
    echo -e "${GREEN}MongoDB container is already running${NC}"
else
    docker compose up -d
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to start MongoDB container${NC}"
        exit 1
    fi
    echo -e "${GREEN}MongoDB container started${NC}"
fi

# Wait for MongoDB to be ready
if ! wait_for_mongodb; then
    echo -e "${RED}Failed to connect to MongoDB${NC}"
    exit 1
fi

# Step 2: Initialize mock data
echo -e "\n${YELLOW}Step 2: Initializing mock data...${NC}"
cd "$REPO_ROOT/server"

# Check if node_modules exists, if not run npm ci
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing server dependencies...${NC}"
    npm ci
fi

export MONGODB_URL="mongodb://localhost:27017/playoff_picks"
export SECRET_KEY="INSECURE-LOCAL-ONLY-DO-NOT-USE-IN-PRODUCTION"

node scripts/initMockData.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to initialize mock data${NC}"
    exit 1
fi

# Step 3: Create/update .env files
echo -e "\n${YELLOW}Step 3: Setting up environment files...${NC}"

# Server .env
SERVER_ENV="$REPO_ROOT/server/.env"
cat > "$SERVER_ENV" << EOF
MONGODB_URL=mongodb://localhost:27017/playoff_picks
SECRET_KEY=INSECURE-LOCAL-ONLY-DO-NOT-USE-IN-PRODUCTION
EOF
echo -e "${GREEN}Created server/.env${NC}"

# Client .env
CLIENT_ENV="$REPO_ROOT/client/.env"
cat > "$CLIENT_ENV" << EOF
VITE_API_BASE_URL=http://localhost:5000
EOF
echo -e "${GREEN}Created client/.env${NC}"

# Step 4: Start the backend server
echo -e "\n${YELLOW}Step 4: Starting backend server...${NC}"
cd "$REPO_ROOT/server"

# Check if backend is already running on port 5000
if check_port 5000; then
    echo -e "${YELLOW}Warning: Port 5000 is already in use. Skipping backend startup.${NC}"
    echo -e "${YELLOW}Stop the existing process or use a different port.${NC}"
else
    # Start backend in background (truncate log file first)
    : > "$REPO_ROOT/server.log"
    npm run dev > "$REPO_ROOT/server.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$REPO_ROOT/backend.pid"
    
    # Wait for backend to be ready with proper polling
    echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
    MAX_WAIT=30
    ELAPSED=0
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        if check_port 5000; then
            echo -e "${GREEN}Backend server started on http://localhost:5000 (PID: $BACKEND_PID)${NC}"
            break
        fi
        sleep 1
        ELAPSED=$((ELAPSED + 1))
    done
    
    if ! check_port 5000; then
        echo -e "${RED}Backend server failed to start within ${MAX_WAIT}s. Check server.log for details.${NC}"
        exit 1
    fi
fi

# Step 5: Start the frontend dev server
echo -e "\n${YELLOW}Step 5: Starting frontend development server...${NC}"
cd "$REPO_ROOT/client"

# Check if node_modules exists, if not run npm ci
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing client dependencies...${NC}"
    npm ci
fi

# Check if frontend is already running on port 5173
if check_port 5173; then
    echo -e "${YELLOW}Warning: Port 5173 is already in use. Skipping frontend startup.${NC}"
    echo -e "${YELLOW}Stop the existing process or use a different port.${NC}"
else
    # Start frontend in background (truncate log file first)
    : > "$REPO_ROOT/client.log"
    npm run dev > "$REPO_ROOT/client.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$REPO_ROOT/frontend.pid"
    
    # Wait for frontend to be ready with proper polling
    echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
    MAX_WAIT=60
    ELAPSED=0
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        if check_port 5173; then
            echo -e "${GREEN}Frontend server started on http://localhost:5173 (PID: $FRONTEND_PID)${NC}"
            break
        fi
        sleep 2
        ELAPSED=$((ELAPSED + 2))
    done
    
    if ! check_port 5173; then
        echo -e "${RED}Frontend server failed to start within ${MAX_WAIT}s. Check client.log for details.${NC}"
        exit 1
    fi
fi

# Summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Local Development Environment is Ready!${NC}"
echo -e "${GREEN}================================================${NC}\n"

echo -e "${BLUE}Services running:${NC}"
echo -e "  • MongoDB:  mongodb://localhost:27017/playoff_picks"
echo -e "  • Backend:  http://localhost:5000"
echo -e "  • Frontend: http://localhost:5173\n"

echo -e "${BLUE}Test Accounts:${NC}"
echo -e "  • Admin:    admin / admin123"
echo -e "  • User 1:   user1 / password123"
echo -e "  • User 2:   user2 / password123"
echo -e "  • Test User: testuser / test123\n"

echo -e "${BLUE}Logs:${NC}"
echo -e "  • Backend:  $REPO_ROOT/server.log"
echo -e "  • Frontend: $REPO_ROOT/client.log\n"

echo -e "${BLUE}To stop all services, run:${NC}"
echo -e "  ./scripts/stop-local-dev.sh\n"

echo -e "${YELLOW}Press Ctrl+C to stop watching logs${NC}"
echo -e "${YELLOW}Services will continue running in the background${NC}\n"

# Tail logs (optional, can be interrupted with Ctrl+C)
tail -f "$REPO_ROOT/server.log" "$REPO_ROOT/client.log" 2>/dev/null || true
