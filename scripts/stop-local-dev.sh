#!/bin/bash
# Script to stop all local development services

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
echo -e "${BLUE}Stopping Local Development Environment${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Stop frontend
if [ -f "$REPO_ROOT/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$REPO_ROOT/frontend.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping frontend server (PID: $FRONTEND_PID)...${NC}"
        kill "$FRONTEND_PID"
        rm "$REPO_ROOT/frontend.pid"
        echo -e "${GREEN}Frontend server stopped${NC}"
    else
        echo -e "${YELLOW}Frontend server is not running${NC}"
        rm "$REPO_ROOT/frontend.pid"
    fi
else
    echo -e "${YELLOW}Frontend PID file not found${NC}"
fi

# Stop backend
if [ -f "$REPO_ROOT/backend.pid" ]; then
    BACKEND_PID=$(cat "$REPO_ROOT/backend.pid")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping backend server (PID: $BACKEND_PID)...${NC}"
        kill "$BACKEND_PID"
        rm "$REPO_ROOT/backend.pid"
        echo -e "${GREEN}Backend server stopped${NC}"
    else
        echo -e "${YELLOW}Backend server is not running${NC}"
        rm "$REPO_ROOT/backend.pid"
    fi
else
    echo -e "${YELLOW}Backend PID file not found${NC}"
fi

# Stop MongoDB container
echo -e "${YELLOW}Stopping MongoDB container...${NC}"
cd "$REPO_ROOT"
if docker ps | grep -q "$MONGODB_CONTAINER"; then
    docker compose down
    echo -e "${GREEN}MongoDB container stopped${NC}"
else
    echo -e "${YELLOW}MongoDB container is not running${NC}"
fi

# Clean up log files (optional)
if [ -f "$REPO_ROOT/server.log" ] || [ -f "$REPO_ROOT/client.log" ]; then
    echo -e "\n${YELLOW}Log files preserved at:${NC}"
    [ -f "$REPO_ROOT/server.log" ] && echo -e "  • $REPO_ROOT/server.log"
    [ -f "$REPO_ROOT/client.log" ] && echo -e "  • $REPO_ROOT/client.log"
fi

echo -e "\n${GREEN}✅ All services stopped${NC}\n"
