import { CommunicationIdentityClient } from "@azure/communication-identity";
import { CallAutomationClient } from "@azure/communication-call-automation";
import dotenv from "dotenv";
dotenv.config();

const ACS_CONNECTION_STRING = process.env.AZURE_ACS_CONNECTION_STRING;
const ACS_PHONE_NUMBER = process.env.ACS_PHONE_NUMBER;
const PUBLIC_CALLBACK_URL = process.env.PUBLIC_CALLBACK_URL;

const identityClient = new CommunicationIdentityClient(ACS_CONNECTION_STRING);
const callClient = new CallAutomationClient(ACS_CONNECTION_STRING);

/**
 * Generate ACS user + token for frontend
 */
export const getACSToken = async () => {
  try {
    const user = await identityClient.createUser();
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
 * Make an outgoing PSTN call
 */
export const makeOutgoingCall = async (toNumber) => {
  try {
    const callResult = await callClient.createCall({
      source: { phoneNumber: ACS_PHONE_NUMBER },
      targets: [{ phoneNumber: toNumber }],
      // 👇 now aligned with app.js router
      callbackUri: `${PUBLIC_CALLBACK_URL}/api/calls/callback`,
      requestedModalities: ["audio"],
    });

    console.log("📞 Call started:", callResult.callConnectionId);
    return callResult;
  } catch (err) {
    console.error("Error starting PSTN call:", err);
    throw err;
  }
};
