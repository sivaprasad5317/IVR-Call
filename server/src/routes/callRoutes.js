import express from "express";
import { getACSToken, makeOutgoingCall } from "../services/acsService.js";

const router = express.Router();

// Frontend requests ACS token
router.get("/getToken", async (req, res) => {
  try {
    const acsData = await getACSToken();
    res.json(acsData);
  } catch (err) {
    res.status(500).json({ error: "Failed to get ACS token" });
  }
});

// Make PSTN call
router.post("/startCall", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Missing phoneNumber" });
    }
    const callResponse = await makeOutgoingCall(phoneNumber);
    res.json({ success: true, callResponse });
  } catch (err) {
    res.status(500).json({ error: "Failed to start call" });
  }
});

// ACS callback webhook
router.post("/callback", (req, res) => {
  console.log("📩 ACS Callback:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

export default router;
