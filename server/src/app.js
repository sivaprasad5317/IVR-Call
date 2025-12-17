import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import speechRoutes from "./routes/speech.js";
import contactsRoutes from "./routes/contacts.js";

// 👇 IMPORT callRoutes AND activeAgents (The Shared List)
import callRoutes, { activeAgents } from "./routes/callRoutes.js"; 

// ------------------- Environment Setup -------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const explicitEnvPath = path.resolve(__dirname, "..", ".env");
const envResult = dotenv.config({ path: explicitEnvPath });

if (envResult.error) {
  console.log("ℹ️ .env file not found (using system environment variables)");
} else {
  console.log(`✅ [dotenv] loaded from ${explicitEnvPath}`);
}

const requiredVars = ["AZURE_ACS_CONNECTION_STRING"];
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
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://lemon-island-04d32840f.1.azurestaticapps.net" 
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true
  })
);

// ------------------- WebSocket Setup -------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
let clients = []; // Generic UI clients

wss.on("connection", (ws) => {
  // console.log("🔌 WebSocket client connected");
  clients.push(ws);
  let currentUserId = null; // Track ID for THIS connection

  ws.on("message", (message) => {
    try {
        const data = JSON.parse(message);
        
        // 👇 HANDLE REGISTRATION (Add "Real" Agent)
        if (data.type === 'REGISTER') {
            currentUserId = data.userId;
            if (activeAgents) {
                activeAgents.add(currentUserId);
                console.log(`✅ [WS] Agent Registered: ${currentUserId}. Total Active: ${activeAgents.size}`);
            }
        }
    } catch (e) {
        console.error("WS Parse Error", e);
    }
  });

  // 👇 HANDLE DISCONNECT (Remove "Ghost" Agent)
  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
    
    if (currentUserId && activeAgents) {
        activeAgents.delete(currentUserId); 
        console.log(`🧹 [WS] Cleanup: Removed ${currentUserId}. Total Active: ${activeAgents.size}`);
    }
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
    if (client.readyState === 1) { 
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
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 Health check: /health`);
});