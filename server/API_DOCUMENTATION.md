# API Documentation

Complete reference for all API endpoints with request/response formats.

## Table of Contents
- [Authentication](#authentication)
- [User Routes](#user-routes)
- [Admin Routes - NFL Auto-Scoring](#admin-routes---nfl-auto-scoring)
- [Fantasy Football Routes](#fantasy-football-routes)

---

## Authentication

### Headers

**Standard User Authentication:**
```
x-auth-token: <JWT_TOKEN>
```

**Admin Authentication:**
```
authorization: Bearer <ADMIN_JWT_TOKEN>
```

---

## User Routes

### POST /api/users/login
Login to get authentication token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": false
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

---

## Admin Routes - NFL Auto-Scoring

All admin routes require `authorization: Bearer <ADMIN_JWT_TOKEN>` header.

### GET /api/admin/nfl/teams
Get list of all NFL teams with IDs.

**Response (200 OK):**
```json
{
  "teams": [
    {
      "id": "1",
      "name": "Atlanta Falcons",
      "abbreviation": "ATL",
      "displayName": "Atlanta Falcons",
      "logo": "https://..."
    },
    {
      "id": "2",
      "name": "Buffalo Bills",
      "abbreviation": "BUF",
      "displayName": "Buffalo Bills",
      "logo": "https://..."
    }
  ]
}
```

### GET /api/admin/nfl/games?week={weekNumber}
Get all games for a specific week.

**Query Parameters:**
- `week` (required): Week number (1-18)

**Response (200 OK):**
```json
{
  "week": 1,
  "games": [
    {
      "id": "401671725",
      "name": "Kansas City Chiefs at Buffalo Bills",
      "shortName": "KC @ BUF",
      "date": "2025-01-19T18:00Z",
      "completed": true,
      "homeTeam": {
        "id": "2",
        "name": "Buffalo Bills",
        "abbreviation": "BUF",
        "score": 27
      },
      "awayTeam": {
        "id": "12",
        "name": "Kansas City Chiefs",
        "abbreviation": "KC",
        "score": 24
      }
    }
  ]
}
```

### GET /api/admin/nfl/game/:gameId
Get detailed game information including winner.

**Response (200 OK):**
```json
{
  "gameId": "401671725",
  "name": "Kansas City Chiefs at Buffalo Bills",
  "completed": true,
  "winner": "Buffalo Bills",
  "homeTeam": {
    "id": "2",
    "name": "Buffalo Bills",
    "score": 27
  },
  "awayTeam": {
    "id": "12",
    "name": "Kansas City Chiefs",
    "score": 24
  }
}
```

**Response for Incomplete Game (200 OK):**
```json
{
  "gameId": "401671725",
  "name": "Kansas City Chiefs at Buffalo Bills",
  "completed": false,
  "winner": null,
  "homeTeam": {
    "id": "2",
    "name": "Buffalo Bills",
    "score": 14
  },
  "awayTeam": {
    "id": "12",
    "name": "Kansas City Chiefs",
    "score": 10
  }
}
```

### GET /api/admin/nfl/game/:gameId/stats
Get all player statistics for a completed game.

**Response (200 OK):**
```json
{
  "gameId": "401671725",
  "completed": true,
  "players": [
    {
      "id": "3139477",
      "name": "Patrick Mahomes",
      "team": "Kansas City Chiefs",
      "position": "QB",
      "stats": {
        "passing": {
          "C/ATT": "23/35",
          "YDS": 267,
          "TD": 2,
          "INT": 1,
          "QBR": 85.4
        }
      }
    },
    {
      "id": "4040715",
      "name": "Josh Allen",
      "team": "Buffalo Bills",
      "position": "QB",
      "stats": {
        "passing": {
          "C/ATT": "27/34",
          "YDS": 312,
          "TD": 3,
          "INT": 0,
          "QBR": 127.5
        },
        "rushing": {
          "CAR": 7,
          "YDS": 45,
          "TD": 1
        }
      }
    }
  ]
}
```

### GET /api/admin/nfl/game/:gameId/player/:playerId/stat/:statName
Get specific player stat for a game.

**Response (200 OK):**
```json
{
  "gameId": "401671725",
  "playerId": "3139477",
  "statName": "TD",
  "statValue": 2,
  "playerName": "Patrick Mahomes",
  "team": "Kansas City Chiefs"
}
```

**Response when player not found (200 OK):**
```json
{
  "gameId": "401671725",
  "playerId": "9999999",
  "statName": "TD",
  "statValue": 0,
  "message": "Player not found in game stats"
}
```

### POST /api/admin/autoScore
Trigger auto-scoring for all questions with apiConfig.

**Request Body:**
```json
{
  "weekNumber": 1
}
```

**Response (200 OK):**
```json
{
  "message": "Auto-scoring completed successfully",
  "weekNumber": 1,
  "questionsScored": 12,
  "questionsSkipped": 3,
  "details": [
    {
      "questionIndex": 0,
      "question": "Who wins Chiefs vs Bills?",
      "correctAnswer": "Buffalo Bills",
      "scored": true
    },
    {
      "questionIndex": 1,
      "question": "Will Mahomes throw over 2.5 TDs?",
      "correctAnswer": null,
      "scored": false,
      "reason": "Game not completed"
    }
  ]
}
```

### POST /api/admin/calculateScores
Calculate user scores (includes auto-scoring if apiConfig present).

**Request Body:**
```json
{
  "weekNumber": 1
}
```

**Response (200 OK):**
```json
{
  "message": "Scores calculated successfully",
  "weekNumber": 1,
  "userScores": [
    {
      "username": "john_doe",
      "score": 8,
      "totalQuestions": 10
    },
    {
      "username": "jane_smith",
      "score": 7,
      "totalQuestions": 10
    }
  ]
}
```

---

## Fantasy Football Routes

### User Routes (No authentication required)

#### GET /api/fantasy/availablePlayers
Get available players by position excluding previously selected players.

**Purpose:** Query players before building a lineup to see which players are eligible. Automatically filters out players the user has already selected in previous weeks. The current week is automatically determined from the database.

**When to use:** Before displaying the lineup form to users, query each position to get valid player options.

**Query Parameters:**
- `userId` (required): User ID - used to filter out previously selected players
- `position` (required): Position (QB, RB, WR, TE, K, DEF, FLEX)

**Note:** The week number is automatically retrieved from the database (the week marked with `currentWeek: true`).

**Example Request:**
```bash
GET /api/fantasy/availablePlayers?userId=user123&position=QB
```

**Response (200 OK):**
```json
{
  "position": "QB",
  "weekNumber": 1,
  "availablePlayers": [
    {
      "id": "3139477",
      "name": "Patrick Mahomes",
      "team": "Kansas City Chiefs",
      "position": "QB"
    },
    {
      "id": "4040715",
      "name": "Josh Allen",
      "team": "Buffalo Bills",
      "position": "QB"
    }
  ]
}
```

**Field Descriptions:**
- `position`: The position that was queried
- `weekNumber`: The week number being queried for
- `availablePlayers`: Array of player objects
  - `id`: ESPN player ID (use this in lineup submission)
  - `name`: Player's full name
  - `team`: Team name
  - `position`: Player's position

**Error Response (400 Bad Request):**
```json
{
  "message": "userId, position, and weekNumber are required"
}
```

**Error Response - Invalid Position (400 Bad Request):**
```json
{
  "message": "Invalid position. Must be one of: QB, RB, WR, TE, K, DEF, FLEX"
}
```

**Usage Notes:**
- Query each position separately before building lineup
- Players used in previous weeks will not appear in results
- FLEX position returns all available RB, WR, and TE players
- Results are filtered per user - each user sees different available players based on their history
- Defense (DEF) returns team defenses, not individual players

**Example: Building Complete Lineup**
```bash
# Query each position (week determined automatically from database)
GET /api/fantasy/availablePlayers?userId=user123&position=QB
GET /api/fantasy/availablePlayers?userId=user123&position=RB
GET /api/fantasy/availablePlayers?userId=user123&position=WR
GET /api/fantasy/availablePlayers?userId=user123&position=TE
GET /api/fantasy/availablePlayers?userId=user123&position=K
GET /api/fantasy/availablePlayers?userId=user123&position=DEF
GET /api/fantasy/availablePlayers?userId=user123&position=FLEX
```

#### POST /api/fantasy/submitLineup
Submit or update weekly fantasy lineup.

**Purpose:** Submit a complete lineup with all 9 required positions. Can be called multiple times to update the lineup before edits are disabled. The current week is automatically determined from the database.

**When to use:** After user has selected all players for their lineup. Can be used to create a new lineup or update an existing one.

**Note:** The week number is automatically retrieved from the database (the week marked with `currentWeek: true`).

**Request Body:**
```json
{
  "userId": "user123",
  "lineup": {
    "QB": "3139477",
    "RB1": "4040715",
    "RB2": "3116406",
    "WR1": "3043078",
    "WR2": "4035687",
    "TE": "3116593",
    "FLEX": "2576414",
    "K": "2969939",
    "DEF": "12"
  }
}
```

**Field Descriptions:**
- `userId`: User ID submitting the lineup
- `weekNumber`: Week number for this lineup
- `lineup`: Object with all 9 required positions
  - `QB`: Quarterback player ID
  - `RB1`: Running Back 1 player ID
  - `RB2`: Running Back 2 player ID (must be different from RB1)
  - `WR1`: Wide Receiver 1 player ID
  - `WR2`: Wide Receiver 2 player ID (must be different from WR1)
  - `TE`: Tight End player ID
  - `FLEX`: Flexible position player ID (can be RB, WR, or TE - must not duplicate any other position)
  - `K`: Kicker player ID
  - `DEF`: Defense/Special Teams team ID

**Response - New Lineup (201 Created):**
```json
{
  "message": "Lineup submitted successfully",
  "lineup": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "userId": "user123",
    "weekNumber": 1,
    "lineup": {
      "QB": "3139477",
      "RB1": "4040715",
      "RB2": "3116406",
      "WR1": "3043078",
      "WR2": "4035687",
      "TE": "3116593",
      "FLEX": "2576414",
      "K": "2969939",
      "DEF": "12"
    },
    "totalPoints": 0,
    "submittedAt": "2026-01-06T02:00:00.000Z"
  }
}
```

**Response - Updated Lineup (200 OK):**
```json
{
  "message": "Lineup updated successfully",
  "lineup": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "userId": "user123",
    "weekNumber": 1,
    "lineup": {
      "QB": "3139477",
      "RB1": "4040715",
      "RB2": "3116406",
      "WR1": "3043078",
      "WR2": "4035687",
      "TE": "3116593",
      "FLEX": "2576414",
      "K": "2969939",
      "DEF": "12"
    },
    "totalPoints": 0,
    "submittedAt": "2026-01-06T02:15:00.000Z"
  }
}
```

**Error Response - Edits Disabled (403 Forbidden):**
```json
{
  "message": "Lineup submissions are not allowed for this week. Edits have been disabled."
}
```

**Error Response - Missing Positions (400 Bad Request):**
```json
{
  "message": "Missing required positions: RB2, WR1"
}
```

**Error Response - Duplicate Players (400 Bad Request):**
```json
{
  "message": "Duplicate players in lineup: 4040715, 3116406. Each player can only be selected once per week."
}
```

**Error Response - Reused Players (400 Bad Request):**
```json
{
  "message": "The following players have already been used in previous weeks: 3139477, 4040715. Players cannot be reused across multiple weeks."
}
```

**Validation Rules:**

The endpoint performs the following validations (in order):

1. **Edit Control Check** - Returns 403 if `editsAllowed = false` for the week
2. **Required Positions Check** - Returns 400 if any position is missing
3. **Duplicate Player Check** - Returns 400 if same player ID appears multiple times
4. **No-Repeat Enforcement** - Returns 400 if any player was used in previous weeks

**Usage Notes:**
- Can be called multiple times for the same week to update lineup
- First submission creates new lineup (201), subsequent calls update (200)
- All 9 positions must be provided in every submission
- Player IDs should come from `GET /api/fantasy/availablePlayers` queries
- Validate client-side before submitting to provide better UX

**Complete Usage Example (JavaScript):**
```javascript
async function submitFantasyLineup(userId, lineup) {
  try {
    const response = await fetch('/api/fantasy/submitLineup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        lineup  // weekNumber is determined automatically from database
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log(result.message); // "Lineup submitted successfully" or "Lineup updated successfully"
    return result.lineup;
  } catch (error) {
    console.error('Submission failed:', error.message);
    throw error;
  }
}

// Example usage
const lineup = {
  QB: "3139477",
  RB1: "4040715",
  RB2: "3116406",
  WR1: "3043078",
  WR2: "4035687",
  TE: "3116593",
  FLEX: "2576414",
  K: "2969939",
  DEF: "12"
};

await submitFantasyLineup("user123", 1, lineup);
```

#### GET /api/fantasy/lineup
Get user's lineup for a specific week or current week.

**Query Parameters:**
- `weekNumber` (optional): Week number. If not provided, uses current week from database

**Response (200 OK):**
```json
{
  "lineup": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "weekNumber": 1,
    "lineup": {
      "QB": "3139477",
      "RB1": "4040715",
      "RB2": "3116406",
      "WR1": "3043078",
      "WR2": "4035687",
      "TE": "3116593",
      "FLEX": "2576414",
      "K": "2969939",
      "DEF": "12"
    },
    "totalPoints": 87.5,
    "submittedAt": "2026-01-06T02:00:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "No lineup found for this user and week"
}
```

#### GET /api/fantasy/leaderboard
Get fantasy leaderboard for a specific week or current week.

**Query Parameters:**
- `weekNumber` (optional): Week number. If not provided, uses current week from database

**Response (200 OK):**
```json
{
  "weekNumber": 1,
  "leaderboard": [
    {
      "rank": 1,
      "username": "john_doe",
      "userId": "user123",
      "totalPoints": 127.8,
      "lineup": {
        "QB": "3139477",
        "RB1": "4040715",
        "RB2": "3116406",
        "WR1": "3043078",
        "WR2": "4035687",
        "TE": "3116593",
        "FLEX": "2576414",
        "K": "2969939",
        "DEF": "12"
      }
    },
    {
      "rank": 2,
      "username": "jane_smith",
      "userId": "user456",
      "totalPoints": 115.3,
      "lineup": {
        "QB": "4040715",
        "RB1": "3116406",
        "RB2": "2576414",
        "WR1": "4035687",
        "WR2": "3043078",
        "TE": "3116593",
        "FLEX": "3139477",
        "K": "2969939",
        "DEF": "12"
      }
    }
  ]
}
```

#### GET /api/fantasy/playerHistory
Get all previously selected players for a user.

**Query Parameters:**
- `userId` (required): User ID

**Response (200 OK):**
```json
{
  "userId": "user123",
  "totalWeeks": 3,
  "usedPlayers": [
    "3139477",
    "4040715",
    "3116406",
    "3043078",
    "4035687",
    "3116593",
    "2576414",
    "2969939",
    "12"
  ],
  "historyByWeek": {
    "1": {
      "QB": "3139477",
      "RB1": "4040715",
      "RB2": "3116406",
      "WR1": "3043078",
      "WR2": "4035687",
      "TE": "3116593",
      "FLEX": "2576414",
      "K": "2969939",
      "DEF": "12"
    },
    "2": {
      "QB": "4241478",
      "RB1": "3128720",
      "RB2": "4046359",
      "WR1": "4047365",
      "WR2": "3929630",
      "TE": "4242335",
      "FLEX": "4361741",
      "K": "3051926",
      "DEF": "14"
    }
  }
}
```

### Admin Routes (Requires admin authentication)

#### POST /api/admin/fantasy/calculateScores
Calculate PPR fantasy scores for all lineups in the current week (Admin only).
Automatically uses the current week from the database.

**Request Body:** None required (empty body)

**Response (200 OK):**
```json
{
  "message": "Fantasy scores calculated successfully",
  "weekNumber": 1,
  "results": [
    {
      "userId": "user123",
      "weekNumber": 1,
      "totalPoints": 127.8,
      "breakdown": {
        "QB": {
          "playerId": "3139477",
          "playerName": "Patrick Mahomes",
          "points": 22.68
        },
        "RB1": {
          "playerId": "4040715",
          "playerName": "Derrick Henry",
          "points": 18.5
        },
        "RB2": {
          "playerId": "3116406",
          "playerName": "Christian McCaffrey",
          "points": 24.3
        },
        "WR1": {
          "playerId": "3043078",
          "playerName": "Tyreek Hill",
          "points": 15.7
        },
        "WR2": {
          "playerId": "4035687",
          "playerName": "Ja'Marr Chase",
          "points": 19.2
        },
        "TE": {
          "playerId": "3116593",
          "playerName": "Travis Kelce",
          "points": 12.4
        },
        "FLEX": {
          "playerId": "2576414",
          "playerName": "Davante Adams",
          "points": 8.9
        },
        "K": {
          "playerId": "2969939",
          "playerName": "Justin Tucker",
          "points": 11.0
        },
        "DEF": {
          "playerId": "12",
          "playerName": "Kansas City Chiefs",
          "points": 6.0
        }
      }
    },
    {
      "userId": "user456",
      "weekNumber": 1,
      "totalPoints": 115.3,
      "breakdown": {
        "QB": {
          "playerId": "4040715",
          "playerName": "Josh Allen",
          "points": 28.48
        }
      }
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "No lineups found for week 1"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "weekNumber is required"
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "message": "Detailed error message explaining what went wrong"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden: Admins only"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error message or stack trace"
}
```

---

## PPR Scoring Rules

Fantasy points are calculated using the following formula:

**Passing:**
- 1 point per 25 yards
- 4 points per TD
- -2 points per INT

**Rushing:**
- 1 point per 10 yards
- 6 points per TD

**Receiving (PPR):**
- 1 point per reception
- 1 point per 10 yards
- 6 points per TD

**Kicker:**
- Points based on field goal distance (varies by implementation)

**Defense:**
- Points based on points allowed and turnovers (varies by implementation)

---

## Notes

1. **Authentication**: Admin routes require JWT token in `authorization` header as `Bearer <token>`. User routes require token in `x-auth-token` header.

2. **Date Format**: All dates are in ISO 8601 format (e.g., `2026-01-06T02:00:00.000Z`)

3. **Player IDs**: Player IDs are strings from ESPN's API (e.g., `"3139477"`)

4. **Team IDs**: Team IDs are strings from ESPN's API (e.g., `"12"` for Kansas City Chiefs)

5. **Completed Games Only**: Auto-scoring only processes completed games. Incomplete games return `null` and are scored on subsequent runs.

6. **No-Repeat Rule**: Players cannot be reused across multiple weeks in fantasy lineups.

7. **Duplicate Prevention**: The same player cannot be selected for multiple positions in the same week's lineup.

8. **Edit Control**: When `editsAllowed = false` for a week, lineup submissions are blocked.
