const mongoose = require('mongoose');

const NFLPlayerSchema = new mongoose.Schema({
    espn_id: {
        type: String,
        required: true,
        unique: true
    },
    position: {
        type: String,
        required: true
    },
    name: String
});

module.exports = mongoose.model('NFLPlayer', NFLPlayerSchema, 'nfl_players');
