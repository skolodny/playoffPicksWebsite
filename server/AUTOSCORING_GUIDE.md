# Auto-Scoring Usage Guide

This guide explains how to set up and use the auto-scoring feature for your NFL playoff picks website.

## Quick Start

### 1. Get Game IDs from ESPN

First, fetch the available games for a specific week to get their IDs:

```bash
# Example: Get games for postseason week 1 (Wild Card round)
GET /api/admin/nfl/games?week=1&seasonType=3

Response:
{
  "games": [
    {
      "id": "401671725",
      "name": "Kansas City Chiefs at Buffalo Bills",
      "date": "2025-01-19T18:00Z",
      "status": "STATUS_FINAL",
      "completed": true,
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
  ]
}
```

### 2. Create a Week with API-Linked Questions

When creating a new week, add `apiConfig` to questions you want to auto-score:

```javascript
POST /api/admin/createNewWeek
{
  "options": [
    {
      "question": "Who will win Chiefs vs Bills?",
      "type": "multiple-choice",
      "options": ["Kansas City Chiefs", "Buffalo Bills"],
      "apiConfig": {
        "type": "game_winner",
        "gameId": "401671725"
      }
    },
    {
      "question": "Will the total score be over 50 points?",
      "type": "multiple-choice", 
      "options": ["Over", "Under"],
      "apiConfig": {
        "type": "score_over_under",
        "gameId": "401671725",
        "threshold": 50
      }
    },
    {
      "question": "Which coach do you think is better?",
      "type": "multiple-choice",
      "options": ["Andy Reid", "Sean McDermott"]
      // No apiConfig - this will be manually scored
    }
  ]
}
```

### 3. Let Users Submit Their Picks

Users submit their picks through the existing `/api/information/submitResponse` endpoint. This doesn't change.

### 4. Run Auto-Scoring After Games Complete

Once the games are finished, trigger auto-scoring:

```javascript
POST /api/admin/autoScore

Response:
{
  "message": "Auto-scoring completed successfully",
  "correctAnswers": ["Buffalo Bills", "Under", null],
  "gamesScored": 2
}
```

This will:
- Fetch game results from ESPN API for completed games only
- Determine correct answers for questions with `apiConfig`
- Ignore in-progress or unstarted games (returns null for those)
- Update `correctAnswers` in the database
- Calculate and update all user scores

**Note:** You can run auto-scoring multiple times. It will update answers for newly completed games while preserving existing answers.

### 5. Manually Score Remaining Questions (Optional)

If some questions don't have API configs, you can manually set their answers:

```javascript
POST /api/admin/setCorrectAnswers
{
  "correctAnswers": ["Buffalo Bills", "Under", "Andy Reid"]
}
```

Then run score calculation:

```javascript
POST /api/admin/calculateScores
```

## API Configuration Types

### Game Winner

Determines which team won a specific game.

```javascript
{
  "question": "Who will win the AFC Championship?",
  "type": "multiple-choice",
  "options": ["Kansas City Chiefs", "Buffalo Bills", "Tie"],
  "apiConfig": {
    "type": "game_winner",
    "gameId": "401671725"
  }
}
```

**Notes:**
- The team names in `options` should match ESPN's team display names
- Include "Tie" as an option if you want to handle tied games (rare but possible)

### Team Wins

Determines if a specific team won their game (Yes/No).

```javascript
{
  "question": "Will the Chiefs win their game?",
  "type": "multiple-choice",
  "options": ["Yes", "No"],
  "apiConfig": {
    "type": "team_wins",
    "teamId": "12",
    "gameId": "401671725"
  }
}
```

**Finding Team IDs:**
```javascript
GET /api/admin/nfl/teams

Response:
{
  "teams": [
    { "id": "12", "name": "Kansas City Chiefs", "abbreviation": "KC" },
    { "id": "2", "name": "Buffalo Bills", "abbreviation": "BUF" }
  ]
}
```

### Score Over/Under

Determines if total game score is over or under a threshold.

```javascript
{
  "question": "Will the total score be over 47.5 points?",
  "type": "multiple-choice",
  "options": ["Over", "Under"],
  "apiConfig": {
    "type": "score_over_under",
    "gameId": "401671725",
    "threshold": 47.5
  }
}
```

### Player Stat Over/Under

Determines if a player's individual stat is over or under a threshold.

```javascript
{
  "question": "Will Patrick Mahomes throw over 2.5 touchdowns?",
  "type": "multiple-choice",
  "options": ["Over", "Under"],
  "apiConfig": {
    "type": "player_stat_over_under",
    "gameId": "401671725",
    "playerId": "3139477",
    "statName": "TD",
    "threshold": 2.5
  }
}
```

**Finding Player IDs and Stat Names:**

1. First, get game stats to see all players and their available stats:
```javascript
GET /api/admin/nfl/game/401671725/stats

Response includes:
{
  "stats": {
    "completed": true,
    "players": [
      {
        "playerId": "3139477",
        "playerName": "Patrick Mahomes",
        "teamName": "Kansas City Chiefs",
        "position": "QB",
        "category": "passing",
        "stats": {
          "C/ATT": "23/35",
          "YDS": "320",
          "AVG": "9.1",
          "TD": "3",
          "INT": "1",
          "QBR": "95.4"
        }
      }
    ]
  }
}
```

2. Use the player ID and stat name to create questions:
```javascript
{
  "question": "Will Travis Kelce have over 6.5 receptions?",
  "options": ["Over", "Under"],
  "apiConfig": {
    "type": "player_stat_over_under",
    "gameId": "401671725",
    "playerId": "1234567",  // Travis Kelce's ID from game stats
    "statName": "REC",
    "threshold": 6.5
  }
}
```

**Common Stat Names by Position:**

**Quarterback (QB):**
- `TD` - Passing touchdowns
- `YDS` - Passing yards
- `INT` - Interceptions
- `QBR` - Quarterback rating

**Running Back (RB):**
- `CAR` - Rushing carries
- `YDS` - Rushing yards
- `TD` - Rushing touchdowns
- `REC` - Receptions (if catching passes)

**Wide Receiver/Tight End (WR/TE):**
- `REC` - Receptions
- `YDS` - Receiving yards
- `TD` - Receiving touchdowns
- `TAR` - Targets

**Notes:**
- If a player doesn't play or has no recorded stats, the value defaults to 0
- Stat names are case-insensitive (TD, td, or Td all work)

## Season Types and Week Numbers

### Season Type Parameter

- `2` = Regular Season (Weeks 1-18)
- `3` = Postseason (Weeks 1-5)
  - Week 1: Wild Card Round
  - Week 2: Divisional Round
  - Week 3: Conference Championships
  - Week 4: Pro Bowl
  - Week 5: Super Bowl

### Current Season Logic

The API automatically determines the current season and type based on the date:
- September-December: Current year, regular season
- January-February: Previous year's postseason
- Other months: May need manual season/type specification

## Workflow Recommendations

### During the Season

1. **Monday/Tuesday after games**: Run auto-scoring
   ```javascript
   POST /api/admin/autoScore
   ```

2. **Review results**: Check that all games were scored correctly

3. **Handle any issues**: If some games didn't score properly, use manual scoring:
   ```javascript
   POST /api/admin/setCorrectAnswers
   POST /api/admin/calculateScores
   ```

### Automated Workflow (Future Enhancement)

You could set up a scheduled job (cron, AWS Lambda, etc.) to automatically run auto-scoring:

```javascript
// Run every hour on Sunday/Monday during playoffs
const schedule = require('node-schedule');

schedule.scheduleJob('0 * * * *', async () => {
  try {
    const response = await fetch('http://yourserver.com/api/admin/autoScore', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
      }
    });
    console.log('Auto-scoring completed:', await response.json());
  } catch (error) {
    console.error('Auto-scoring failed:', error);
  }
});
```

## Troubleshooting

### Games Not Showing as Completed

ESPN's API may take a few minutes to mark games as final. Wait 5-10 minutes after game ends before running auto-scoring.

### Wrong Correct Answer

Check that:
1. Game ID is correct
2. Team names in options exactly match ESPN's display names
3. The game has actually completed

You can verify game status:
```javascript
GET /api/admin/nfl/game/401671725
```

### Some Questions Not Auto-Scored

This is normal! Questions without `apiConfig` will have `null` as the correct answer. You need to manually score these.

### In-Progress Games Not Scored

This is expected behavior. Auto-scoring only scores completed games. In-progress or unstarted games return `null` and will be scored when you run auto-scoring again after they complete.

## Best Practices

1. **Test First**: Before the season starts, create a test week with past games to verify everything works

2. **Run Regularly**: Run auto-scoring multiple times as games finish throughout the day. It will only update newly completed games.

3. **Mix Auto and Manual**: Use auto-scoring for straightforward game outcomes, manual scoring for subjective questions

4. **Backup Plan**: Always have a manual scoring plan in case the ESPN API is down

5. **Communicate to Users**: Let users know when auto-scoring will run so they're not surprised by score updates

6. **Monitor API Health**: Keep an eye on ESPN API availability during playoffs

## Examples

### Example 1: Simple Playoff Week

```javascript
// Create week with 3 Wild Card games
POST /api/admin/createNewWeek
{
  "options": [
    {
      "question": "Who wins Buccaneers @ Commanders?",
      "type": "multiple-choice",
      "options": ["Tampa Bay Buccaneers", "Washington Commanders"],
      "apiConfig": { "type": "game_winner", "gameId": "401671722" }
    },
    {
      "question": "Who wins Chargers @ Texans?",
      "type": "multiple-choice",
      "options": ["Los Angeles Chargers", "Houston Texans"],
      "apiConfig": { "type": "game_winner", "gameId": "401671723" }
    },
    {
      "question": "Who wins Steelers @ Ravens?",
      "type": "multiple-choice",
      "options": ["Pittsburgh Steelers", "Baltimore Ravens"],
      "apiConfig": { "type": "game_winner", "gameId": "401671724" }
    }
  ]
}

// After all games complete
POST /api/admin/autoScore
```

### Example 2: Super Bowl Week with Mixed Questions

```javascript
POST /api/admin/createNewWeek
{
  "options": [
    {
      "question": "Who will win the Super Bowl?",
      "type": "multiple-choice",
      "options": ["Kansas City Chiefs", "Philadelphia Eagles"],
      "apiConfig": { "type": "game_winner", "gameId": "401671999" }
    },
    {
      "question": "Will the total score be over 50?",
      "type": "multiple-choice",
      "options": ["Over", "Under"],
      "apiConfig": { 
        "type": "score_over_under", 
        "gameId": "401671999",
        "threshold": 50
      }
    },
    {
      "question": "Who will win Super Bowl MVP?",
      "type": "multiple-choice",
      "options": ["Patrick Mahomes", "Jalen Hurts", "Other"]
      // No apiConfig - needs manual scoring
    },
    {
      "question": "What color Gatorade will be dumped?",
      "type": "multiple-choice",
      "options": ["Orange", "Blue", "Yellow", "Clear"]
      // No apiConfig - needs manual scoring
    }
  ]
}

// After Super Bowl
POST /api/admin/autoScore  // Scores first 2 questions
POST /api/admin/setCorrectAnswers  // Manually set MVP and Gatorade
{ "correctAnswers": ["Kansas City Chiefs", "Under", "Patrick Mahomes", "Orange"] }
POST /api/admin/calculateScores  // Recalculate with all answers
```

### Example 3: Player Props Week

```javascript
// First, get game stats to find player IDs
GET /api/admin/nfl/game/401671725/stats

// Then create questions with player stats
POST /api/admin/createNewWeek
{
  "options": [
    {
      "question": "Will Patrick Mahomes throw over 2.5 TDs?",
      "type": "multiple-choice",
      "options": ["Over", "Under"],
      "apiConfig": {
        "type": "player_stat_over_under",
        "gameId": "401671725",
        "playerId": "3139477",
        "statName": "TD",
        "threshold": 2.5
      }
    },
    {
      "question": "Will Travis Kelce have over 6.5 receptions?",
      "type": "multiple-choice",
      "options": ["Over", "Under"],
      "apiConfig": {
        "type": "player_stat_over_under",
        "gameId": "401671725",
        "playerId": "1234567",
        "statName": "REC",
        "threshold": 6.5
      }
    },
    {
      "question": "Will Josh Allen rush for over 30.5 yards?",
      "type": "multiple-choice",
      "options": ["Over", "Under"],
      "apiConfig": {
        "type": "player_stat_over_under",
        "gameId": "401671725",
        "playerId": "3918298",
        "statName": "YDS",
        "threshold": 30.5
      }
    },
    {
      "question": "Who will have more receiving yards?",
      "type": "multiple-choice",
      "options": ["Stefon Diggs", "Tyreek Hill"]
      // No apiConfig - would need custom logic, use manual scoring
    }
  ]
}

// After game completes
POST /api/admin/autoScore  // Scores first 3 questions automatically
// Manually score the 4th question if needed
```

### Example 4: Combined Week with All Question Types

```javascript
POST /api/admin/createNewWeek
{
  "options": [
    {
      "question": "Who wins Chiefs @ Bills?",
      "type": "multiple-choice",
      "options": ["Kansas City Chiefs", "Buffalo Bills"],
      "apiConfig": { "type": "game_winner", "gameId": "401671725" }
    },
    {
      "question": "Will the Chiefs win?",
      "type": "multiple-choice",
      "options": ["Yes", "No"],
      "apiConfig": { 
        "type": "team_wins",
        "teamId": "12",
        "gameId": "401671725"
      }
    },
    {
      "question": "Total score over 47.5?",
      "type": "multiple-choice",
      "options": ["Over", "Under"],
      "apiConfig": { 
        "type": "score_over_under",
        "gameId": "401671725",
        "threshold": 47.5
      }
    },
    {
      "question": "Mahomes over 275.5 passing yards?",
      "type": "multiple-choice",
      "options": ["Over", "Under"],
      "apiConfig": {
        "type": "player_stat_over_under",
        "gameId": "401671725",
        "playerId": "3139477",
        "statName": "YDS",
        "threshold": 275.5
      }
    }
  ]
}
```

## Advanced Tips

### Finding Player IDs

To find player IDs for creating player prop questions:

1. Get the game stats after a game completes:
   ```javascript
   GET /api/admin/nfl/game/401671725/stats
   ```

2. Search the response for the player's name to get their ID

3. Or test a specific player stat to verify the ID:
   ```javascript
   GET /api/admin/nfl/game/401671725/player/3139477/stat/TD
   ```

### Stat Name Reference

When creating player prop questions, use these common stat abbreviations:

- **Passing:** TD, YDS, INT, QBR, C/ATT (completions/attempts)
- **Rushing:** CAR, YDS, TD, AVG
- **Receiving:** REC, YDS, TD, TAR, AVG
- **Defense:** TKL (tackles), SACK, INT

The exact stat names available depend on what ESPN provides. Use the game stats endpoint to see all available stats for a specific game.

### Caching Game Results

If you're scoring multiple weeks or need to run auto-scoring multiple times, consider caching ESPN API responses to avoid hitting rate limits.

### Error Handling

The auto-scoring system gracefully handles errors:
- If a game isn't complete, it returns `null` (no answer yet)
- If API is down, it falls back to existing manual answers
- If a question config is invalid, it skips that question

### Mixing with Existing Manual Workflow

Auto-scoring is completely backward compatible:
- Weeks without `autoScoreEnabled` work exactly as before
- Questions without `apiConfig` work as before
- Manual scoring still works and can override API results

## Support

For issues or questions:
1. Check the main README.md for general setup
2. Review server logs for API errors
3. Test with the `/api/admin/nfl/games` endpoint to verify API connectivity
