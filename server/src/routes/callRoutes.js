import express from 'express';
import * as callController from '../controllers/callController.js';
import { getACSToken } from '../services/acsService.js';

const router = express.Router();

// ACS Token endpoint
router.get("/acs/token", async (req, res) => {
  try {
    const tokenData = await getACSToken();
    res.json(tokenData);
  } catch (error) {
    console.error("ACS Token Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save call notes
router.post("/notes", async (req, res) => {
  try {
    const { callId, notes } = req.body;
    // Add your notes saving logic here
    res.json({ success: true, callId, notes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get call history
router.get("/history", async (req, res) => {
  try {
    const history = await callController.getHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initiate call
router.post("/calls", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    res.json({
      status: 'initiated',
      callId: Date.now().toString(),
      phoneNumber
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;