/**
 * Tests for NFL API Service
 * These tests verify that the ESPN API integration returns correct data
 * Uses mocks to avoid network dependencies in CI/CD
 */

const axios = require('axios');
const nflApiService = require('../services/nflApiService');

// Mock axios
jest.mock('axios');

describe('NFL API Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCurrentSeasonInfo', () => {
        test('should return season year and type', () => {
            const seasonInfo = nflApiService.getCurrentSeasonInfo();
            
            expect(seasonInfo).toBeDefined();
            expect(seasonInfo).toHaveProperty('year');
            expect(seasonInfo).toHaveProperty('type');
            expect(typeof seasonInfo.year).toBe('number');
            expect(typeof seasonInfo.type).toBe('number');
            expect([1, 2, 3]).toContain(seasonInfo.type); // 1=preseason, 2=regular, 3=postseason
        });
    });

    describe('getTeams', () => {
        test('should fetch all NFL teams', async () => {
            const mockResponse = {
                data: {
                    sports: [{
                        leagues: [{
                            teams: [
                                {
                                    team: {
                                        id: '1',
                                        displayName: 'Kansas City Chiefs',
                                        abbreviation: 'KC',
                                        logos: [{ href: 'http://example.com/logo.png' }]
                                    }
                                },
                                {
                                    team: {
                                        id: '2',
                                        displayName: 'Buffalo Bills',
                                        abbreviation: 'BUF',
                                        logos: [{ href: 'http://example.com/logo2.png' }]
                                    }
                                }
                            ]
                        }]
                    }]
                }
            };
            
            axios.get.mockResolvedValue(mockResponse);
            
            const teams = await nflApiService.getTeams();
            
            expect(teams).toBeDefined();
            expect(Array.isArray(teams)).toBe(true);
            expect(teams.length).toBe(2);
            
            // Check structure of first team
            const team = teams[0];
            expect(team).toHaveProperty('id');
            expect(team).toHaveProperty('name');
            expect(team).toHaveProperty('abbreviation');
            expect(team.id).toBe('1');
            expect(team.name).toBe('Kansas City Chiefs');
            expect(team.abbreviation).toBe('KC');
        });

        test('should handle API errors', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));
            
            await expect(nflApiService.getTeams()).rejects.toThrow('Failed to fetch NFL teams');
        });
    });

    describe('getGamesByWeek', () => {
        test('should fetch games for a specific week', async () => {
            const mockResponse = {
                data: {
                    events: [
                        {
                            id: '123',
                            name: 'Chiefs vs Bills',
                            shortName: 'KC @ BUF',
                            date: '2024-01-20T18:00Z',
                            competitions: [{
                                status: {
                                    type: {
                                        name: 'STATUS_FINAL',
                                        completed: true
                                    }
                                },
                                competitors: [
                                    {
                                        homeAway: 'home',
                                        id: '2',
                                        team: {
                                            displayName: 'Buffalo Bills',
                                            abbreviation: 'BUF'
                                        },
                                        score: '27',
                                        winner: true
                                    },
                                    {
                                        homeAway: 'away',
                                        id: '1',
                                        team: {
                                            displayName: 'Kansas City Chiefs',
                                            abbreviation: 'KC'
                                        },
                                        score: '24',
                                        winner: false
                                    }
                                ]
                            }]
                        }
                    ]
                }
            };
            
            axios.get.mockResolvedValue(mockResponse);
            
            const games = await nflApiService.getGamesByWeek(1, 2024, 2);
            
            expect(games).toBeDefined();
            expect(Array.isArray(games)).toBe(true);
            expect(games.length).toBe(1);
            
            const game = games[0];
            expect(game).toHaveProperty('id');
            expect(game).toHaveProperty('name');
            expect(game).toHaveProperty('status');
            expect(game).toHaveProperty('completed');
            expect(game).toHaveProperty('homeTeam');
            expect(game).toHaveProperty('awayTeam');
            expect(game.id).toBe('123');
            expect(game.completed).toBe(true);
        });

        test('should handle API errors', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));
            
            await expect(nflApiService.getGamesByWeek(1)).rejects.toThrow('Failed to fetch NFL games');
        });
    });

    describe('getGameWinner', () => {
        test('should return game winner for completed game', async () => {
            const mockResponse = {
                data: {
                    header: {
                        competitions: [{
                            status: {
                                type: {
                                    name: 'STATUS_FINAL',
                                    completed: true
                                }
                            },
                            competitors: [
                                {
                                    homeAway: 'home',
                                    id: '2',
                                    team: { displayName: 'Buffalo Bills' },
                                    score: '27',
                                    winner: true
                                },
                                {
                                    homeAway: 'away',
                                    id: '1',
                                    team: { displayName: 'Kansas City Chiefs' },
                                    score: '24',
                                    winner: false
                                }
                            ]
                        }]
                    }
                }
            };
            
            axios.get.mockResolvedValue(mockResponse);
            
            const result = await nflApiService.getGameWinner('123');
            
            expect(result).toBeDefined();
            expect(result.completed).toBe(true);
            expect(result.winnerId).toBe('2');
            expect(result.winnerName).toBe('Buffalo Bills');
        });

        test('should handle tie games', async () => {
            const mockResponse = {
                data: {
                    header: {
                        competitions: [{
                            status: {
                                type: {
                                    name: 'STATUS_FINAL',
                                    completed: true
                                }
                            },
                            competitors: [
                                {
                                    homeAway: 'home',
                                    id: '2',
                                    team: { displayName: 'Team A' },
                                    score: '24'
                                },
                                {
                                    homeAway: 'away',
                                    id: '1',
                                    team: { displayName: 'Team B' },
                                    score: '24'
                                }
                            ]
                        }]
                    }
                }
            };
            
            axios.get.mockResolvedValue(mockResponse);
            
            const result = await nflApiService.getGameWinner('123');
            
            expect(result.completed).toBe(true);
            expect(result.tie).toBe(true);
            expect(result.winnerId).toBeNull();
            expect(result.winnerName).toBe('Tie');
        });

        test('should return incomplete for ongoing game', async () => {
            const mockResponse = {
                data: {
                    header: {
                        competitions: [{
                            status: {
                                type: {
                                    name: 'STATUS_IN_PROGRESS',
                                    completed: false
                                }
                            },
                            competitors: []
                        }]
                    }
                }
            };
            
            axios.get.mockResolvedValue(mockResponse);
            
            const result = await nflApiService.getGameWinner('123');
            
            expect(result.completed).toBe(false);
        });

        test('should handle API errors', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));
            
            await expect(nflApiService.getGameWinner('invalid')).rejects.toThrow('Failed to fetch game details');
        });
    });

    describe('getGameStats', () => {
        test('should return player stats for completed game', async () => {
            const mockResponse = {
                data: {
                    header: {
                        competitions: [{
                            status: {
                                type: {
                                    name: 'STATUS_FINAL',
                                    completed: true
                                }
                            }
                        }]
                    },
                    boxscore: {
                        players: [
                            {
                                team: {
                                    id: '1',
                                    displayName: 'Kansas City Chiefs'
                                },
                                statistics: [
                                    {
                                        name: 'passing',
                                        labels: ['C/ATT', 'YDS', 'TD', 'INT'],
                                        athletes: [
                                            {
                                                athlete: {
                                                    id: '3139477',
                                                    displayName: 'Patrick Mahomes',
                                                    position: { abbreviation: 'QB' }
                                                },
                                                stats: ['23/35', '320', '3', '1']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            };
            
            axios.get.mockResolvedValue(mockResponse);
            
            const result = await nflApiService.getGameStats('123');
            
            expect(result.completed).toBe(true);
            expect(result.players).toBeDefined();
            expect(Array.isArray(result.players)).toBe(true);
            expect(result.players.length).toBeGreaterThan(0);
            
            const player = result.players[0];
            expect(player.playerId).toBe('3139477');
            expect(player.playerName).toBe('Patrick Mahomes');
            expect(player.stats).toHaveProperty('TD');
            expect(player.stats.TD).toBe('3');
        });

        test('should handle incomplete game', async () => {
            const mockResponse = {
                data: {
                    header: {
                        competitions: [{
                            status: {
                                type: {
                                    name: 'STATUS_IN_PROGRESS',
                                    completed: false
                                }
                            }
                        }]
                    }
                }
            };
            
            axios.get.mockResolvedValue(mockResponse);
            
            const result = await nflApiService.getGameStats('123');
            
            expect(result.completed).toBe(false);
        });

        test('should handle API errors', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));
            
            await expect(nflApiService.getGameStats('invalid')).rejects.toThrow('Failed to fetch game statistics');
        });
    });

    describe('getPlayerStat', () => {
        test('should return player stat value', async () => {
            
            axios.get.mockResolvedValue({
                data: {
                    header: {
                        competitions: [{
                            status: { type: { completed: true } }
                        }]
                    },
                    boxscore: {
                        players: [{
                            team: { id: '1', displayName: 'KC' },
                            statistics: [{
                                name: 'passing',
                                labels: ['TD', 'YDS'],
                                athletes: [{
                                    athlete: {
                                        id: '123',
                                        displayName: 'Patrick Mahomes',
                                        position: { abbreviation: 'QB' }
                                    },
                                    stats: ['3', '320']
                                }]
                            }]
                        }]
                    }
                }
            });
            
            const result = await nflApiService.getPlayerStat('123', '123', 'TD');
            
            expect(result.completed).toBe(true);
            expect(result.found).toBe(true);
            expect(result.statValue).toBe(3);
        });

        test('should return 0 for player not found', async () => {
            axios.get.mockResolvedValue({
                data: {
                    header: {
                        competitions: [{
                            status: { type: { completed: true } }
                        }]
                    },
                    boxscore: {
                        players: []
                    }
                }
            });
            
            const result = await nflApiService.getPlayerStat('123', '999', 'TD');
            
            expect(result.completed).toBe(true);
            expect(result.found).toBe(false);
            expect(result.statValue).toBe(0);
        });

        test('should handle API errors', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));
            
            await expect(nflApiService.getPlayerStat('invalid', '123', 'TD')).rejects.toThrow('Failed to fetch player stat');
        });
    });

    describe('autoScoreQuestions', () => {
        test('should return null for questions without apiConfig', async () => {
            const questions = [
                {
                    question: 'Test question',
                    options: ['Option 1', 'Option 2']
                }
            ];
            
            const results = await nflApiService.autoScoreQuestions(questions);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(1);
            expect(results[0]).toBeNull();
        });

        test('should handle game_winner question type', async () => {
            axios.get.mockResolvedValue({
                data: {
                    header: {
                        competitions: [{
                            status: { type: { completed: true } },
                            competitors: [
                                {
                                    homeAway: 'home',
                                    id: '2',
                                    team: { displayName: 'Buffalo Bills' },
                                    score: '27'
                                },
                                {
                                    homeAway: 'away',
                                    id: '1',
                                    team: { displayName: 'Kansas City Chiefs' },
                                    score: '24'
                                }
                            ]
                        }]
                    }
                }
            });
            
            const questions = [
                {
                    question: 'Who wins?',
                    options: ['Kansas City Chiefs', 'Buffalo Bills'],
                    apiConfig: {
                        type: 'game_winner',
                        gameId: '123'
                    }
                }
            ];
            
            const results = await nflApiService.autoScoreQuestions(questions);
            
            expect(results[0]).toBe('Buffalo Bills');
        });

        test('should handle player_stat_over_under question type', async () => {
            axios.get.mockResolvedValue({
                data: {
                    header: {
                        competitions: [{
                            status: { type: { completed: true } }
                        }]
                    },
                    boxscore: {
                        players: [{
                            team: { id: '1', displayName: 'KC' },
                            statistics: [{
                                name: 'passing',
                                labels: ['TD'],
                                athletes: [{
                                    athlete: {
                                        id: '123',
                                        displayName: 'Player',
                                        position: { abbreviation: 'QB' }
                                    },
                                    stats: ['3']
                                }]
                            }]
                        }]
                    }
                }
            });
            
            const questions = [
                {
                    question: 'Over 2.5 TDs?',
                    options: ['Over', 'Under'],
                    apiConfig: {
                        type: 'player_stat_over_under',
                        gameId: '123',
                        playerId: '123',
                        statName: 'TD',
                        threshold: 2.5
                    }
                }
            ];
            
            const results = await nflApiService.autoScoreQuestions(questions);
            
            expect(results[0]).toBe('Over');
        });

        test('should handle unknown apiConfig type', async () => {
            const questions = [
                {
                    question: 'Test',
                    options: ['A', 'B'],
                    apiConfig: {
                        type: 'unknown_type',
                        gameId: '123'
                    }
                }
            ];
            
            const results = await nflApiService.autoScoreQuestions(questions);
            
            expect(results[0]).toBeNull();
        });

        test('should handle API errors gracefully', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));
            
            const questions = [
                {
                    question: 'Who wins?',
                    options: ['Team A', 'Team B'],
                    apiConfig: {
                        type: 'game_winner',
                        gameId: 'invalid'
                    }
                }
            ];
            
            const results = await nflApiService.autoScoreQuestions(questions);
            
            expect(results[0]).toBeNull();
        });
    });
});
