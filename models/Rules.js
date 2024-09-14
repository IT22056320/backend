const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  ruleID: {
    type: String,
    required: true,
    unique: true, // Ensures each ruleID is unique
  },
  ruleName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true, // User entered text
  },
  condition: {
    type: String,
    required: true,
  },
  threshold: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active", // Default status
  },
});

module.exports = mongoose.model('Rule', ruleSchema);
