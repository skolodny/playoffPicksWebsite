# NFL Playoff Picks - Backend

A Node.js backend for an NFL playoff picks website where users can answer weekly questions and scores are automatically calculated using real-time NFL game data.

## Features

- **User Authentication**: JWT-based authentication system
- **Weekly Questions**: Admins can create questions for each week
- **User Responses**: Users submit their picks for each week's questions
- **Auto-Scoring**: Automatic score calculation using ESPN's free NFL API
- **Player Stat Tracking**: Track individual player statistics for over/under questions
- **Fantasy Football**: PPR scoring system with weekly lineups
- **Manual Scoring**: Fallback to manual scoring when needed
- **Leaderboard**: Track total scores across all weeks

## Fantasy Football System

NEW! The system now includes a full fantasy football feature with PPR (Points Per Reception) scoring.

### Key Features

- **Weekly Lineups**: Submit lineups with QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, 1 DEF
- **No Repeat Players**: Players cannot be reused across multiple weeks
- **Automatic PPR Scoring**: Points calculated from ESPN API statistics
- **Position Queries**: Get available players by position excluding previously used
- **Player History Tracking**: Track which players have been selected each week

See [FANTASY_GUIDE.md](./FANTASY_GUIDE.md) for complete fantasy football documentation.

## Auto-Scoring System

### Overview

The auto-scoring system uses ESPN's free public API to fetch real-time NFL game data and automatically determine correct answers for questions linked to specific games.

### How It Works

1. **Question Configuration**: When creating questions, admins can add an `apiConfig` object to link the question to NFL API data
2. **API Integration**: The system fetches game results from ESPN's API
3. **Automatic Scoring**: Questions with `apiConfig` are automatically scored based on actual game outcomes
4. **Manual Override**: Questions without `apiConfig` can still be manually scored

### API Configuration Types

#### 1. Game Winner
Automatically determines which team won a specific game.

```javascript
{
  question: "Who will win the Chiefs vs Bills game?",
  type: "multiple-choice",
  options: ["Kansas City Chiefs", "Buffalo Bills"],
  apiConfig: {
    type: "game_winner",
    gameId: "401671725"  // ESPN game ID
  }
}
```

#### 2. Team Wins
Determines if a specific team won their game (Yes/No question).

```javascript
{
  question: "Will the Chiefs win their game?",
  type: "multiple-choice",
  options: ["Yes", "No"],
  apiConfig: {
    type: "team_wins",
    teamId: "12",        // ESPN team ID for Chiefs
    gameId: "401671725"  // ESPN game ID
  }
}
```

#### 3. Score Over/Under
Determines if the total score of a game is over or under a threshold.

```javascript
{
  question: "Will the total score be over 45 points?",
  type: "multiple-choice",
  options: ["Over", "Under"],
  apiConfig: {
    type: "score_over_under",
    gameId: "401671725",
    threshold: 45
  }
}
```

#### 4. Player Stat Over/Under
Determines if a player's stat (touchdowns, receptions, yards, etc.) is over or under a threshold.

```javascript
{
  question: "Will Patrick Mahomes throw over 2.5 touchdowns?",
  type: "multiple-choice",
  options: ["Over", "Under"],
  apiConfig: {
    type: "player_stat_over_under",
    gameId: "401671725",
    playerId: "3139477",    // ESPN player ID
    statName: "TD",          // Stat abbreviation (TD, REC, YDS, etc.)
    threshold: 2.5
  }
}
```

**Common Stat Names:**
- Passing: `TD` (touchdowns), `YDS` (yards), `INT` (interceptions), `QBR` (rating)
- Rushing: `CAR` (carries), `YDS` (yards), `TD` (touchdowns)
- Receiving: `REC` (receptions), `YDS` (yards), `TD` (touchdowns), `TAR` (targets)

### API Endpoints

#### Admin Routes (Protected)

##### Get NFL Teams
```
GET /api/admin/nfl/teams
```
Returns list of all NFL teams with IDs, names, and logos.

##### Get Games by Week
```
GET /api/admin/nfl/games?week=1&seasonYear=2024&seasonType=3
```
- `week` (required): Week number
- `seasonYear` (optional): Season year (defaults to current)
- `seasonType` (optional): 2=regular season, 3=postseason (defaults to current)

Returns list of games for the specified week with scores and status.

##### Get Game Details
```
GET /api/admin/nfl/game/:gameId
```
Returns detailed game information including winner and final score.

##### Get Game Statistics
```
GET /api/admin/nfl/game/:gameId/stats
```
Returns detailed game statistics including all player stats (passing, rushing, receiving, etc.).

##### Get Player Stat
```
GET /api/admin/nfl/game/:gameId/player/:playerId/stat/:statName
```
Returns a specific stat for a player in a game. Useful for verifying player IDs and stat names before creating questions.

**Example:**
```
GET /api/admin/nfl/game/401671725/player/3139477/stat/TD
```

##### Auto-Score Current Week
```
POST /api/admin/autoScore
```
Automatically scores all questions with `apiConfig` for the current week and calculates user scores. Only completed games are scored; in-progress or unstarted games are ignored.

##### Calculate Scores
```
POST /api/admin/calculateScores
```
Calculates scores for the current week. Automatically attempts to fetch results from the API for questions with `apiConfig` before calculating scores.

### Fantasy Football Endpoints (Admin Protected)

#### Get Available Players by Position
```
GET /api/fantasy/availablePlayers?userId={userId}&position={position}&weekNumber={week}
```
Returns players available for selection based on position, excluding players the user has already selected in previous weeks.

**Positions**: QB, RB, WR, TE, K, DEF, FLEX

#### Submit Fantasy Lineup
```
POST /api/fantasy/submitLineup
```
Submit or update a fantasy lineup for a specific week. Requires all positions: QB, RB1, RB2, WR1, WR2, TE, FLEX, K, DEF.

**Note:** The API accepts and stores **player names** (not player IDs) in lineup submissions.

#### Calculate Fantasy Scores
```
POST /api/admin/fantasy/calculateScores
```
Calculate PPR (Points Per Reception) fantasy scores for all submitted lineups for the current week. Automatically uses the current week from the database.

#### Get Fantasy Lineup
```
GET /api/fantasy/lineup?userId={userId}[&weekNumber={week}]
```
Retrieve a user's lineup for a specific week or current week (if weekNumber not provided).

#### Get Fantasy Leaderboard
```
GET /api/fantasy/leaderboard[?weekNumber={week}]
```
Get fantasy football rankings for a specific week or current week (if weekNumber not provided) sorted by total points.

#### Get Player Selection History
```
GET /api/fantasy/playerHistory?userId={userId}
```
Get all players a user has selected across all weeks to enforce no-repeat rule.

See [FANTASY_GUIDE.md](./FANTASY_GUIDE.md) for detailed fantasy football documentation.

### Existing Endpoints

#### User Routes
- `POST /api/users/login` - User login
- `GET /api/users/getTotalUserScores` - Get leaderboard

#### Information Routes (Protected)
- `GET /api/information/getInfo` - Get current week's questions
- `POST /api/information/findResponse` - Get user's current responses
- `POST /api/information/submitResponse` - Submit/update user responses
- `GET /api/information/getAllResponses` - Get all user responses (for admin view)

#### Admin Routes (Protected)
- `POST /api/admin/createNewWeek` - Create a new week
- `POST /api/admin/setEditStatus` - Enable/disable editing
- `POST /api/admin/setCorrectAnswers` - Manually set correct answers

## Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd my-node-app
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
# Create a .env file (recommended)
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
SECRET_KEY=<your-jwt-secret-key>
```

4. Start the server
```bash
node server.js
```

## Security

### Authentication

The backend uses JWT (JSON Web Tokens) for authentication with two levels of access:

**Standard Users**:
- Token passed in `x-auth-token` header
- Access to: login, view questions, submit responses, view leaderboard

**Admins**:
- Token passed in `authorization` header as `Bearer <token>`
- Full access including: create weeks, set answers, trigger auto-scoring, calculate fantasy scores

### Route Protection

**Public Routes** (No authentication):
- `/api/users/login` - User login
- `/api/fantasy/*` - Fantasy queries, lineup submission, leaderboards (except calculateScores)

**User Routes** (Requires `x-auth-token`):
- `/api/information/*` - View and submit picks
- `/api/users/getTotalUserScores` - View leaderboard

**Admin Routes** (Requires `authorization: Bearer <token>`):
- `/api/admin/*` - All admin endpoints (create weeks, auto-scoring, NFL API access)
- `/api/admin/fantasy/calculateScores` - Calculate PPR scores

### Data Access Control

- Users can only submit/update their own responses
- Users can only query their own fantasy lineups and history
- Leaderboards are publicly viewable
- Admin endpoints verify JWT token has `admin: true` claim

## Usage Example

### Creating a Week with Auto-Scoring

```javascript
// 1. Create a new week with API-linked questions
POST /api/admin/createNewWeek
{
  "options": [
    {
      "question": "Who will win the AFC Championship?",
      "type": "multiple-choice",
      "options": ["Kansas City Chiefs", "Buffalo Bills"],
      "apiConfig": {
        "type": "game_winner",
        "gameId": "401671725"
      }
    },
    {
      "question": "Will the total score be over 50?",
      "type": "multiple-choice",
      "options": ["Over", "Under"],
      "apiConfig": {
        "type": "score_over_under",
        "gameId": "401671725",
        "threshold": 50
      }
    }
  ]
}

// 2. After games complete, run auto-scoring
POST /api/admin/autoScore
// This will automatically fetch results for questions with apiConfig
// Only completed games are scored; in-progress games are ignored
```

### Finding Game IDs

To get game IDs for linking questions:

```javascript
// Get games for a specific week
GET /api/admin/nfl/games?week=18&seasonType=2

// Response includes game IDs
{
  "games": [
    {
      "id": "401671725",  // Use this ID in apiConfig
      "name": "Kansas City Chiefs at Buffalo Bills",
      "homeTeam": { "name": "Buffalo Bills", "id": "2" },
      "awayTeam": { "name": "Kansas City Chiefs", "id": "12" }
    }
  ]
}
```

## Architecture

- **Express.js**: Web framework
- **MongoDB**: Database for users, questions, and responses
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication tokens
- **Axios**: HTTP client for NFL API calls
- **bcryptjs**: Password hashing

## Data Models

### User
- `username`: String (unique)
- `password`: String (hashed)
- `scores`: Array of numbers (one per week)
- `admin`: Boolean

### Information (Week)
- `weekNumber`: Number (unique)
- `options`: Array of question objects
  - `question`: String
  - `type`: String
  - `options`: Array of answer choices
  - `apiConfig`: Object (optional) - Configuration for auto-scoring
- `correctAnswers`: Array of correct answer values
- `responses`: Array of user response objects
- `editsAllowed`: Boolean
- `currentWeek`: Boolean
- `autoScoreEnabled`: Boolean

## Security Notes

⚠️ **Important**: The MongoDB connection string and JWT secret key are currently hardcoded in the source code. For production:

1. Move these to environment variables
2. Use a `.env` file and the `dotenv` package
3. Never commit sensitive credentials to version control

## API Rate Limits

The ESPN API is free and doesn't require an API key, but be mindful of:
- Reasonable request rates
- Caching game results when possible
- Not making excessive requests during live games

## Troubleshooting

### Auto-Scoring Not Working
1. Check if `autoScoreEnabled` is true for the current week
2. Verify that questions have valid `apiConfig` objects
3. Ensure game IDs are correct and games are completed
4. Check server logs for API errors

### Game IDs Not Found
- Game IDs change each season
- Use the `/api/admin/nfl/games` endpoint to find current game IDs
- Make sure you're using the correct week and season type

## Future Enhancements

- Scheduled auto-scoring (run automatically every hour during game days)
- Webhook support for real-time score updates
- Support for more question types (point spread, player props, etc.)
- Caching layer for API responses
- Admin dashboard for managing API configurations

## License

ISC
