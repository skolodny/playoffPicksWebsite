const axios = require('axios');
const PlayerLineup = require('../models/PlayerLineup');
const NFLPlayer = require('../models/NFLPlayer');

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

/**
 * Get available players by position excluding previously used players
 * @param {string} userId - User's ID
 * @param {string} position - Position (QB, RB, WR, TE, K, DEF)
 * @param {number} currentWeek - Current week number
 * @returns {Promise<Array>} Array of available players
 */
async function getAvailablePlayersByPosition(userId, position, currentWeek) {
    try {
        // Get all previous lineups for this user
        const previousLineups = await PlayerLineup.find({
            userId: userId,
            weekNumber: { $lt: currentWeek }
        });
        
        // Collect all previously used player IDs
        const usedPlayerIds = new Set();
        previousLineups.forEach(lineup => {
            Object.values(lineup.lineup).forEach(playerId => {
                usedPlayerIds.add(playerId);
            });
        });
        
        // Fetch players from MongoDB database
        const players = await fetchPlayersByPosition(position);
        
        // Filter out previously used players
        const availablePlayers = players.filter(player => !usedPlayerIds.has(player.id));
        
        return availablePlayers;
    } catch (error) {
        console.error('Error getting available players:', error.message);
        throw new Error('Failed to get available players');
    }
}

/**
 * Get available players for all valid positions at once
 * Excludes players the user has already selected in previous weeks
 * @param {string} userId - User's ID
 * @param {number} currentWeek - Current week number
 * @returns {Promise<Object>} Object with players grouped by position
 */
async function getAvailablePlayersAllPositions(userId, currentWeek) {
    try {
        // Get all previous lineups for this user
        const previousLineups = await PlayerLineup.find({
            userId: userId,
            weekNumber: { $lt: currentWeek }
        });
        
        // Collect all previously used player IDs
        const usedPlayerIds = new Set();
        previousLineups.forEach(lineup => {
            Object.values(lineup.lineup).forEach(playerId => {
                usedPlayerIds.add(playerId);
            });
        });
        
        // Fetch all players for each position
        const positions = ['QB', 'RB', 'WR', 'TE', 'PK', 'DEF'];
        const result = {};
        
        // Fetch all positions in parallel for better performance
        await Promise.all(positions.map(async (position) => {
            const players = await fetchPlayersByPosition(position);
            // Filter out previously used players
            result[position] = players.filter(player => !usedPlayerIds.has(player.id));
        }));
        
        // Add FLEX as combination of RB, WR, TE
        result['FLEX'] = [
            ...result['RB'],
            ...result['WR'],
            ...result['TE']
        ];
        
        return result;
    } catch (error) {
        console.error('Error getting available players for all positions:', error.message);
        throw new Error('Failed to get available players for all positions');
    }
}

/**
 * Fetch players by position from MongoDB database
 * Uses nfl_players collection in sports database
 * @param {string} position - Position to filter by
 * @returns {Promise<Array>} Array of player objects
 */
async function fetchPlayersByPosition(position) {
    try {
        // For DEF position, return teams instead
        if (position === 'DEF') {
            return await getDefenseTeams();
        }
        
        // Build query based on position
        let query = {};
        if (position === 'FLEX') {
            // FLEX can be RB, WR, or TE
            query.position = { $in: ['RB', 'WR', 'TE'] };
        } else {
            query.position = position;
        }
        
        // Fetch players from MongoDB
        const dbPlayers = await NFLPlayer.find(query);
        
        // Format players to match expected structure
        const players = dbPlayers.map(player => ({
            id: player.espn_id,
            name: player.name || 'Unknown Player',
            position: player.position
        }));
        
        return players;
    } catch (error) {
        console.error('Error fetching players by position:', error.message);
        throw new Error('Failed to fetch players from database');
    }
}

/**
 * Get defense teams (simplified - just returns teams)
 */
async function getDefenseTeams() {
    try {
        const response = await axios.get(`${ESPN_API_BASE}/teams`);
        return response.data.sports[0].leagues[0].teams.map(teamData => ({
            id: teamData.team.id,
            name: `${teamData.team.displayName} Defense`,
            position: 'DEF',
            team: teamData.team.displayName,
            teamId: teamData.team.id
        }));
    } catch (error) {
        console.error('Error fetching defense teams:', error.message);
        throw new Error('Failed to fetch defense teams');
    }
}

/**
 * Fetch all player stats for a game once (optimized batching)
 * @param {string} gameId - ESPN game ID
 * @returns {Promise<Object>} Game stats with all players
 */
async function fetchGameStatsOnce(gameId) {
    try {
        const response = await axios.get(`${ESPN_API_BASE}/summary`, {
            params: { event: gameId }
        });
        
        const competition = response.data.header.competitions[0];
        if (!competition.status.type.completed) {
            return {
                completed: false,
                playerStats: {}
            };
        }
        
        const boxscore = response.data.boxscore;
        const playerStats = {};
        
        if (boxscore && boxscore.players) {
            boxscore.players.forEach(teamData => {
                teamData.statistics.forEach(statCategory => {
                    if (statCategory.athletes) {
                        statCategory.athletes.forEach(athlete => {
                            const playerId = athlete.athlete.id;
                            
                            // Build stats object for this player
                            const stats = {};
                            athlete.stats.forEach((value, index) => {
                                if (statCategory.labels && statCategory.labels[index]) {
                                    stats[statCategory.labels[index]] = value;
                                }
                            });
                            
                            // Calculate PPR points for this stat category
                            const points = calculatePPRPoints(stats, statCategory.name);
                            
                            // Accumulate points for this player
                            if (!playerStats[playerId]) {
                                playerStats[playerId] = {
                                    points: 0,
                                    breakdown: {}
                                };
                            }
                            playerStats[playerId].points += points.total;
                            playerStats[playerId].breakdown = {
                                ...playerStats[playerId].breakdown,
                                ...points.breakdown
                            };
                        });
                    }
                });
            });
        }
        
        return {
            completed: true,
            playerStats: playerStats
        };
    } catch (error) {
        console.error(`Error fetching game stats for game ${gameId}:`, error.message);
        return {
            completed: false,
            playerStats: {},
            error: error.message
        };
    }
}

/**
 * Calculate PPR fantasy points for a player in a specific game
 * @param {string} gameId - ESPN game ID
 * @param {string} playerId - ESPN player ID
 * @returns {Promise<Object>} Fantasy points breakdown
 */
async function calculatePlayerPPR(gameId, playerId) {
    try {
        const response = await axios.get(`${ESPN_API_BASE}/summary`, {
            params: { event: gameId }
        });
        
        const competition = response.data.header.competitions[0];
        if (!competition.status.type.completed) {
            return {
                completed: false,
                points: 0
            };
        }
        
        const boxscore = response.data.boxscore;
        let totalPoints = 0;
        let breakdown = {};
        
        if (boxscore && boxscore.players) {
            boxscore.players.forEach(teamData => {
                teamData.statistics.forEach(statCategory => {
                    if (statCategory.athletes) {
                        const athlete = statCategory.athletes.find(a => a.athlete.id === playerId);
                        if (athlete) {
                            const stats = {};
                            athlete.stats.forEach((value, index) => {
                                if (statCategory.labels && statCategory.labels[index]) {
                                    stats[statCategory.labels[index]] = value;
                                }
                            });
                            
                            // Calculate PPR points
                            const points = calculatePPRPoints(stats, statCategory.name);
                            totalPoints += points.total;
                            breakdown = { ...breakdown, ...points.breakdown };
                        }
                    }
                });
            });
        }
        
        return {
            completed: true,
            points: totalPoints,
            breakdown: breakdown
        };
    } catch (error) {
        console.error(`Error calculating PPR for player ${playerId}:`, error.message);
        return {
            completed: false,
            points: 0,
            error: error.message
        };
    }
}

/**
 * Calculate PPR points from stats
 * @param {Object} stats - Player statistics
 * @param {string} category - Stat category (passing, rushing, receiving)
 * @returns {Object} Points breakdown
 */
function calculatePPRPoints(stats, category) {
    let total = 0;
    const breakdown = {};
    
    if (category === 'passing') {
        // Passing yards: 1 point per 25 yards
        const yards = parseFloat(stats.YDS) || 0;
        const yardPoints = yards / 25;
        breakdown.passingYards = yardPoints;
        total += yardPoints;
        
        // Passing TDs: 4 points each
        const tds = parseFloat(stats.TD) || 0;
        const tdPoints = tds * 4;
        breakdown.passingTDs = tdPoints;
        total += tdPoints;
        
        // Interceptions: -2 points each
        const ints = parseFloat(stats.INT) || 0;
        const intPoints = ints * -2;
        breakdown.interceptions = intPoints;
        total += intPoints;
    } else if (category === 'rushing') {
        // Rushing yards: 1 point per 10 yards
        const yards = parseFloat(stats.YDS) || 0;
        const yardPoints = yards / 10;
        breakdown.rushingYards = yardPoints;
        total += yardPoints;
        
        // Rushing TDs: 6 points each
        const tds = parseFloat(stats.TD) || 0;
        const tdPoints = tds * 6;
        breakdown.rushingTDs = tdPoints;
        total += tdPoints;
    } else if (category === 'receiving') {
        // Receptions: 1 point each (PPR)
        const receptions = parseFloat(stats.REC) || 0;
        breakdown.receptions = receptions;
        total += receptions;
        
        // Receiving yards: 1 point per 10 yards
        const yards = parseFloat(stats.YDS) || 0;
        const yardPoints = yards / 10;
        breakdown.receivingYards = yardPoints;
        total += yardPoints;
        
        // Receiving TDs: 6 points each
        const tds = parseFloat(stats.TD) || 0;
        const tdPoints = tds * 6;
        breakdown.receivingTDs = tdPoints;
        total += tdPoints;
    }
    
    return { total, breakdown };
}

/**
 * Calculate total lineup PPR points for a week
 * Handles player names instead of IDs by looking up IDs from the NFLPlayer collection
 * @param {string} userId - User ID
 * @param {number} weekNumber - Week number
 * @returns {Promise<Object>} Total points and breakdown
 */
async function calculateLineupPPR(userId, weekNumber) {
    try {
        // Get user's lineup for the week
        const lineup = await PlayerLineup.findOne({ userId, weekNumber });
        if (!lineup) {
            throw new Error('No lineup found for this user and week');
        }
        
        // Get games for this week
        const seasonInfo = getCurrentSeasonInfo();
        const gamesResponse = await axios.get(`${ESPN_API_BASE}/scoreboard`, {
            params: {
                seasontype: seasonInfo.type,
                week: weekNumber,
                dates: seasonInfo.year
            }
        });
        
        const games = gamesResponse.data.events;
        let totalPoints = 0;
        const playerPoints = {};
        
        // Convert player names to IDs for lookup
        const playerNameToIdMap = {};
        
        // For each position, lookup the ESPN ID from the player name
        for (const [position, playerName] of Object.entries(lineup.lineup)) {
            // Handle DEF position separately - it's a team name
            if (position === 'DEF') {
                // Extract team name from defense name (e.g., "Kansas City Chiefs Defense" -> "Kansas City Chiefs")
                const teamName = playerName.replace(' Defense', '').trim();
                
                // Get team ID from ESPN API
                try {
                    const teamsResponse = await axios.get(`${ESPN_API_BASE}/teams`);
                    const teams = teamsResponse.data.sports[0].leagues[0].teams;
                    const team = teams.find(t => t.team.displayName === teamName || t.team.name === teamName);
                    
                    if (team) {
                        playerNameToIdMap[playerName] = team.team.id;
                    } else {
                        console.warn(`Team not found for defense: ${playerName}`);
                        playerNameToIdMap[playerName] = null;
                    }
                } catch (err) {
                    console.error(`Error fetching team for ${playerName}:`, err.message);
                    playerNameToIdMap[playerName] = null;
                }
            } else {
                // Regular player - lookup ESPN ID from MongoDB
                const player = await NFLPlayer.findOne({ name: playerName });
                if (player) {
                    playerNameToIdMap[playerName] = player.espn_id;
                } else {
                    console.warn(`Player not found in database: ${playerName}`);
                    playerNameToIdMap[playerName] = null;
                }
            }
            
            playerPoints[position] = {
                playerName,
                playerId: playerNameToIdMap[playerName],
                points: 0
            };
        }
        
        // For each game, fetch stats once and calculate points for all players in that game
        for (const game of games) {
            const gameId = game.id;
            
            // Fetch game stats once for this game
            const gameStats = await fetchGameStatsOnce(gameId);
            
            // If game not completed or error, skip
            if (!gameStats.completed) {
                continue;
            }
            
            // Calculate points for each player in the lineup that played in this game
            for (const [position, playerInfo] of Object.entries(playerPoints)) {
                const playerId = playerInfo.playerId;
                
                if (!playerId) {
                    continue; // Skip if we couldn't find the player ID
                }
                
                const playerStats = gameStats.playerStats[playerId];
                if (playerStats) {
                    playerPoints[position].points += playerStats.points;
                    totalPoints += playerStats.points;
                }
            }
        }
        
        // Update lineup with total points
        lineup.totalPoints = totalPoints;
        await lineup.save();
        
        return {
            userId,
            weekNumber,
            totalPoints,
            playerPoints
        };
    } catch (error) {
        console.error('Error calculating lineup PPR:', error.message);
        throw new Error('Failed to calculate lineup PPR');
    }
}

/**
 * Get current season info helper with week calculation
 */
function getCurrentSeasonInfo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    let seasonYear = year;
    if (month >= 9) {
        // September-December: current year
    } else if (month <= 2) {
        // January-February: previous year's season
        seasonYear = year - 1;
    }
    
    let seasonType = 2; // Default to regular season
    if (month >= 1 && month <= 2) {
        seasonType = 3; // Postseason
    }
    
    // Calculate NFL week (Week 1 typically starts first Thursday after Labor Day, around Sept 5-10)
    let week = 1;
    if (month === 9) {
        // September: Weeks 1-4
        if (day >= 5) {
            week = Math.floor((day - 5) / 7) + 1;
        }
    } else if (month === 10) {
        // October: Weeks 4-8
        week = 4 + Math.ceil(day / 7);
    } else if (month === 11) {
        // November: Weeks 9-13
        week = 8 + Math.ceil(day / 7);
    } else if (month === 12) {
        // December: Weeks 13-17
        week = 12 + Math.ceil(day / 7);
    } else if (month === 1) {
        // January: Weeks 18 or playoffs
        week = 17 + Math.ceil(day / 7);
        seasonType = 3; // Postseason
    } else if (month === 2) {
        // February: Super Bowl week
        week = 4; // Postseason week
        seasonType = 3; // Postseason
    } else {
        // Off-season months (March-August): default to week 1
        week = 1;
    }
    
    // Cap week at 18 for regular season, 4 for postseason
    if (seasonType === 2) {
        week = Math.min(week, 18);
    } else {
        week = Math.min(week, 4);
    }
    
    return { year: seasonYear, type: seasonType, week };
}

module.exports = {
    getAvailablePlayersByPosition,
    getAvailablePlayersAllPositions,
    calculatePlayerPPR,
    calculateLineupPPR
};
