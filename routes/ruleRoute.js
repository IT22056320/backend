const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const {
  toggleRuleStatus,
  createRule,
  getRules,
  updateRule,
  deleteRule,
} = require("../controllers/ruleController.js");

// Routes
router.post("/", upload.none(), createRule);
router.get("/", upload.none(), getRules);
router.put("/:id", upload.none(), updateRule);
router.delete("/:id", upload.none(), deleteRule);
router.put("/toggleStatus/:id", toggleRuleStatus);

module.exports = router;
