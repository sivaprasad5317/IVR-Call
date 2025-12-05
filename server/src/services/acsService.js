// server/src/acsService.js
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { CallAutomationClient } from "@azure/communication-call-automation";
import dotenv from "dotenv";

// Load env vars (failsafe if called outside app.js context)
dotenv.config();

const ACS_CONNECTION_STRING = process.env.AZURE_ACS_CONNECTION_STRING;
// Ensure this phone number is in E.164 format (e.g., +18885551234)
const ACS_PHONE_NUMBER = process.env.ACS_PHONE_NUMBER; 
const PUBLIC_CALLBACK_URL = process.env.PUBLIC_CALLBACK_URL; // Your ngrok or deployed URL

if (!ACS_CONNECTION_STRING) {
  throw new Error("AZURE_ACS_CONNECTION_STRING is missing in environment variables.");
}

// 1. Identity Client (For Frontend Tokens)
const identityClient = new CommunicationIdentityClient(ACS_CONNECTION_STRING);

// 2. Automation Client (For Server-Managed Calls)
const automationClient = new CallAutomationClient(ACS_CONNECTION_STRING);

/**
 * Generate ACS user + token for the Frontend.
 * The frontend uses this token to initialize the CallClient locally.
 */
export const getACSToken = async () => {
  try {
    // Create a new identity
    const user = await identityClient.createUser();
    
    // Issue a token with VoIP permissions
    const tokenResponse = await identityClient.getToken(user, ["voip"]);
    
    return {
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
      userId: user.communicationUserId,
    };
  } catch (err) {
    console.error("Error generating ACS token:", err);
    throw err;
  }
};

/**
 * Make an outgoing PSTN call via Server (Call Automation).
 * NOTE: Your React app handles calls client-side mostly. 
 * This is only if you want the SERVER to initiate the call.
 */
export const makeOutgoingCall = async (toNumber) => {
  try {
    if (!ACS_PHONE_NUMBER || !PUBLIC_CALLBACK_URL) {
      throw new Error("ACS_PHONE_NUMBER or PUBLIC_CALLBACK_URL is missing");
    }

    // 1. Define the target (Callee)
    const target = { phoneNumber: toNumber };

    // 2. Define the options (Caller ID)
    const callOptions = {
      sourceCallIdNumber: { phoneNumber: ACS_PHONE_NUMBER },
    };

    // 3. Create the call
    // Syntax: createCall(target, callbackUrl, options)
    const callResult = await automationClient.createCall(
      target, 
      `${PUBLIC_CALLBACK_URL}/api/calls/callback`, 
      callOptions
    );

    console.log("📞 Server-initiated call started. CallConnectionId:", callResult.callConnectionProperties.callConnectionId);
    return callResult;
  } catch (err) {
    console.error("Error starting PSTN call via server:", err);
    throw err;
  }
};