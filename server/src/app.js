import express from "express";
import cors from "cors";
import callRoutes from "./routes/callRoutes.js";
import contactsRoutes from "./routes/contacts.js";

const app = express();
app.use(express.json());

// Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:5173", // your Vite frontend
  methods: ["GET","POST", "DELETE"]
}));

// Prefix routes to match frontend
app.use("/api/acs", callRoutes);    // GET /api/acs/getToken
app.use("/api/calls", callRoutes);  // POST /api/calls/startCall
app.use("/api", contactsRoutes); // GET and POST /api/contacts

app.listen(4000, () => console.log("Server running on port 4000"));
