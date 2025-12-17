import express from "express";
import { CallAutomationClient } from "@azure/communication-call-automation"; 
import { getACSToken, makeOutgoingCall } from "../services/acsService.js";
import { broadcastCallEvent } from "../app.js";

const router = express.Router();

// ---------------------------------------------------------
// RECEPTIONIST LOGIC (LIFO - Last In, First Out)
// ---------------------------------------------------------

// 1. POOL OF AGENTS
// We export this Set so app.js can clean it up via WebSocket
export const activeAgents = new Set(); 

// 2. DEDUPLICATION LOCK 
const redirectLocks = new Map();

// --- HELPER: GET NEXT AGENT ---
function getNextAvailableAgent() {
    if (activeAgents.size === 0) return null;
    
    // Convert Set to Array
    const agents = [...activeAgents];

    // 👇 FIXED LOGIC: ALWAYS PICK THE NEWEST AGENT
    // Instead of picking agents[0] (the oldest/ghost), we pick the last one.
    // This guarantees the call goes to the browser tab that just opened.
    const nextAgent = agents[agents.length - 1]; 
    
    return nextAgent;
}

// POST /api/calls/register
// (Optional fallback: Client still calls this, but WS handles the real cleanup)
router.post("/register", (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    
    // Add to pool
    activeAgents.add(userId);
    
    console.log(`✅ [HTTP] Agent Registered. Total Active: ${activeAgents.size}`);
    
    res.sendStatus(200);
});

// POST /api/calls/incoming (Azure Webhook)
router.post("/incoming", async (req, res) => {
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
        // Validation Handshake
        if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
            console.log("✅ [EventGrid] Validating subscription...");
            return res.json({ validationResponse: event.data.validationCode });
        }

        // Handle Incoming Call
        if (event.eventType === "Microsoft.Communication.IncomingCall") {
            const callerNumber = event.data.from.phoneNumber.value;
            const incomingCallContext = event.data.incomingCallContext;

            // --- 🔒 LOCK CHECK ---
            if (redirectLocks.has(callerNumber)) {
                console.warn(`⛔ [Receptionist] BLOCKED duplicate from ${callerNumber}`);
                continue; 
            }
            redirectLocks.set(callerNumber, true);
            setTimeout(() => redirectLocks.delete(callerNumber), 10000); // 10s Lock
            // ---------------------

            console.log(`📲 [Receptionist] Call from ${callerNumber}`);

            // 🎯 PICK NEXT AGENT
            const targetAgent = getNextAvailableAgent();

            if (targetAgent) {
                console.log(`🔀 [Receptionist] Routing to Agent: ${targetAgent}`);
                
                try {
                    const automationClient = new CallAutomationClient(process.env.AZURE_ACS_CONNECTION_STRING);
                    await automationClient.redirectCall(incomingCallContext, {
                        targetParticipant: { communicationUserId: targetAgent }
                    });
                } catch (redirectErr) {
                    console.error("❌ [Receptionist] Redirect failed:", redirectErr.message);
                }
            } else {
                console.warn("⚠️ [Receptionist] No active agents found. Call dropped.");
            }
        }
    }
    res.sendStatus(200);
});

// ---------------------------------------------------------
// OUTBOUND ROUTES (Preserved)
// ---------------------------------------------------------

router.get("/getToken", async (req, res) => {
  try {
    const acsData = await getACSToken();
    res.json(acsData);
  } catch (err) {
    console.error("Error in /getToken:", err);
    res.status(500).json({ error: "Failed to get ACS token" });
  }
});

router.post("/startCall", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Missing phoneNumber" });
    const callResponse = await makeOutgoingCall(phoneNumber);
    res.json({ success: true, callResponse });
  } catch (err) {
    console.error("Error in /startCall:", err);
    res.status(500).json({ error: "Failed to start call" });
  }
});

router.post("/callback", (req, res) => {
  const incomingEvents = Array.isArray(req.body) ? req.body : [req.body];
  incomingEvents.forEach((event) => {
    const eventType = event.type || event.eventType;
    if (!eventType) return;

    if (eventType.includes("CallConnected")) {
      broadcastCallEvent({ type: "connected", callId: event.callConnectionId || event.data?.callConnectionId });
    } else if (eventType.includes("CallDisconnected") || eventType.includes("CallEnded")) {
      broadcastCallEvent({ type: "ended", callId: event.callConnectionId || event.data?.callConnectionId });
    } else if (eventType.includes("ParticipantsUpdated")) {
      broadcastCallEvent({ type: "participants", data: event.participants || event.data?.participants, });
    } else if (eventType.includes("ToneReceived")) {
      broadcastCallEvent({ type: "tone", tone: event.toneInfo?.tone || event.data?.toneInfo?.tone, });
    } 
  });
  res.sendStatus(200);
});

export default router;