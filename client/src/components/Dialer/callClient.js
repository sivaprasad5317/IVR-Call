// callClient.js
import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

let callClient;
let callAgent;
let currentCall;
let isMuted = false;

export const initCallClient = async (token, userId) => {
  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callClient = new CallClient();
  callAgent = await callClient.createCallAgent(tokenCredential, { displayName: userId });
  console.log("✅ Call Agent initialized");
};

export const makePSTNCall = async (calleeNumber, callerACSNumber) => {
  if (!callAgent) throw new Error("Call Agent not initialized");
  currentCall = callAgent.startCall(
    [{ phoneNumber: calleeNumber }],
    { alternateCallerId: { phoneNumber: callerACSNumber } }
  );
  console.log("📞 Call started to:", calleeNumber);
  return currentCall;
};

export const hangUpCall = () => {
  if (currentCall) {
    currentCall.hangUp({ forEveryone: true });
    currentCall = null;
    console.log("✋ Call ended");
  }
};

export const toggleMute = () => {
  if (currentCall) {
    if (!isMuted) {
      currentCall.mute();
      isMuted = true;
      console.log("🔇 Muted");
    } else {
      currentCall.unmute();
      isMuted = false;
      console.log("🎙️ Unmuted");
    }
  }
};
