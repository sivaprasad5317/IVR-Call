import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

let callClient = null;
let callAgent = null;
let currentCall = null;
let isMuted = false;
let incomingCall = null; 

const connectedCallbacks = new Set();
const disconnectedCallbacks = new Set();
const incomingCallCallbacks = new Set();

/**
 * Initialize ACS CallClient + CallAgent + Incoming Listener
 */
export const initCallClient = async (token, userId) => {
  if (callAgent) return; 

  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callClient = new CallClient();

  // Initialize Device Manager explicitly (helps with permission warm-up)
  try {
    const deviceManager = await callClient.getDeviceManager();
    await deviceManager.askDevicePermission({ audio: true });
  } catch (e) {
    console.warn("Device permission check during init:", e);
  }

  callAgent = await callClient.createCallAgent(tokenCredential, {
    displayName: userId,
  });
  
  // Listen for Incoming Calls
  callAgent.on('incomingCall', (args) => {
    const call = args.incomingCall;
    console.log("📲 Incoming call from:", call.callerInfo.phoneNumber);
    incomingCall = call;
    incomingCallCallbacks.forEach(cb => cb(call));
    
    // Handle if the caller hangs up before we answer
    call.on('callEnded', () => {
        incomingCall = null;
        incomingCallCallbacks.forEach(cb => cb(null)); // notify UI to hide popup
    });
  });

  console.log("✅ Call Agent initialized & Listening for calls");
};

/**
 * Make an Outbound Call
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

  subscribeToCallEvents(currentCall, onConnected, onDisconnected);
};

/**
 * Accept an Incoming Call
 */
export const acceptIncomingCall = async (onConnected, onDisconnected) => {
  if (!incomingCall) return;

  currentCall = await incomingCall.accept();
  console.log("✅ Incoming call accepted");
  
  subscribeToCallEvents(currentCall, onConnected, onDisconnected);
  incomingCall = null; // Clear the request
};

/**
 * Reject/Ignore Incoming Call
 */
export const rejectIncomingCall = async () => {
    if (incomingCall) {
        await incomingCall.reject();
        incomingCall = null;
    }
}

/**
 * Helper: Centralize event subscription for both Inbound/Outbound
 */
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
            if (call.off) call.off("stateChanged", stateChangedHandler);
            currentCall = null;
          }
        } catch (err) {
          console.warn("Error in stateChanged handler", err);
        }
      };
    
      call.on("stateChanged", stateChangedHandler);
      
      // Force check immediately in case it's already connected
      if (call.state === "Connected") stateChangedHandler();
}

export const hangUpCall = async () => {
  try {
    if (currentCall) {
      await currentCall.hangUp({ forEveryone: true });
    }
    // Incoming calls that are ringing but not accepted yet
    if (incomingCall) {
        await incomingCall.reject();
        incomingCall = null;
    }
  } catch (err) {
    console.error("hangUpCall error:", err);
  }
};

export const toggleMute = async () => {
  if (!currentCall) return;
  if (isMuted) {
    await currentCall.unmute();
    isMuted = false;
  } else {
    await currentCall.mute();
    isMuted = true;
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

export const getCurrentCall = () => currentCall;
export const getIsMuted = () => isMuted;

// ---------------------------------------------------------
// FIXED sendDTMF FUNCTION (Removed broken 'Features' check)
// ---------------------------------------------------------
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
            // METHOD 1: Try the Robust "Long Press" Simulation (400ms)
            // This fixes the issue with Legacy IVRs
            if (currentCall.startDtmfTone && currentCall.stopDtmfTone) {
                console.log(`Pushing DTMF ${tone} (Long Press)...`);
                await currentCall.startDtmfTone(tone);
                
                // Wait 400ms
                await new Promise(r => setTimeout(r, 200));
                
                await currentCall.stopDtmfTone();
            } 
            // METHOD 2: Fallback to standard sendDtmf
            else if (currentCall.sendDtmf) {
                console.log(`Sending Standard DTMF ${tone}...`);
                await currentCall.sendDtmf(tone);
            }
        } catch (err) {
            console.error("DTMF Error:", err);
        }
        
        // Small pause between digits
        await new Promise(r => setTimeout(r, 200));
    }
};