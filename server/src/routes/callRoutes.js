import express from "express";
import { getACSToken, makeOutgoingCall } from "../services/acsService.js";
import { broadcastCallEvent } from "../app.js";

const router = express.Router();

router.get("/getToken", async (req, res) => {
  try {
    const acsData = await getACSToken();
    res.json(acsData);
  } catch (err) {
    res.status(500).json({ error: "Failed to get ACS token" });
  }
});

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

router.post("/callback", (req, res) => {
  const event = req.body;
  console.log("📩 ACS Callback:", JSON.stringify(event, null, 2));

  switch (event.eventType) {
    case "CallConnected":
      broadcastCallEvent({
        type: "connected",
        callId: event.callConnectionId,
      });
      break;

    case "CallDisconnected":
    case "CallEnded":
      broadcastCallEvent({
        type: "ended",
        callId: event.callConnectionId,
      });
      break;

    case "ParticipantsUpdated":
      broadcastCallEvent({
        type: "participants",
        data: event.participants,
      });
      break;

    case "ToneReceived":
      broadcastCallEvent({
        type: "tone",
        tone: event.toneInfo?.tone,
      });
      break;

    default:
      console.log("⚠️ Unhandled event:", event.eventType);
  }

  res.sendStatus(200);
});

export default router;
