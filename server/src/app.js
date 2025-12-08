// server/src/app.js

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import speechRoutes from "./routes/speech.js";
// Import Routes
import callRoutes from "./routes/callRoutes.js";
import contactsRoutes from "./routes/contacts.js";

// ------------------- Environment Setup -------------------
// Resolve __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from server root (one level up from src)
const explicitEnvPath = path.resolve(__dirname, "..", ".env");
const envResult = dotenv.config({ path: explicitEnvPath });

if (envResult.error) {
  console.warn("⚠️ dotenv config warning:", envResult.error.message);
} else {
  console.log(`✅ [dotenv] loaded from ${explicitEnvPath}`);
}

// Diagnostic: Confirm critical variables
const requiredVars = [
  "COSMOS_ENDPOINT", 
  "COSMOS_KEY", 
  "COSMOS_DATABASE", 
  "AZURE_ACS_CONNECTION_STRING"
];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars.join(", "));
} else {
  console.log("✅ All critical environment variables present.");
}

// ------------------- Express Setup -------------------
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Allow Vite frontend
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true
  })
);

// ------------------- WebSocket Setup -------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
let clients = [];

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");
  clients.push(ws);

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
    console.log("❌ WebSocket client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err?.message || err);
  });
});

/**
 * Broadcast event to all connected UI clients.
 * Useful for updating the frontend if the server receives a webhook from Azure.
 */
export const broadcastCallEvent = (event) => {
  clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      try {
        client.send(JSON.stringify(event));
      } catch (err) {
        console.warn("Failed to send to client:", err);
      }
    }
  });
};

// ------------------- Routes -------------------
// Mount routes
app.use("/api/calls", callRoutes); // Handles /getToken, /startCall, /callback
app.use("/api", contactsRoutes);   // Handles /contacts
app.use("/api/speech", speechRoutes);  // Handles speech token

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
});