import express from "express";
import dotenv from "dotenv";
import callRoutes from "./routes/callRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());

// Routes
app.use("/api/calls", callRoutes);

app.get("/", (req, res) => {
  res.send("✅ Server is up and running!");
});

export default app;
