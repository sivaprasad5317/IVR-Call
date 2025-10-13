// server/src/app.js
/**
 * Explicit dotenv load from the server folder so environment variables
 * are available before any route modules are imported.
 *
 * This version resolves the .env path explicitly (server/.env),
 * logs whether required COSMOS_* vars are present, then proceeds.
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Resolve __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from server root (one level up from src)
const explicitEnvPath = path.resolve(__dirname, "..", ".env");
const envResult = dotenv.config({ path: explicitEnvPath });

if (envResult.error) {
  console.warn("dotenv.config() error (explicit path):", envResult.error.message);
} else {
  console.log(`[dotenv] loaded from ${explicitEnvPath}`);
}

// Quick diagnostic prints to confirm presence of expected variables
console.log("===== Server startup =====");
console.log("COSMOS_ENDPOINT present?", !!process.env.COSMOS_ENDPOINT);
console.log("COSMOS_KEY present?", !!process.env.COSMOS_KEY);
console.log("COSMOS_DATABASE:", process.env.COSMOS_DATABASE);
console.log("COSMOS_CONTAINER:", process.env.COSMOS_CONTAINER);

import express from "express";
import cors from "cors";
import callRoutes from "./routes/callRoutes.js";
import contactsRoutes from "./routes/contacts.js";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();

// basic middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE"],
  })
);

// WebSocket setup
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
    console.error("WebSocket error:", err && err.message ? err.message : err);
  });
});

export const broadcastCallEvent = (event) => {
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(JSON.stringify(event));
      } catch (err) {
        console.warn("Failed to send to client:", err && err.message ? err.message : err);
      }
    }
  });
};

// Routes
// mount routes AFTER dotenv load so contacts.js will see process.env correctly
app.use("/api/calls", callRoutes);
app.use("/api", contactsRoutes);

// health check
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
