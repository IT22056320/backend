const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true
    },
    loc: Number,
    lloc: Number,
    sloc: Number,
    comments: Number,
    commentPercentage: String,
    codeToCommentRatio: String,
    cyclomaticComplexity: Number,
    maintainabilityIndex: Number,
    status: { 
        type: String, 
        enum: ['pending', 'analyzed', 'failed'], 
        default: 'analyzed' 
    },
    errorDetails: String,
    language: { 
        type: String, 
        default: 'JavaScript' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
}, {timestamps: true});

const Analyzer = new mongoose.model("Analyzer", codeSchema);

module.exports = Analyzer;