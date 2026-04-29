const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
    userId: {
        type: String, 
        required: false
    },
    totalBudget: {
        type: Number,
        required: true
    },
    guestCount: {
        type: Number,
        required: true
    },
    locationType: {
        type: String,
        required: true
    },
    plan: {
        categories: [
            {
                category: String,
                amount: Number,
                 tip: String
            }
        ],
       summary: String
    },
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Budget', BudgetSchema);