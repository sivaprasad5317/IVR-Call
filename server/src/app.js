import express from "express";
import cors from "cors";
import callRoutes from "./routes/callRoutes.js";
import contactsRoutes from "./routes/contacts.js"; // keep your contacts routes

const app = express();
app.use(express.json());

// Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:5173", // your Vite frontend
  methods: ["GET", "POST", "DELETE"]
}));

// ----------------- Mount routes -----------------
app.use("/api/acs", callRoutes);      // GET /api/acs/getToken, POST /api/acs/make-call
app.use("/api", contactsRoutes);      // GET/POST /api/contacts

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on port ${process.env.PORT || 4000}`);
});
