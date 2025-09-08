import express from "express";
import { getACSToken, startCall } from "../services/acsService.js";

const router = express.Router();

// GET /api/acs/getToken
router.get("/getToken", async (req, res) => {
  try {
    const tokenResponse = await getACSToken();
    res.json(tokenResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calls/startCall
router.post("/startCall", async (req, res) => {
  try {
    const { phoneNumber, callerACSNumber } = req.body;
    const callResponse = await startCall(phoneNumber, callerACSNumber);
    res.json(callResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACS Callback (can be on same router)
router.post("/callbacks/acs", (req, res) => {
  console.log("📩 ACS Callback Event:", req.body);
  res.sendStatus(200);
});

export default router;
