// src/components/Dialer/callClient.js

import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

let callAgent;
let deviceManager;
let callClient;
let currentCall;

export async function initCallClient(token) {
  try {
    const tokenCredential = new AzureCommunicationTokenCredential(token);
    callClient = new CallClient();
    deviceManager = await callClient.getDeviceManager();

    callAgent = await callClient.createCallAgent(tokenCredential, { displayName: "QA Tester" });

    return { callAgent, deviceManager };
  } catch (error) {
    console.error("Failed to initialize Call Client:", error);
    throw error;
  }
}

export function startCall(phoneNumber) {
  if (!callAgent) throw new Error("Call Agent not initialized");

  currentCall = callAgent.startCall([{ phoneNumber }]);
  
  currentCall.on("stateChanged", () => {
    console.log("Call state:", currentCall.state);
  });

  return currentCall;
}

export function hangUpCall() {
  if (currentCall) {
    currentCall.hangUp({ forEveryone: true });
    currentCall = null;
  }
}

export function toggleMute() {
  if (currentCall) {
    if (currentCall.isMuted) {
      currentCall.unmute().catch((err) => console.error("Unmute failed:", err));
    } else {
      currentCall.mute().catch((err) => console.error("Mute failed:", err));
    }
  }
}
