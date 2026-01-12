/**
 * Script to initialize mock data for local development
 * Creates sample users, questions, and fantasy data
 * Run with: node scripts/initMockData.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Information = require('../models/Information');
const NFLPlayer = require('../models/NFLPlayer');
const PlayerLineup = require('../models/PlayerLineup');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/playoff_picks';

// ⚠️ WARNING: These passwords are for LOCAL DEVELOPMENT ONLY!
// NEVER use these credentials in production or shared environments.
// These are intentionally simple for testing purposes.
const mockUsers = [
    { username: 'admin', password: 'admin123', admin: true, scores: [10, 8, 12, 9] },
    { username: 'user1', password: 'password123', admin: false, scores: [8, 7, 10, 6] },
    { username: 'user2', password: 'password123', admin: false, scores: [9, 9, 11, 8] },
    { username: 'testuser', password: 'test123', admin: false, scores: [7, 6, 9, 7] }
];

const mockQuestions = [
    {
        weekNumber: 1,
        currentWeek: false,
        editsAllowed: false,
        questionEditsAllowed: [false, false, false],
        options: [
            {
                question: 'Which team will win the Super Bowl?',
                type: 'radio',
                options: ['Kansas City Chiefs', 'San Francisco 49ers', 'Baltimore Ravens', 'Buffalo Bills'],
                apiConfig: {
                    type: 'championship',
                    league: 'nfl',
                    season: 2024
                }
            },
            {
                question: 'Who will win AFC Championship?',
                type: 'radio',
                options: ['Kansas City Chiefs', 'Baltimore Ravens', 'Buffalo Bills', 'Cincinnati Bengals'],
                apiConfig: {
                    type: 'conference',
                    conference: 'AFC',
                    season: 2024
                }
            },
            {
                question: 'Who will win NFC Championship?',
                type: 'radio',
                options: ['San Francisco 49ers', 'Dallas Cowboys', 'Philadelphia Eagles', 'Detroit Lions'],
                apiConfig: {
                    type: 'conference',
                    conference: 'NFC',
                    season: 2024
                }
            }
        ],
        correctAnswers: ['Kansas City Chiefs', 'Kansas City Chiefs', 'San Francisco 49ers'],
        responses: []
    },
    {
        weekNumber: 2,
        currentWeek: true,
        editsAllowed: true,
        questionEditsAllowed: [true, true, true],
        options: [
            {
                question: 'Which team will score the most points in Week 2?',
                type: 'radio',
                options: ['Miami Dolphins', 'Buffalo Bills', 'Dallas Cowboys', 'San Francisco 49ers']
            },
            {
                question: 'Which quarterback will throw the most touchdowns?',
                type: 'radio',
                options: ['Patrick Mahomes', 'Josh Allen', 'Lamar Jackson', 'Jalen Hurts']
            },
            {
                question: 'Which team will have the best record after Week 2?',
                type: 'radio',
                options: ['Kansas City Chiefs', 'Philadelphia Eagles', 'Buffalo Bills', 'San Francisco 49ers']
            }
        ],
        correctAnswers: [],
        responses: []
    }
];

const mockNFLPlayers = [
    { espn_id: '3139477', name: 'Patrick Mahomes', position: 'QB' },
    { espn_id: '3918298', name: 'Josh Allen', position: 'QB' },
    { espn_id: '3916387', name: 'Lamar Jackson', position: 'QB' },
    { espn_id: '4241479', name: 'Christian McCaffrey', position: 'RB' },
    { espn_id: '4035687', name: 'Derrick Henry', position: 'RB' },
    { espn_id: '4040715', name: 'Josh Jacobs', position: 'RB' },
    { espn_id: '4361370', name: 'Justin Jefferson', position: 'WR' },
    { espn_id: '4361741', name: 'Tyreek Hill', position: 'WR' },
    { espn_id: '4036378', name: 'Travis Kelce', position: 'TE' },
    { espn_id: '3042519', name: 'Harrison Butker', position: 'PK' },
    { espn_id: 'KC_DEF', name: 'Kansas City Chiefs', position: 'DEF' }
];

async function initMockData() {
    try {
        console.log('Connecting to MongoDB at:', MONGODB_URL);
        await mongoose.connect(MONGODB_URL);
        console.log('Connected to MongoDB successfully');

        // Clear existing data
        console.log('\nClearing existing data...');
        await User.deleteMany({});
        await Information.deleteMany({});
        await NFLPlayer.deleteMany({});
        await PlayerLineup.deleteMany({});
        console.log('Existing data cleared');

        // Create users with plaintext passwords (model will hash them)
        console.log('\nCreating mock users...');
        const createdUsers = [];
        for (const userData of mockUsers) {
            const user = new User({
                username: userData.username,
                password: userData.password,  // Model's pre-save hook will hash this
                admin: userData.admin,
                scores: userData.scores
            });
            await user.save();
            createdUsers.push(user);
            console.log(`Created user: ${user.username} (${user.admin ? 'admin' : 'regular user'})`);
        }

        // Create questions
        console.log('\nCreating mock questions...');
        for (const questionData of mockQuestions) {
            // Add some mock responses for week 1 from created users
            if (questionData.weekNumber === 1) {
                questionData.responses = createdUsers.slice(0, 3).map((user, index) => ({
                    users_id: user._id,
                    response: [
                        questionData.options[0].options[index % 4],
                        questionData.options[1].options[index % 4],
                        questionData.options[2].options[index % 4]
                    ],
                    date: new Date(Date.now() - (3 - index) * 24 * 60 * 60 * 1000) // Stagger dates
                }));
            }
            
            const question = new Information(questionData);
            await question.save();
            console.log(`Created question set for week ${questionData.weekNumber} (current: ${questionData.currentWeek})`);
        }

        // Create NFL players
        console.log('\nCreating mock NFL players...');
        for (const playerData of mockNFLPlayers) {
            const player = new NFLPlayer(playerData);
            await player.save();
            console.log(`Created NFL player: ${player.name} (${player.position})`);
        }

        // Create sample fantasy lineup for one user
        console.log('\nCreating sample fantasy lineup...');
        const sampleLineup = new PlayerLineup({
            userId: createdUsers[1]._id, // user1
            weekNumber: 2,
            lineup: {
                QB: 'Patrick Mahomes',
                RB1: 'Christian McCaffrey',
                RB2: 'Derrick Henry',
                WR1: 'Justin Jefferson',
                WR2: 'Tyreek Hill',
                TE: 'Travis Kelce',
                FLEX: 'Josh Jacobs',  // Different RB in FLEX position
                PK: 'Harrison Butker',
                DEF: 'Kansas City Chiefs'
            },
            totalPoints: 0,
            submittedAt: new Date()
        });
        await sampleLineup.save();
        console.log(`Created fantasy lineup for user: ${createdUsers[1].username}`);

        console.log('\n✅ Mock data initialization completed successfully!');
        console.log('\nSummary:');
        console.log(`- Users created: ${createdUsers.length}`);
        console.log(`  - Admin: admin / admin123`);
        console.log(`  - Regular users: user1, user2, testuser / password123 (or test123 for testuser)`);
        console.log(`- Question sets: ${mockQuestions.length}`);
        console.log(`- NFL players: ${mockNFLPlayers.length}`);
        console.log(`- Fantasy lineups: 1`);

    } catch (error) {
        console.error('\n❌ Mock data initialization failed.');
        
        // Provide more specific error context to help with debugging
        if (error instanceof mongoose.Error.ValidationError) {
            console.error('Validation error while creating mock data:', error.message);
            if (error.errors) {
                Object.keys(error.errors).forEach((field) => {
                    console.error(`  - ${field}: ${error.errors[field].message}`);
                });
            }
        } else if (error.name === 'MongoNetworkError' || 
                   error.name === 'MongooseServerSelectionError' || 
                   error.name === 'MongoServerError') {
            console.error('Database connection or server error:', error.message);
            console.error('Please verify MongoDB is running and MONGODB_URL is correct.');
        } else {
            console.error('Unexpected error:', error.message || error);
        }
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the initialization
initMockData();
