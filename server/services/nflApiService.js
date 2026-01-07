const axios = require('axios');

/**
 * NFL API Service using ESPN's free public API
 * This service fetches real-time NFL game data for auto-scoring playoff picks
 */

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

/**
 * Get current season year and type (preseason: 1, regular: 2, postseason: 3)
 */
function getCurrentSeasonInfo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed
    
    // NFL season runs roughly September-February
    // Postseason is typically January-February
    let seasonYear = year;
    if (month >= 9) {
        // September-December: current year
        seasonYear = year;
    } else if (month <= 2) {
        // January-February: previous year's season
        seasonYear = year - 1;
    }
    
    // Determine season type based on month
    let seasonType = 2; // Default to regular season
    if (month >= 1 && month <= 2) {
        seasonType = 3; // Postseason
    } else if (month >= 8 && month <= 12) {
        seasonType = 2; // Regular season
    }
    
    return { year: seasonYear, type: seasonType };
}

/**
 * Fetch all teams
 * @returns {Promise<Array>} Array of team objects with id, name, abbreviation
 */
async function getTeams() {
    try {
        const response = await axios.get(`${ESPN_API_BASE}/teams`);
        return response.data.sports[0].leagues[0].teams.map(teamData => ({
            id: teamData.team.id,
            name: teamData.team.displayName,
            abbreviation: teamData.team.abbreviation,
            logo: teamData.team.logos?.[0]?.href
        }));
    } catch (error) {
        console.error('Error fetching NFL teams:', error.message);
        throw new Error('Failed to fetch NFL teams');
    }
}

/**
 * Fetch games for a specific week
 * @param {number} week - Week number (1-18 for regular season, 1-5 for postseason)
 * @param {number} seasonYear - Season year (e.g., 2024)
 * @param {number} seasonType - Season type (2=regular, 3=postseason)
 * @returns {Promise<Array>} Array of game objects
 */
async function getGamesByWeek(week, seasonYear = null, seasonType = null) {
    try {
        const season = seasonYear || getCurrentSeasonInfo().year;
        const type = seasonType || getCurrentSeasonInfo().type;
        
        const response = await axios.get(
            `${ESPN_API_BASE}/scoreboard`,
            {
                params: {
                    seasontype: type,
                    week: week,
                    dates: season
                }
            }
        );
        
        return response.data.events.map(event => {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
            
            return {
                id: event.id,
                name: event.name,
                shortName: event.shortName,
                date: event.date,
                status: competition.status.type.name, // 'STATUS_SCHEDULED', 'STATUS_IN_PROGRESS', 'STATUS_FINAL'
                completed: competition.status.type.completed,
                homeTeam: {
                    id: homeTeam.id,
                    name: homeTeam.team.displayName,
                    abbreviation: homeTeam.team.abbreviation,
                    score: homeTeam.score !== undefined && homeTeam.score !== null ? parseInt(homeTeam.score) : 0,
                    winner: homeTeam.winner || false
                },
                awayTeam: {
                    id: awayTeam.id,
                    name: awayTeam.team.displayName,
                    abbreviation: awayTeam.team.abbreviation,
                    score: awayTeam.score !== undefined && awayTeam.score !== null ? parseInt(awayTeam.score) : 0,
                    winner: awayTeam.winner || false
                }
            };
        });
    } catch (error) {
        console.error('Error fetching games:', error.message);
        throw new Error('Failed to fetch NFL games');
    }
}

/**
 * Get the winner of a specific game
 * @param {string} gameId - ESPN game ID
 * @returns {Promise<Object>} Object with winner info
 */
async function getGameWinner(gameId) {
    try {
        const response = await axios.get(`${ESPN_API_BASE}/summary`, {
            params: { event: gameId }
        });
        
        const competition = response.data.header.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
        
        // Check if game is completed
        if (!competition.status.type.completed) {
            return {
                completed: false,
                status: competition.status.type.name
            };
        }
        
        // Determine winner
        const homeScore = parseInt(homeTeam.score);
        const awayScore = parseInt(awayTeam.score);
        
        // Handle tie games
        if (homeScore === awayScore) {
            return {
                completed: true,
                status: competition.status.type.name,
                tie: true,
                homeTeam: {
                    id: homeTeam.id,
                    name: homeTeam.team.displayName,
                    score: homeScore,
                    winner: false
                },
                awayTeam: {
                    id: awayTeam.id,
                    name: awayTeam.team.displayName,
                    score: awayScore,
                    winner: false
                },
                winnerId: null,
                winnerName: 'Tie'
            };
        }
        
        return {
            completed: true,
            status: competition.status.type.name,
            tie: false,
            homeTeam: {
                id: homeTeam.id,
                name: homeTeam.team.displayName,
                score: homeScore,
                winner: homeScore > awayScore
            },
            awayTeam: {
                id: awayTeam.id,
                name: awayTeam.team.displayName,
                score: awayScore,
                winner: awayScore > homeScore
            },
            winnerId: homeScore > awayScore ? homeTeam.id : awayTeam.id,
            winnerName: homeScore > awayScore ? homeTeam.team.displayName : awayTeam.team.displayName
        };
    } catch (error) {
        console.error(`Error fetching game ${gameId}:`, error.message);
        throw new Error('Failed to fetch game details');
    }
}

/**
 * Get detailed game statistics including player stats
 * @param {string} gameId - ESPN game ID
 * @returns {Promise<Object>} Object with game stats including player statistics
 */
async function getGameStats(gameId) {
    try {
        const response = await axios.get(`${ESPN_API_BASE}/summary`, {
            params: { event: gameId }
        });
        
        const boxscore = response.data.boxscore;
        const competition = response.data.header.competitions[0];
        
        // Check if game is completed
        if (!competition.status.type.completed) {
            return {
                completed: false,
                status: competition.status.type.name
            };
        }
        
        // Extract player statistics
        const players = [];
        
        if (boxscore && boxscore.players) {
            boxscore.players.forEach(teamData => {
                const teamId = teamData.team.id;
                const teamName = teamData.team.displayName;
                
                // Process each stat category (passing, rushing, receiving, etc.)
                teamData.statistics.forEach(statCategory => {
                    const categoryName = statCategory.name; // e.g., "passing", "rushing", "receiving"
                    
                    if (statCategory.athletes) {
                        statCategory.athletes.forEach(athlete => {
                            const playerStats = {
                                playerId: athlete.athlete.id,
                                playerName: athlete.athlete.displayName,
                                teamId: teamId,
                                teamName: teamName,
                                position: athlete.athlete.position?.abbreviation || '',
                                category: categoryName,
                                stats: {}
                            };
                            
                            // Parse stats based on category
                            athlete.stats.forEach((value, index) => {
                                if (statCategory.labels && statCategory.labels[index]) {
                                    const label = statCategory.labels[index];
                                    playerStats.stats[label] = value;
                                }
                            });
                            
                            players.push(playerStats);
                        });
                    }
                });
            });
        }
        
        return {
            completed: true,
            status: competition.status.type.name,
            players: players
        };
    } catch (error) {
        console.error(`Error fetching game stats ${gameId}:`, error.message);
        throw new Error('Failed to fetch game statistics');
    }
}

/**
 * Get specific player stat from a game
 * @param {string} gameId - ESPN game ID
 * @param {string} playerId - ESPN player ID
 * @param {string} statName - Name of the stat (e.g., "TD", "REC", "YDS")
 * @returns {Promise<Object>} Object with player stat value
 */
async function getPlayerStat(gameId, playerId, statName) {
    try {
        const gameStats = await getGameStats(gameId);
        
        if (!gameStats.completed) {
            return {
                completed: false,
                status: gameStats.status
            };
        }
        
        // Find all instances of the player across different stat categories
        const playerInstances = gameStats.players.filter(p => p.playerId === playerId);
        
        if (playerInstances.length === 0) {
            return {
                completed: true,
                found: false,
                message: `Player ${playerId} not found in game stats`,
                statValue: 0 // Default to 0 if player didn't play
            };
        }
        
        // Find the specific stat across all categories
        let statValue = 0;
        let foundStat = false;
        
        // Check all instances of the player for the requested stat
        for (const playerData of playerInstances) {
            for (const [key, value] of Object.entries(playerData.stats)) {
                if (key.toUpperCase() === statName.toUpperCase()) {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                        statValue = parsed;
                        foundStat = true;
                        break;
                    }
                }
            }
            if (foundStat) break;
        }
        
        return {
            completed: true,
            found: true,
            playerId: playerId,
            playerName: playerInstances[0].playerName,
            teamName: playerInstances[0].teamName,
            category: playerInstances[0].category,
            statName: statName,
            statValue: statValue // Will be 0 if stat not found
        };
    } catch (error) {
        console.error(`Error fetching player stat:`, error.message);
        throw new Error('Failed to fetch player stat');
    }
}

/**
 * Auto-score questions based on API data
 * This function determines the correct answer for each question based on the question's apiConfig
 * @param {Array} questions - Array of question objects with apiConfig
 * @returns {Promise<Array>} Array of correct answers
 */
async function autoScoreQuestions(questions) {
    const correctAnswers = [];
    
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // If no API config, skip (manual scoring needed)
        if (!question.apiConfig || !question.apiConfig.type) {
            correctAnswers.push(null);
            continue;
        }
        
        try {
            const config = question.apiConfig;
            
            switch (config.type) {
                case 'game_winner':
                    // Question type: "Who will win this game?"
                    // apiConfig: { type: 'game_winner', gameId: '401234567' }
                    const gameResult = await getGameWinner(config.gameId);
                    if (gameResult.completed) {
                        // Handle tie games
                        if (gameResult.tie) {
                            // Look for a "Tie" option
                            const tieOption = question.options.find(opt => 
                                opt.toLowerCase().includes('tie') || opt.toLowerCase().includes('draw')
                            );
                            correctAnswers.push(tieOption || null);
                        } else {
                            // Find which option matches the winner
                            const winnerOption = question.options.find(opt => 
                                opt === gameResult.winnerName || 
                                opt.includes(gameResult.winnerId)
                            );
                            correctAnswers.push(winnerOption || null);
                        }
                    } else {
                        correctAnswers.push(null); // Game not completed yet
                    }
                    break;
                    
                case 'team_wins':
                    // Question type: "Will [team] win their game?"
                    // apiConfig: { type: 'team_wins', teamId: '1', gameId: '401234567' }
                    const teamGameResult = await getGameWinner(config.gameId);
                    if (teamGameResult.completed) {
                        const teamWon = teamGameResult.winnerId === config.teamId;
                        correctAnswers.push(teamWon ? 'Yes' : 'No');
                    } else {
                        correctAnswers.push(null);
                    }
                    break;
                    
                case 'score_over_under':
                    // Question type: "Will the total score be over/under X?"
                    // apiConfig: { type: 'score_over_under', gameId: '401234567', threshold: 45 }
                    const scoreResult = await getGameWinner(config.gameId);
                    if (scoreResult.completed) {
                        const totalScore = scoreResult.homeTeam.score + scoreResult.awayTeam.score;
                        const isOver = totalScore > config.threshold;
                        correctAnswers.push(isOver ? 'Over' : 'Under');
                    } else {
                        correctAnswers.push(null);
                    }
                    break;
                    
                case 'player_stat_over_under':
                    // Question type: "Will [player] have over/under X [stat]?"
                    // apiConfig: { type: 'player_stat_over_under', gameId: '401234567', playerId: '123456', statName: 'TD', threshold: 1.5 }
                    const playerStatResult = await getPlayerStat(config.gameId, config.playerId, config.statName);
                    if (playerStatResult.completed && playerStatResult.found) {
                        const isOver = playerStatResult.statValue > config.threshold;
                        correctAnswers.push(isOver ? 'Over' : 'Under');
                    } else if (playerStatResult.completed && !playerStatResult.found) {
                        // Player didn't play or no stats recorded - default to 0
                        const isOver = 0 > config.threshold;
                        correctAnswers.push(isOver ? 'Over' : 'Under');
                    } else {
                        correctAnswers.push(null);
                    }
                    break;
                    
                default:
                    console.warn(`Unknown API config type: ${config.type}`);
                    correctAnswers.push(null);
            }
        } catch (error) {
            console.error(`Error auto-scoring question ${i}:`, error.message);
            correctAnswers.push(null); // Error occurred, can't determine answer
        }
    }
    
    return correctAnswers;
}

module.exports = {
    getTeams,
    getGamesByWeek,
    getGameWinner,
    getGameStats,
    getPlayerStat,
    autoScoreQuestions,
    getCurrentSeasonInfo
};
