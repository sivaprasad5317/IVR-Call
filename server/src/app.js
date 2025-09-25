import express from "express";
import cors from "cors";
import callRoutes from "./routes/callRoutes.js";
import contactsRoutes from "./routes/contacts.js";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
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
});

export const broadcastCallEvent = (event) => {
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(event));
    }
  });
};

// Routes
// 👇 mount under `/api/calls` so it matches callbackUri
app.use("/api/calls", callRoutes);
app.use("/api", contactsRoutes);

server.listen(process.env.PORT || 4000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 4000}`);
});
