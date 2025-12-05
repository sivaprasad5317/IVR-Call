import express from "express";
import { getACSToken, makeOutgoingCall } from "../services/acsService.js";
import { broadcastCallEvent } from "../app.js";

const router = express.Router();

// GET /api/calls/getToken
router.get("/getToken", async (req, res) => {
  try {
    const acsData = await getACSToken();
    res.json(acsData);
  } catch (err) {
    console.error("Error in /getToken:", err);
    res.status(500).json({ error: "Failed to get ACS token" });
  }
});

// POST /api/calls/startCall (Server-side dialing)
router.post("/startCall", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Missing phoneNumber" });
    }
    const callResponse = await makeOutgoingCall(phoneNumber);
    res.json({ success: true, callResponse });
  } catch (err) {
    console.error("Error in /startCall:", err);
    res.status(500).json({ error: "Failed to start call" });
  }
});

// POST /api/calls/callback (Azure Webhook)
router.post("/callback", (req, res) => {
  // Azure sends an array of CloudEvents, or sometimes a single object.
  const incomingEvents = Array.isArray(req.body) ? req.body : [req.body];

  incomingEvents.forEach((event) => {
    // Log the event type for debugging
    console.log(`📩 ACS Event: ${event.type || event.eventType}`);

    // Normalize event type (Azure sends "Microsoft.Communication.CallConnected", etc.)
    const eventType = event.type || event.eventType;

    if (!eventType) return;

    if (eventType.includes("CallConnected")) {
      broadcastCallEvent({
        type: "connected",
        callId: event.callConnectionId || event.data?.callConnectionId,
      });
    } 
    else if (eventType.includes("CallDisconnected") || eventType.includes("CallEnded")) {
      broadcastCallEvent({
        type: "ended",
        callId: event.callConnectionId || event.data?.callConnectionId,
      });
    } 
    else if (eventType.includes("ParticipantsUpdated")) {
      broadcastCallEvent({
        type: "participants",
        data: event.participants || event.data?.participants,
      });
    } 
    else if (eventType.includes("ToneReceived")) {
      // This only fires if the SERVER initiated the call and subscribed to tones
      broadcastCallEvent({
        type: "tone",
        tone: event.toneInfo?.tone || event.data?.toneInfo?.tone,
      });
    } 
    else {
      // console.log("⚠️ Unhandled event type:", eventType);
    }
  });

  // Always return 200 OK to Azure immediately
  res.sendStatus(200);
});

export default router;