const mongoose = require('mongoose');

const InformationSchema = new mongoose.Schema({
    options: [{
        question: { type: mongoose.Schema.Types.String },
        type: { type: mongoose.Schema.Types.String },
        options: { type: mongoose.Schema.Types.Array },
        apiConfig: { type: mongoose.Schema.Types.Mixed } // API configuration for auto-scoring
    }],
    weekNumber: { type: mongoose.Schema.Types.Int32, unique: true },
    correctAnswers: { type: mongoose.Schema.Types.Array },
    responses: [{
        users_id: { type: mongoose.Schema.Types.ObjectId },
        response: { type: mongoose.Schema.Types.Array },
        date: { type: mongoose.Schema.Types.Date }
    }],
    editsAllowed: { type: mongoose.Schema.Types.Boolean },
    currentWeek: { type: mongoose.Schema.Types.Boolean }
});

const Information = mongoose.model('Information', InformationSchema);

module.exports = Information;
