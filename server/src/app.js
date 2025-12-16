// server/src/app.js

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import speechRoutes from "./routes/speech.js";
import callRoutes from "./routes/callRoutes.js";
import contactsRoutes from "./routes/contacts.js";

// ------------------- Environment Setup -------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from server root (one level up from src)
const explicitEnvPath = path.resolve(__dirname, "..", ".env");
const envResult = dotenv.config({ path: explicitEnvPath });

if (envResult.error) {
  // In production (Azure App Service), .env file might not exist.
  // Variables are loaded from the Platform Configuration instead.
  console.log("ℹ️ .env file not found (using system environment variables)");
} else {
  console.log(`✅ [dotenv] loaded from ${explicitEnvPath}`);
}

// Diagnostic: Confirm critical variables
const requiredVars = [
  "AZURE_ACS_CONNECTION_STRING"
  // Add "COSMOS_ENDPOINT", "COSMOS_KEY", etc. if you are using them in prod
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

// 🔒 CORS CONFIGURATION (Critical for Production)
app.use(
  cors({
    origin: [
      "http://localhost:5173",          // Local Dev
      "http://127.0.0.1:5173",          // Local Dev IP
      "https://lemon-island-04d32840f.1.azurestaticapps.net" // 👈 YOUR PRODUCTION CLIENT
    ],
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
app.use("/api/calls", callRoutes); 
app.use("/api", contactsRoutes);   
app.use("/api/speech", speechRoutes); 

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// ------------------- Start Server -------------------
// Azure App Service automatically sets process.env.PORT
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 Health check: /health`);
});