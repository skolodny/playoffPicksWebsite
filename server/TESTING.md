# Testing Documentation

This document describes the test suite for the NFL auto-scoring system.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

The test suite is organized into two main test files:

### 1. `tests/nflApiService.test.js`

Tests for the NFL API service module that integrates with ESPN's API.

**Tests Covered:**
- `getCurrentSeasonInfo()` - Verifies season year and type calculation
- `getTeams()` - Tests fetching all NFL teams with proper structure
- `getGamesByWeek()` - Tests fetching games for a specific week
- `getGameWinner()` - Tests game winner determination, including ties
- `getGameStats()` - Tests fetching detailed player statistics
- `getPlayerStat()` - Tests retrieving specific player stat values
- `autoScoreQuestions()` - Tests auto-scoring logic for all question types

**Mocking Strategy:**
- Uses `jest.mock('axios')` to mock HTTP requests
- Avoids actual network calls to ESPN API (required for CI/CD)
- Tests data structure validation and error handling

### 2. `tests/adminRoutes.test.js`

Tests for admin API endpoints that handle auto-scoring operations.

**Endpoints Tested:**
- `GET /api/admin/nfl/teams` - List all NFL teams
- `GET /api/admin/nfl/games` - Get games for a specific week
- `GET /api/admin/nfl/game/:gameId` - Get game winner details
- `GET /api/admin/nfl/game/:gameId/stats` - Get game statistics
- `GET /api/admin/nfl/game/:gameId/player/:playerId/stat/:statName` - Get player stat
- `POST /api/admin/autoScore` - Trigger auto-scoring
- `POST /api/admin/toggleAutoScore` - Enable/disable auto-scoring
- `POST /api/admin/calculateScores` - Calculate user scores

**Mocking Strategy:**
- Uses `supertest` for HTTP endpoint testing
- Mocks authentication middleware
- Mocks database models (Information, User)
- Mocks NFL API service

## Test Coverage

Current test coverage:
- **37 tests** across 2 test suites
- **All tests passing** ✅

### Coverage Areas:

1. **API Integration**
   - ESPN API data fetching
   - Error handling for network failures
   - Data structure validation

2. **Auto-Scoring Logic**
   - Game winner determination
   - Team wins/losses
   - Score over/under
   - Player stat over/under
   - Handling of incomplete games
   - Tie game scenarios

3. **Admin Endpoints**
   - Request validation
   - Response structure
   - Error responses
   - Parameter requirements

4. **Edge Cases**
   - Invalid game IDs
   - Player not found
   - Incomplete games
   - API failures
   - Unknown question types

## Test Data

Tests use mocked data that mimics ESPN API responses:

### Mock Team Data
```javascript
{
  id: '1',
  name: 'Kansas City Chiefs',
  abbreviation: 'KC',
  logos: [{ href: 'http://example.com/logo.png' }]
}
```

### Mock Game Data
```javascript
{
  id: '123',
  name: 'Chiefs vs Bills',
  completed: true,
  homeTeam: { name: 'Buffalo Bills', score: 27, winner: true },
  awayTeam: { name: 'Kansas City Chiefs', score: 24, winner: false }
}
```

### Mock Player Stats
```javascript
{
  playerId: '3139477',
  playerName: 'Patrick Mahomes',
  category: 'passing',
  stats: {
    TD: '3',
    YDS: '320',
    INT: '1'
  }
}
```

## Writing New Tests

When adding new features, follow these guidelines:

### 1. Service Tests (nflApiService.test.js)

```javascript
describe('newFunction', () => {
    test('should return expected data structure', async () => {
        // Mock axios response
        axios.get.mockResolvedValue({
            data: { /* mock data */ }
        });
        
        const result = await nflApiService.newFunction();
        
        expect(result).toBeDefined();
        expect(result).toHaveProperty('expectedField');
    });
    
    test('should handle errors', async () => {
        axios.get.mockRejectedValue(new Error('Network error'));
        
        await expect(nflApiService.newFunction()).rejects.toThrow();
    });
});
```

### 2. Route Tests (adminRoutes.test.js)

```javascript
describe('GET /api/admin/new-endpoint', () => {
    test('should return expected data', async () => {
        // Mock service function
        nflApiService.someFunction.mockResolvedValue(mockData);
        
        const response = await request(app)
            .get('/api/admin/new-endpoint')
            .expect(200);
        
        expect(response.body).toHaveProperty('data');
    });
    
    test('should handle errors', async () => {
        nflApiService.someFunction.mockRejectedValue(new Error('Error'));
        
        const response = await request(app)
            .get('/api/admin/new-endpoint')
            .expect(500);
        
        expect(response.body).toHaveProperty('message');
    });
});
```

## Continuous Integration

Tests are designed to run in CI/CD environments:

- **No external dependencies** - All API calls are mocked
- **No database required** - Database models are mocked
- **Fast execution** - Tests complete in ~2 seconds
- **Deterministic** - Same results every time

## Manual Testing

While automated tests verify code functionality, manual testing is recommended for:

1. **Real ESPN API responses** - Test with actual live games
2. **End-to-end workflows** - Create week, submit picks, auto-score
3. **Frontend integration** - Verify data format matches frontend needs
4. **Edge cases** - Test with unusual game scenarios

### Manual Test Checklist

- [ ] Fetch teams list from ESPN API
- [ ] Fetch games for current week
- [ ] Create questions with player stat configs
- [ ] Enable auto-scoring for a week
- [ ] Trigger auto-scoring after games complete
- [ ] Verify correct answers are populated
- [ ] Verify user scores are calculated correctly

## Debugging Tests

### Running Single Test File
```bash
npx jest tests/nflApiService.test.js
```

### Running Single Test Suite
```bash
npx jest -t "getTeams"
```

### Verbose Output
```bash
npx jest --verbose
```

### Watch Mode for Development
```bash
npm run test:watch
```

## Known Limitations

1. **No Live API Tests** - Tests use mocks, not actual ESPN API
2. **Database Not Tested** - Mongoose models are mocked
3. **Authentication Not Tested** - Admin auth middleware is mocked
4. **Integration Tests Missing** - No full end-to-end tests

Future improvements could include integration tests with a test database and optional live API tests (disabled by default).

## Test Dependencies

- **jest** (v30.2.0) - Testing framework
- **supertest** (v7.1.4) - HTTP endpoint testing
- **axios mocking** - Network request mocking

No additional test dependencies required.
