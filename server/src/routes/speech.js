import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/token", async (req, res) => {
  const speechKey = process.env.VITE_SPEECH_KEY;
  const speechRegion = process.env.VITE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    return res.status(500).json({ error: "Server missing Speech Key/Region" });
  }

  const headers = { 
    "Ocp-Apim-Subscription-Key": speechKey,
    "Content-Type": "application/x-www-form-urlencoded"
  };

  try {
    // Azure API to exchange Key for a Token (valid for 10 mins)
    const tokenResponse = await axios.post(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, 
      null, 
      { headers }
    );
    
    res.json({ 
      token: tokenResponse.data, 
      region: speechRegion 
    });
  } catch (err) {
    console.error("Token Fetch Error:", err.response?.data || err.message);
    res.status(401).json({ error: "Failed to authorize speech key" });
  }
});

export default router;