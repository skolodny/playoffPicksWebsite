# Fantasy Football Feature Guide

This guide explains how to use the fantasy football lineup and PPR scoring system.

## Overview

The fantasy football feature allows users to submit weekly lineups and automatically calculate PPR (Points Per Reception) fantasy scores based on actual NFL player performance.

### Key Features

- **Position Requirements**: Each week requires QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, 1 DEF
- **No Repeat Players**: Players cannot be selected in multiple weeks
- **No Duplicate Players**: Same player cannot be in multiple positions in one lineup
- **Edit Control**: Respects `editsAllowed` flag to lock submissions
- **Automatic PPR Scoring**: Points calculated from ESPN API game statistics
- **Weekly Leaderboard**: Track scores and rankings

## Security Model

**Public Routes** (No authentication required):
- `/api/fantasy/availablePlayers` - Query available players
- `/api/fantasy/submitLineup` - Submit weekly lineup
- `/api/fantasy/lineup` - View lineup
- `/api/fantasy/leaderboard` - View rankings
- `/api/fantasy/playerHistory` - View player selection history

**Admin Routes** (Admin authentication required):
- `/api/admin/fantasy/calculateScores` - Calculate PPR scores (Admin only)

## Position Requirements

Each lineup must include:
- **1 QB** - Quarterback
- **2 RB** - Running Backs (RB1, RB2)
- **2 WR** - Wide Receivers (WR1, WR2)
- **1 TE** - Tight End
- **1 FLEX** - Flexible position (can be RB, WR, or TE)
- **1 K** - Kicker
- **1 DEF** - Defense/Special Teams (team defense)

## PPR Scoring Rules

### Passing
- **Passing Yards**: 1 point per 25 yards
- **Passing TDs**: 4 points each
- **Interceptions**: -2 points each

### Rushing
- **Rushing Yards**: 1 point per 10 yards
- **Rushing TDs**: 6 points each

### Receiving
- **Receptions**: 1 point each (PPR)
- **Receiving Yards**: 1 point per 10 yards
- **Receiving TDs**: 6 points each

### Special Teams
- **Kicker and Defense**: (Scoring TBD - typically field goals, touchdowns, points allowed)

## How to Use: Step-by-Step Guide

### Step 1: Query Available Players

Before submitting a lineup, you need to find available players for each position. The system automatically excludes players you've used in previous weeks. **The current week is automatically determined from the database**, so you don't need to specify it.

**Endpoint:** `GET /api/fantasy/availablePlayers`

**When to use:** Before building your lineup, query each position to see which players you can select.

**Example: Get Available Quarterbacks**

```bash
GET /api/fantasy/availablePlayers?userId=user123&position=QB
```

**Note:** The `weekNumber` is no longer required as a parameter - it's automatically retrieved from the database (the week marked with `currentWeek: true`).

**Response:**
```json
{
  "position": "QB",
  "weekNumber": 1,
  "availablePlayers": [
    {
      "id": "3139477",
      "name": "Patrick Mahomes",
      "position": "QB",
      "team": "Kansas City Chiefs",
      "teamId": "12"
    },
    {
      "id": "4040715",
      "name": "Josh Allen",
      "position": "QB",
      "team": "Buffalo Bills",
      "teamId": "2"
    }
  ]
}
```

**Query Parameters:**
- `userId` (required): Your user ID - used to filter out players you've already used
- `position` (required): One of: `QB`, `RB`, `WR`, `TE`, `K`, `DEF`, `FLEX`
- `weekNumber` (required): The week you're building a lineup for

**Important Notes:**
- Players you used in previous weeks will NOT appear in results
- Query each position separately (QB, RB, WR, TE, K, DEF, FLEX)
- FLEX position shows all RB, WR, and TE players that are still available

**Example: Building Complete Lineup**

```bash
# 1. Get QB options
GET /api/fantasy/availablePlayers?userId=user123&position=QB&weekNumber=1

# 2. Get RB options (need 2 for RB1 and RB2, plus potentially 1 for FLEX)
GET /api/fantasy/availablePlayers?userId=user123&position=RB&weekNumber=1

# 3. Get WR options (need 2 for WR1 and WR2, plus potentially 1 for FLEX)
GET /api/fantasy/availablePlayers?userId=user123&position=WR&weekNumber=1

# 4. Get TE options (need 1, plus potentially 1 for FLEX)
GET /api/fantasy/availablePlayers?userId=user123&position=TE&weekNumber=1

# 5. Get K options
GET /api/fantasy/availablePlayers?userId=user123&position=K&weekNumber=1

# 6. Get DEF options (team defenses)
GET /api/fantasy/availablePlayers?userId=user123&position=DEF&weekNumber=1

# 7. Get FLEX options (can be RB, WR, or TE)
GET /api/fantasy/availablePlayers?userId=user123&position=FLEX&weekNumber=1
```

### Step 2: Submit Your Lineup

Once you've selected players for all positions, submit your complete lineup. **The current week is automatically determined from the database**, so you don't need to specify it.

**Endpoint:** `POST /api/fantasy/submitLineup`

**When to use:** After selecting all 9 players (QB, RB1, RB2, WR1, WR2, TE, FLEX, K, DEF)

**Request Example:**

```bash
POST /api/fantasy/submitLineup
Content-Type: application/json

{
  "userId": "user123",
  "lineup": {
    "QB": "3139477",      // Patrick Mahomes
    "RB1": "4040715",     // Derrick Henry
    "RB2": "3116406",     // Christian McCaffrey (must be different from RB1)
    "WR1": "3043078",     // Tyreek Hill
    "WR2": "4035687",     // Ja'Marr Chase (must be different from WR1)
    "TE": "3116593",      // Travis Kelce
    "FLEX": "2576414",    // Davante Adams (can be any RB/WR/TE not already used)
    "K": "2969939",       // Justin Tucker
    "DEF": "12"           // Kansas City Chiefs defense (team ID)
  }
}
```

**Success Response (201 Created - New Lineup):**
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

**Success Response (200 OK - Updated Lineup):**
If you already submitted a lineup for this week and are updating it:
```json
{
  "message": "Lineup updated successfully",
  "lineup": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "userId": "user123",
    "weekNumber": 1,
    "lineup": { /* your updated lineup */ },
    "totalPoints": 0,
    "submittedAt": "2026-01-06T02:15:00.000Z"
  }
}
```

**Required Fields:**
- `userId`: Your user ID
- `weekNumber`: Week number you're submitting for
- `lineup`: Object containing all 9 positions:
  - `QB` - Quarterback
  - `RB1` - Running Back 1
  - `RB2` - Running Back 2
  - `WR1` - Wide Receiver 1
  - `WR2` - Wide Receiver 2
  - `TE` - Tight End
  - `FLEX` - Flexible position (RB/WR/TE)
  - `K` - Kicker
  - `DEF` - Defense (team ID)

**Validation Rules:**

The system automatically validates your lineup and will reject it if:

1. **Missing Positions** (400 Bad Request)
```json
{
  "message": "Missing required positions: RB2, WR1"
}
```

2. **Duplicate Players** (400 Bad Request)
```json
{
  "message": "Duplicate players in lineup: 4040715. Each player can only be selected once per week."
}
```
*Example: Same player used for both RB1 and RB2*

3. **Reused Players from Previous Weeks** (400 Bad Request)
```json
{
  "message": "The following players have already been used in previous weeks: 3139477, 4040715. Players cannot be reused across multiple weeks."
}
```

4. **Edits Disabled** (403 Forbidden)
```json
{
  "message": "Lineup submissions are not allowed for this week. Edits have been disabled."
}
```
*This happens when the admin locks lineups before games start*

### Complete Workflow Example

Here's a complete example using JavaScript/fetch:

```javascript
// 1. Query available players for each position
async function getAvailablePlayers(userId, position) {
  const response = await fetch(
    `/api/fantasy/availablePlayers?userId=${userId}&position=${position}`
  );
  return response.json();
}

// 2. Build lineup by querying each position
const userId = 'user123';

// Get players for each position (week determined automatically)
const qbs = await getAvailablePlayers(userId, 'QB');
const rbs = await getAvailablePlayers(userId, 'RB');
const wrs = await getAvailablePlayers(userId, 'WR');
const tes = await getAvailablePlayers(userId, 'TE');
const ks = await getAvailablePlayers(userId, 'K');
const defs = await getAvailablePlayers(userId, 'DEF');

// User selects their players (this would be done via UI)
const selectedLineup = {
  QB: qbs.availablePlayers[0].id,      // First available QB
  RB1: rbs.availablePlayers[0].id,     // First available RB
  RB2: rbs.availablePlayers[1].id,     // Second available RB
  WR1: wrs.availablePlayers[0].id,     // First available WR
  WR2: wrs.availablePlayers[1].id,     // Second available WR
  TE: tes.availablePlayers[0].id,      // First available TE
  FLEX: wrs.availablePlayers[2].id,    // Third WR as flex
  K: ks.availablePlayers[0].id,        // First available K
  DEF: defs.availablePlayers[0].id     // First available DEF
};

// 3. Submit the lineup
async function submitLineup(userId, lineup) {
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
  
  return response.json();
}

try {
  const result = await submitLineup(userId, selectedLineup);
  console.log('Lineup submitted successfully!', result);
} catch (error) {
  console.error('Failed to submit lineup:', error.message);
}
```

### Tips for Using These Endpoints

**Best Practices:**

1. **Query players before showing the lineup form** - This ensures users only see valid options
2. **Cache player queries** - Players won't change during a session, so cache the results
3. **Validate on client side** - Check for duplicates before submitting to provide instant feedback
4. **Handle errors gracefully** - Show clear error messages to users
5. **Allow lineup updates** - Users can resubmit until edits are disabled

**Common Mistakes to Avoid:**

❌ Using the same player ID for multiple positions (RB1 and RB2)
❌ Submitting without querying available players first
❌ Trying to use a player from a previous week
❌ Missing required positions in the lineup object
❌ Attempting to submit after edits are disabled

**Timeline:**

```
Week 1 starts → Query players → Submit lineup → Admin locks edits → Games play → Admin calculates scores
                    ↑                ↑              ↑
                  Can update      Last chance    No more changes
                  anytime         to change      allowed
```

## API Endpoints Reference

### Get Available Players

Get players by position that haven't been used in previous weeks.

```
GET /api/fantasy/availablePlayers?userId={userId}&position={position}&weekNumber={week}
```

**Query Parameters:**
- `userId` (required): User's ID
- `position` (required): QB, RB, WR, TE, K, DEF, or FLEX
- `weekNumber` (required): Current week number

**Response:**
```json
{
  "position": "QB",
  "weekNumber": 1,
  "availablePlayers": [
    {
      "id": "3139477",
      "name": "Patrick Mahomes",
      "position": "QB",
      "team": "Kansas City Chiefs",
      "teamId": "12"
    }
  ]
}
```

### Submit Lineup

Submit or update a fantasy lineup for a specific week.

```
POST /api/fantasy/submitLineup
```

**Request Body:**
```json
{
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
  }
}
```

**Validations:**
- ✅ All required positions must be filled
- ✅ No duplicate players in the same lineup (e.g., can't use same player for RB1 and RB2)
- ✅ Players cannot be reused across multiple weeks (enforced automatically)
- ✅ Submissions are blocked if `editsAllowed` is false for the week

**Response:**
```json
{
  "message": "Lineup submitted successfully",
  "lineup": {
    "userId": "user123",
    "weekNumber": 1,
    "lineup": { ... },
    "totalPoints": 0,
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing positions, duplicate players, or players used in previous weeks
- `403` - Lineup submissions disabled (editsAllowed = false)
- `500` - Server error

### Calculate Fantasy Scores (Admin)

Calculate PPR scores for all lineups in the current week.
Automatically uses the current week from the database.

```
POST /api/admin/fantasy/calculateScores
```

**Request Body:** None required (empty body or `{}`)

**Response:**
```json
{
  "message": "Fantasy scores calculated successfully",
  "weekNumber": 1,
  "results": [
    {
      "userId": "user123",
      "weekNumber": 1,
      "totalPoints": 142.6,
      "playerPoints": {
        "QB": { "playerId": "3139477", "points": 28.4 },
        "RB1": { "playerId": "4040715", "points": 15.2 },
        "RB2": { "playerId": "3116406", "points": 12.8 },
        "WR1": { "playerId": "3043078", "points": 24.5 },
        "WR2": { "playerId": "4035687", "points": 18.3 },
        "TE": { "playerId": "3116593", "points": 14.7 },
        "FLEX": { "playerId": "2576414", "points": 22.1 },
        "K": { "playerId": "2969939", "points": 8.0 },
        "DEF": { "playerId": "12", "points": 0.0 }
      }
    }
  ]
}
```

### Get User's Lineup

Retrieve a user's lineup for a specific week.

```
GET /api/fantasy/lineup?weekNumber={week}
```

**Response:**
```json
{
  "lineup": {
    "weekNumber": 1,
    "lineup": { ... },
    "totalPoints": 142.6,
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Fantasy Leaderboard

Get rankings for a specific week sorted by total points.

```
GET /api/fantasy/leaderboard?weekNumber={week}
```

**Response:**
```json
{
  "weekNumber": 1,
  "leaderboard": [
    {
      "rank": 1,
      "username": "player1",
      "userId": "user123",
      "totalPoints": 142.6,
      "lineup": { ... }
    },
    {
      "rank": 2,
      "username": "player2",
      "userId": "user456",
      "totalPoints": 128.3,
      "lineup": { ... }
    }
  ]
}
```

### Get Player Selection History

Get all players a user has selected across all weeks.

```
GET /api/fantasy/playerHistory?userId={userId}
```

**Response:**
```json
{
  "userId": "user123",
  "totalWeeks": 3,
  "usedPlayers": ["3139477", "4040715", "3116406", ...],
  "historyByWeek": {
    "1": {
      "QB": "3139477",
      "RB1": "4040715",
      ...
    },
    "2": {
      "QB": "4040715",
      "RB1": "3043078",
      ...
    }
  }
}
```

## Workflow Example

### 1. Get Available Players for Each Position

```javascript
// Get available QBs for user in week 1
GET /api/fantasy/availablePlayers?userId=user123&position=QB

// Get available RBs
GET /api/fantasy/availablePlayers?userId=user123&position=RB

// Get available WRs
GET /api/fantasy/availablePlayers?userId=user123&position=WR

// Get available TEs
GET /api/fantasy/availablePlayers?userId=user123&position=TE

// Get available FLEX (shows RB/WR/TE combined)
GET /api/fantasy/availablePlayers?userId=user123&position=FLEX

// Get available Kickers
GET /api/fantasy/availablePlayers?userId=user123&position=K

// Get available Defenses
GET /api/fantasy/availablePlayers?userId=user123&position=DEF
```

### 2. Submit Lineup

```javascript
POST /api/fantasy/submitLineup
{
  "lineup": {
    "QB": "3139477",      // Patrick Mahomes
    "RB1": "4040715",     // Christian McCaffrey
    "RB2": "3116406",     // Josh Jacobs
    "WR1": "3043078",     // Tyreek Hill
    "WR2": "4035687",     // Ja'Marr Chase
    "TE": "3116593",      // Travis Kelce
    "FLEX": "2576414",    // Austin Ekeler
    "K": "2969939",       // Justin Tucker
    "DEF": "12"           // Kansas City Defense
  }
}
```

### 3. After Games Complete - Calculate Scores

```javascript
// Admin triggers score calculation for current week
POST /api/admin/fantasy/calculateScores
// No body required - automatically uses current week
```

### 4. View Leaderboard

```javascript
// Get leaderboard for current week
GET /api/fantasy/leaderboard

// Or get leaderboard for specific week
GET /api/fantasy/leaderboard?weekNumber=1
```

## Important Notes

### Player Restrictions

- **No Repeats Across Weeks**: Once a player is used in any week, they cannot be selected again by that user
- **No Duplicates in Same Week**: The same player cannot be selected for multiple positions in a single lineup (e.g., can't use same player for both RB1 and RB2)
- **Check History**: Use the `/playerHistory` endpoint to see which players a user has already selected
- **Available Players Only**: The `/availablePlayers` endpoint automatically filters out previously used players
- **Automatic Validation**: The system enforces these rules when submitting lineups

### Lineup Submission Control

- **Edits Allowed**: Lineup submissions are controlled by the `editsAllowed` flag in the Information model
- **When editsAllowed = false**: Users cannot submit or update lineups for that week (returns 403 error)
- **When editsAllowed = true**: Users can submit and update lineups freely
- **Lock Before Games**: Admins should set `editsAllowed = false` before games start to prevent changes

### Timing

- **Submit Before Games**: Lineups should be submitted before the first game of the week starts
- **Calculate After Games**: Run `/calculateScores` after all week's games are completed
- **Incomplete Games**: Players in games that haven't finished will have 0 points until the game completes

### FLEX Position

- FLEX can be filled by any RB, WR, or TE
- When querying for FLEX players, the API returns all available RBs, WRs, and TEs
- Make sure the FLEX selection isn't already used in RB1, RB2, WR1, WR2, or TE positions
- The duplicate validation will catch if you try to use the same player twice

### Defense (DEF)

- Defense uses team IDs, not player IDs
- Each NFL team defense can only be used once per user across all weeks
- Defense scoring may vary from standard fantasy rules (implementation TBD)

## Error Handling

### Common Errors

**400 Bad Request**
- Missing required parameters
- Invalid position
- Missing required lineup positions
- Duplicate players in lineup (e.g., same player in RB1 and RB2)
- Players already used in previous weeks

**403 Forbidden**
- Lineup submissions disabled (editsAllowed = false for the week)

**404 Not Found**
- No lineup found for user/week
- No lineups submitted for week (when calculating scores)

**500 Server Error**
- API connection issues
- Database errors

## Integration with Main Scoring System

The fantasy football scoring is separate from the main playoff picks scoring. Users will have:
1. **Playoff Picks Score**: From answering weekly questions (existing system)
2. **Fantasy Score**: From PPR performance of their lineup (new system)

Both scoring systems are independent but can be combined for an overall leaderboard if desired.

## Future Enhancements

Potential additions:
- Defense/Special Teams scoring rules
- Kicker scoring rules (field goals, extra points)
- 2-point conversions
- Fumbles lost
- Season-long cumulative scores
- Trade/waiver system
- Draft functionality
