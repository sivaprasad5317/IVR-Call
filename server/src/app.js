const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const callRoutes = require("./routes/callRoutes");
const { getACSToken } = require("./services/acsService");
const { container } = require("./config/cosmos");
const { CommunicationIdentityClient } = require("@azure/communication-identity");

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/api/calls", callRoutes);

app.get("/api/acs/token", async (req, res) => {
  try {
    // Initialize client using connection string from .env
    const identityClient = new CommunicationIdentityClient(process.env.AZURE_ACS_CONNECTION_STRING);

    // Create a new ACS user
    const user = await identityClient.createUser();

    // Issue a token for the user (VoIP scope for calls)
    const tokenResponse = await identityClient.getToken(user, ["voip"]);

    res.json({
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
      userId: user.communicationUserId
    });
  } catch (err) {
    console.error("ACS token error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/test-cosmos", async (req, res) => {
  try {
    const { resources } = await container.items.readAll(); // removed .fetchAll()
    res.json({ count: resources.length, items: resources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
