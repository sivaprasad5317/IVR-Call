import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

let callClient = null;
let callAgent = null;
let currentCall = null;
let incomingCall = null; 
let isMuted = false;

const connectedCallbacks = new Set();
const disconnectedCallbacks = new Set();
const incomingCallCallbacks = new Set();
const muteStateCallbacks = new Set(); 

export const initCallClient = async (token, userId) => {
  if (callAgent) return; 

  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callClient = new CallClient();

  try {
    const deviceManager = await callClient.getDeviceManager();
    await deviceManager.askDevicePermission({ audio: true });
  } catch (e) {
    console.warn("Device permission check during init:", e);
  }

  callAgent = await callClient.createCallAgent(tokenCredential, {
    displayName: userId,
  });
  
  callAgent.on('incomingCall', (args) => {
    const call = args.incomingCall;
    console.log("📲 Incoming call from:", call.callerInfo.phoneNumber);
    incomingCall = call;
    incomingCallCallbacks.forEach(cb => cb(call));
    
    call.on('callEnded', () => {
        incomingCall = null;
        incomingCallCallbacks.forEach(cb => cb(null)); 
    });
  });

  console.log("✅ Call Agent initialized & Listening for calls");
};

export const makePSTNCall = async (calleeNumber, callerACSNumber, onConnected, onDisconnected) => {
  if (!callAgent) throw new Error("Call Agent not initialized");

  currentCall = callAgent.startCall([{ phoneNumber: calleeNumber }], {
    alternateCallerId: { phoneNumber: callerACSNumber },
  });
  console.log("📞 Call started:", calleeNumber);

  subscribeToCallEvents(currentCall, onConnected, onDisconnected);
};

export const acceptIncomingCall = async (onConnected, onDisconnected) => {
  if (!incomingCall) return;
  currentCall = await incomingCall.accept();
  console.log("✅ Incoming call accepted");
  subscribeToCallEvents(currentCall, onConnected, onDisconnected);
  incomingCall = null; 
};

export const rejectIncomingCall = async () => {
    if (incomingCall) {
        await incomingCall.reject();
        incomingCall = null;
    }
}

const subscribeToCallEvents = (call, onConnected, onDisconnected) => {
    const stateChangedHandler = () => {
        try {
          console.log("🔄 Call state:", call.state);
          if (call.state === "Connected") {
            onConnected?.();
            connectedCallbacks.forEach((cb) => cb());
          } else if (call.state === "Disconnected") {
            onDisconnected?.();
            disconnectedCallbacks.forEach((cb) => cb());
            
            if (call.off) {
                call.off("stateChanged", stateChangedHandler);
                call.off("isMutedChanged", muteChangedHandler);
            }
            currentCall = null;
            isMuted = false;
            muteStateCallbacks.forEach(cb => cb(false));
          }
        } catch (err) {
          console.warn("Error in stateChanged handler", err);
        }
    };
    
    // Mute State Handler (Source of Truth)
    const muteChangedHandler = () => {
        isMuted = call.isMuted;
        // LOGGING ACTUAL EVENT FROM AZURE
        console.log(`🎤 EVENT: SDK reports isMuted is now: [${isMuted}]`);
        muteStateCallbacks.forEach(cb => cb(isMuted));
    };

    call.on("stateChanged", stateChangedHandler);
    call.on("isMutedChanged", muteChangedHandler);
      
    if (call.state === "Connected") stateChangedHandler();
}

export const hangUpCall = async () => {
  try {
    if (currentCall) await currentCall.hangUp({ forEveryone: true });
    if (incomingCall) {
        await incomingCall.reject();
        incomingCall = null;
    }
  } catch (err) {
    console.error("hangUpCall error:", err);
  }
};

// ---------------------------------------------------------
// TOGGLE MUTE WITH LOGS
// ---------------------------------------------------------
export const toggleMute = async () => {
  if (!currentCall) {
      console.warn("⚠️ Cannot toggle mute: No active call.");
      return;
  }
  
  try {
    // Check actual state before toggling
    const currentlyMuted = currentCall.isMuted;
    
    console.log(`🔘 Action: User clicked toggle. Current SDK State: [${currentlyMuted ? "MUTED" : "UNMUTED"}]`);

    if (currentlyMuted) {
        console.log("➡️ Requesting UNMUTE...");
        await currentCall.unmute();
    } else {
        console.log("➡️ Requesting MUTE...");
        await currentCall.mute();
    }
  } catch (err) {
      console.warn("❌ Toggle mute failed:", err);
  }
};

export const onCallEvents = (onConnected, onDisconnected) => {
  if (onConnected) connectedCallbacks.add(onConnected);
  if (onDisconnected) disconnectedCallbacks.add(onDisconnected);
  return () => {
    if (onConnected) connectedCallbacks.delete(onConnected);
    if (onDisconnected) disconnectedCallbacks.delete(onDisconnected);
  };
};

export const onIncomingCall = (callback) => {
    incomingCallCallbacks.add(callback);
    return () => incomingCallCallbacks.delete(callback);
}

export const onMuteChange = (callback) => {
    muteStateCallbacks.add(callback);
    return () => muteStateCallbacks.delete(callback);
}

export const getCurrentCall = () => currentCall;
export const getIsMuted = () => isMuted;

export const sendDTMF = async (digits) => {
    if (!currentCall) return; 
    
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
            default: return null;
          }
    };

    for (const ch of digits) {
        const tone = mapCharToTone(ch);
        if (!tone) continue;
        try {
            if (currentCall.startDtmfTone && currentCall.stopDtmfTone) {
                await currentCall.startDtmfTone(tone);
                await new Promise(r => setTimeout(r, 1200)); 
                await currentCall.stopDtmfTone();
            } else if (currentCall.sendDtmf) {
                await currentCall.sendDtmf(tone);
            }
        } catch (err) {
             console.error("DTMF Error", err);
        }
        await new Promise(r => setTimeout(r, 500));
    }
};