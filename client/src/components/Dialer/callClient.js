import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

let callClient = null;
let callAgent = null;
let currentCall = null;
let isMuted = false;

const connectedCallbacks = new Set();
const disconnectedCallbacks = new Set();

export const initCallClient = async (token, userId) => {
  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callClient = new CallClient();
  callAgent = await callClient.createCallAgent(tokenCredential, {
    displayName: userId,
  });
  console.log("✅ Call Agent initialized");
};

export const makePSTNCall = async (calleeNumber, callerACSNumber, onConnected, onDisconnected) => {
  if (!callAgent) throw new Error("Call Agent not initialized");

  currentCall = callAgent.startCall([{ phoneNumber: calleeNumber }], {
    alternateCallerId: { phoneNumber: callerACSNumber },
  });
  console.log("📞 Call started:", calleeNumber);

  const stateChangedHandler = () => {
    try {
      const state = currentCall.state;
      console.log("🔄 Call state:", state);
      if (state === "Connected") {
        onConnected?.();
        connectedCallbacks.forEach((cb) => cb());
      } else if (state === "Disconnected") {
        onDisconnected?.();
        disconnectedCallbacks.forEach((cb) => cb());
        // remove handler if API supports it
        if (typeof currentCall.off === "function") currentCall.off("stateChanged", stateChangedHandler);
        currentCall = null;
      }
    } catch (err) {
      console.warn("Error in stateChanged handler", err);
    }
  };

  currentCall.on("stateChanged", stateChangedHandler);

  return currentCall;
};

export const hangUpCall = () => {
  if (currentCall) {
    try {
      currentCall.hangUp({ forEveryone: true });
    } catch (err) {
      console.warn("hangUp failed", err);
    }
    currentCall = null;
  }
};

export const toggleMute = async () => {
  if (!currentCall) return;
  try {
    if (isMuted) {
      await currentCall.unmute();
      isMuted = false;
    } else {
      await currentCall.mute();
      isMuted = true;
    }
  } catch (err) {
    console.warn("toggleMute error", err);
  }
};

export const onCallEvents = (onConnected, onDisconnected) => {
  if (typeof onConnected === "function") connectedCallbacks.add(onConnected);
  if (typeof onDisconnected === "function") disconnectedCallbacks.add(onDisconnected);

  // If currentCall exists, don't call callbacks here — the stateChanged handler will invoke them.

  // Return unsubscribe function
  return () => {
    if (typeof onConnected === "function") connectedCallbacks.delete(onConnected);
    if (typeof onDisconnected === "function") disconnectedCallbacks.delete(onDisconnected);
  };
};

export const getCurrentCall = () => currentCall;
export const getIsMuted = () => isMuted;
