const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const callRoutes = require("./routes/callRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/api/calls", callRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});