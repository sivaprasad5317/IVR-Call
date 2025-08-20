const express = require("express");
const router = express.Router();
const callController = require("../controllers/callController");

// Save call notes
router.post("/notes", callController.saveNotes);

// Get call history
router.get("/history", callController.getHistory);

module.exports = router;