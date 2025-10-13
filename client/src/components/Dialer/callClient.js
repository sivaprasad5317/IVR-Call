import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

let callClient = null;
let callAgent = null;
let currentCall = null;
let isMuted = false;

const connectedCallbacks = new Set();
const disconnectedCallbacks = new Set();

/**
 * Initialize ACS CallClient + CallAgent
 */
export const initCallClient = async (token, userId) => {
  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callClient = new CallClient();
  callAgent = await callClient.createCallAgent(tokenCredential, {
    displayName: userId,
  });
  console.log("✅ Call Agent initialized");
};

/**
 * Start a PSTN outbound call
 */
export const makePSTNCall = async (
  calleeNumber,
  callerACSNumber,
  onConnected,
  onDisconnected
) => {
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
        if (typeof currentCall.off === "function")
          currentCall.off("stateChanged", stateChangedHandler);
        currentCall = null;
      }
    } catch (err) {
      console.warn("Error in stateChanged handler", err);
    }
  };

  if (currentCall && typeof currentCall.on === "function") {
    currentCall.on("stateChanged", stateChangedHandler);
  }

  if (typeof onConnected === "function") connectedCallbacks.add(onConnected);
  if (typeof onDisconnected === "function")
    disconnectedCallbacks.add(onDisconnected);

  return () => {
    if (typeof onConnected === "function") connectedCallbacks.delete(onConnected);
    if (typeof onDisconnected === "function")
      disconnectedCallbacks.delete(onDisconnected);
  };
};

/**
 * Hang up current call
 */
export const hangUpCall = async () => {
  try {
    if (currentCall && typeof currentCall.hangUp === "function") {
      await currentCall.hangUp({ forEveryone: true });
      console.log("📴 Call ended");
    } else {
      console.warn("No active call to hang up");
    }
    currentCall = null;
  } catch (err) {
    console.error("hangUpCall error:", err);
  }
};

/**
 * Toggle mute / unmute
 */
export const toggleMute = async () => {
  if (!currentCall) return;
  try {
    if (isMuted) {
      await currentCall.unmute();
      isMuted = false;
      console.log("🎤 Unmuted");
    } else {
      await currentCall.mute();
      isMuted = true;
      console.log("🔇 Muted");
    }
  } catch (err) {
    console.warn("toggleMute error:", err);
  }
};

/**
 * Register callbacks for connected/disconnected events
 */
export const onCallEvents = (onConnected, onDisconnected) => {
  if (typeof onConnected === "function") connectedCallbacks.add(onConnected);
  if (typeof onDisconnected === "function") disconnectedCallbacks.add(onDisconnected);

  return () => {
    if (typeof onConnected === "function") connectedCallbacks.delete(onConnected);
    if (typeof onDisconnected === "function") disconnectedCallbacks.delete(onDisconnected);
  };
};

export const getCurrentCall = () => currentCall;
export const getIsMuted = () => isMuted;

/**
 * Send DTMF tones during active call
 */
export const sendDTMF = async (digits = "") => {
  if (!currentCall) throw new Error("No active call to send DTMF");
  if (!digits) return;

  const mapCharToTone = (c) => {
    switch (c) {
      case "0": return "Num0";
      case "1": return "Num1";
      case "2": return "Num2";
      case "3": return "Num3";
      case "4": return "Num4";
      case "5": return "Num5";
      case "6": return "Num6";
      case "7": return "Num7";
      case "8": return "Num8";
      case "9": return "Num9";
      case "*": return "Star";
      case "#": return "Pound";
      case "A": case "a": return "A";
      case "B": case "b": return "B";
      case "C": case "c": return "C";
      case "D": case "d": return "D";
      default: return null;
    }
  };

  for (const ch of digits) {
    const tone = mapCharToTone(ch);
    if (!tone) continue;
    try {
      if (typeof currentCall.sendDtmf === "function") {
        await currentCall.sendDtmf(tone);
        console.log(`📟 Sent DTMF tone: ${ch} -> ${tone}`);
      } else {
        console.warn("currentCall.sendDtmf not available, consider server fallback");
      }
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error("Error sending DTMF tone", ch, err);
    }
  }
};
