import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

let callClient, callAgent, currentCall, isMuted = false;

export const initCallClient = async (token, userId) => {
  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callClient = new CallClient();
  callAgent = await callClient.createCallAgent(tokenCredential, { displayName: userId });
  console.log("✅ Call Agent initialized");
};

export const makePSTNCall = async (calleeNumber, callerACSNumber) => {
  if (!callAgent) throw new Error("Call Agent not initialized");
  currentCall = callAgent.startCall([{ phoneNumber: calleeNumber }], { alternateCallerId: { phoneNumber: callerACSNumber } });
  console.log("📞 Call started:", calleeNumber);
  return currentCall;
};

export const hangUpCall = () => { if (currentCall) { currentCall.hangUp({ forEveryone: true }); currentCall = null; } };
export const toggleMute = () => { if (currentCall) { isMuted ? currentCall.unmute() : currentCall.mute(); isMuted = !isMuted; } };
