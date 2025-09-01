import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { getACSToken, verifyACSConnection } from './services/acsService.js';
import callRoutes from './routes/callRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Middleware
app.use(async (req, res, next) => {
  if (req.path.includes('/api/acs')) {
    const isConnected = await verifyACSConnection();
    if (!isConnected) {
      return res.status(503).json({ error: "Azure Communication Services unavailable" });
    }
  }
  next();
});

// Routes
app.use("/api", callRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
