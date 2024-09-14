const Rule = require("../models/Rules.js");

// Helper function to generate RuleID
const generateRuleID = async () => {
  const count = await Rule.countDocuments(); // Count the existing rules
  const ruleID = `Rule${String(count + 1).padStart(3, "0")}`; // Generate ID like Rule001, Rule002, etc.
  return ruleID;
}; 

// Create a new rule
const createRule = async (req, res) => {
  const { ruleName, description, condition, threshold, status } = req.body;
  try {
    const ruleID = await generateRuleID(); // Generate RuleID
    const newRule = new Rule({ ruleID, ruleName, description, condition, threshold, status });
    await newRule.save();
    res.status(201).send({
      success: true,
      message: "Rule Created successfully!",
      newRule,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Creating Rule!",
    });
  }
};

// Toggle rule status (active/inactive)
const toggleRuleStatus = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    rule.status = rule.status === "active" ? "inactive" : "active";
    await rule.save();
    res.json(rule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all rules or filter by ruleName
const getRules = async (req, res) => {
  const { searchTerm } = req.query; // Extract the searchTerm from the query parameters
  try {
    let query = {};

    if (searchTerm) {
      // Create a query that searches for either ruleID or ruleName
      query = {
        $or: [
          { ruleName: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search
          { ruleID: { $regex: searchTerm, $options: "i" } },
        ],
      };
    }

    const rules = await Rule.find(query);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get single Rule


// Update a rule
const updateRule = async (req, res) => {
  const { ruleName, description, condition, threshold, status } = req.body;
  try {
    const updatedRule = await Rule.findByIdAndUpdate(
      req.params.id,
      { ruleName, description, condition, threshold, status },
      { new: true } // Return the updated document
    );
    res.json(updatedRule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a rule
const deleteRule = async (req, res) => {
  try {
    await Rule.findByIdAndDelete(req.params.id);
    res.json({ message: "Rule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRule, toggleRuleStatus, getRules, updateRule, deleteRule };
