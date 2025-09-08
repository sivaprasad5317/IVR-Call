import { CommunicationIdentityClient } from "@azure/communication-identity";
import dotenv from "dotenv";
dotenv.config();

export const startCall = async (phoneNumber) => {
  // For trial purposes, just return mock call data
  return {
    id: Date.now().toString(),
    status: "started",
    participants: [phoneNumber],
  };
};

export const verifyACSConnection = async () => {
  try {
    const client = new CommunicationIdentityClient(process.env.AZURE_ACS_CONNECTION_STRING);
    await client.createUser();
    console.log("✅ ACS Connection successful");
    return true;
  } catch (error) {
    console.error("❌ ACS Connection failed:", error.message);
    return false;
  }
};

export const getACSToken = async () => {
  try {
    const client = new CommunicationIdentityClient(process.env.AZURE_ACS_CONNECTION_STRING);
    const user = await client.createUser();
    const tokenResponse = await client.getToken(user, ["voip"]);
    return {
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
      userId: user.communicationUserId,
    };
  } catch (error) {
    console.error("ACS Token Generation Error:", error);
    throw error;
  }
};
