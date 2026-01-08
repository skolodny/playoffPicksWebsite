const mongoose = require('mongoose');

/**
 * PlayerLineup schema for fantasy football lineups
 * Each user submits a lineup per week with position requirements:
 * - 1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX (RB/WR/TE), 1 K, 1 DEF
 * Note: Stores player names (not IDs) for all positions
 */
const PlayerLineupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekNumber: { type: Number, required: true },
    lineup: {
        QB: { type: String, required: true },      // Player Name
        RB1: { type: String, required: true },     // Player Name
        RB2: { type: String, required: true },     // Player Name
        WR1: { type: String, required: true },     // Player Name
        WR2: { type: String, required: true },     // Player Name
        TE: { type: String, required: true },      // Player Name
        FLEX: { type: String, required: true },    // Player Name (RB/WR/TE)
        PK: { type: String, required: true },       // Player Name (Kicker)
        DEF: { type: String, required: true }      // Team Name (Defense)
    },
    totalPoints: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now }
});

// Compound index to ensure one lineup per user per week
PlayerLineupSchema.index({ userId: 1, weekNumber: 1 }, { unique: true });

const PlayerLineup = mongoose.model('PlayerLineup', PlayerLineupSchema);

module.exports = PlayerLineup;
