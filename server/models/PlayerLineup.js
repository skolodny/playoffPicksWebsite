const mongoose = require('mongoose');

/**
 * PlayerLineup schema for fantasy football lineups
 * Each user submits a lineup per week with position requirements:
 * - 1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX (RB/WR/TE), 1 K, 1 DEF
 */
const PlayerLineupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekNumber: { type: Number, required: true },
    lineup: {
        QB: { type: String, required: true },      // Player ID
        RB1: { type: String, required: true },     // Player ID
        RB2: { type: String, required: true },     // Player ID
        WR1: { type: String, required: true },     // Player ID
        WR2: { type: String, required: true },     // Player ID
        TE: { type: String, required: true },      // Player ID
        FLEX: { type: String, required: true },    // Player ID (RB/WR/TE)
        PK: { type: String, required: true },       // Player ID (Kicker)
        DEF: { type: String, required: true }      // Team ID (Defense)
    },
    totalPoints: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now }
});

// Compound index to ensure one lineup per user per week
PlayerLineupSchema.index({ userId: 1, weekNumber: 1 }, { unique: true });

const PlayerLineup = mongoose.model('PlayerLineup', PlayerLineupSchema);

module.exports = PlayerLineup;
