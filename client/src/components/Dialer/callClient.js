import { CallClient, LocalAudioStream } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { initAudioMixer } from "../../services/audioMixer";

let callClient = null;
let callAgent = null;
let currentCall = null;
let incomingCall = null; 
let isMuted = false;

// Store our virtual stream globally
let globalVirtualStream = null;

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

  console.log("✅ Call Agent initialized");
};

/**
 * Make PSTN Call (Start WITH Mixer)
 */
export const makePSTNCall = async (calleeNumber, callerACSNumber, onConnected, onDisconnected) => {
  if (!callAgent) throw new Error("Call Agent not initialized");

  console.log("🎛️ Initializing Audio Mixer...");
  
  // 1. Prepare the Mixer Stream BEFORE the call starts
  try {
    const mixedStream = await initAudioMixer();
    globalVirtualStream = new LocalAudioStream(mixedStream);
    console.log("✅ Mixer Stream Ready for Call");
  } catch (err) {
    console.error("❌ Audio Mixer failed (Falling back to Default Mic):", err);
    globalVirtualStream = null;
  }

  // 2. Build Call Options
  const callOptions = {
    alternateCallerId: { phoneNumber: callerACSNumber }
  };
  
  // 3. Attach Virtual Stream immediately (This avoids the crash later)
  if (globalVirtualStream) {
    callOptions.audioOptions = {
      muted: false,
      inputAudioStreams: [globalVirtualStream] 
    };
  }

  console.log("📞 Starting Call...");
  currentCall = callAgent.startCall([{ phoneNumber: calleeNumber }], callOptions);

  subscribeToCallEvents(currentCall, onConnected, onDisconnected);
};

export const acceptIncomingCall = async (onConnected, onDisconnected) => {
  if (!incomingCall) return;

  console.log("🎛️ Initializing Audio Mixer (Incoming)...");
  let acceptOptions = {};
  try {
    const mixedStream = await initAudioMixer();
    globalVirtualStream = new LocalAudioStream(mixedStream);
    acceptOptions = {
      audioOptions: { muted: false, inputAudioStreams: [globalVirtualStream] }
    };
  } catch (err) {}

  currentCall = await incomingCall.accept(acceptOptions);
  subscribeToCallEvents(currentCall, onConnected, onDisconnected);
  incomingCall = null; 
};

// ---------------------------------------------------------
// ACTIVATE VIRTUAL AUDIO (Safe Mode)
// ---------------------------------------------------------
export const activateVirtualAudio = async () => {
    console.log("🔁 [CallClient] activateVirtualAudio() called.");

    if (!currentCall) {
        console.error("❌ [CallClient] No active call.");
        return false;
    }

    // If we started with the virtual stream, WE ARE GOOD.
    // We simply return 'true' to let the UI know it can proceed.
    // We DO NOT call stopAudio/startAudio because that crashes the SDK.
    if (globalVirtualStream) {
        console.log("✅ [CallClient] Virtual Stream is active and running.");
        return true;
    }

    // Fallback: If for some reason we are on the default mic, fail gracefully
    console.error("❌ [CallClient] Call started without Virtual Stream. Cannot inject.");
    return false;
};

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
    
    const muteChangedHandler = () => {
        isMuted = call.isMuted;
        console.log(`🎤 EVENT: SDK reports isMuted is now: [${isMuted}]`);
        muteStateCallbacks.forEach(cb => cb(isMuted));
    };

    call.on("stateChanged", stateChangedHandler);
    call.on("isMutedChanged", muteChangedHandler);
      
    if (call.state === "Connected") stateChangedHandler();
}

export const hangUpCall = async () => {
  if (currentCall) await currentCall.hangUp({ forEveryone: true });
  if (incomingCall) { await incomingCall.reject(); incomingCall = null; }
};

export const toggleMute = async () => {
  if (!currentCall) return;
  try {
    currentCall.isMuted ? await currentCall.unmute() : await currentCall.mute();
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

export const onIncomingCall = (cb) => { incomingCallCallbacks.add(cb); return () => incomingCallCallbacks.delete(cb); };
export const onMuteChange = (cb) => { muteStateCallbacks.add(cb); return () => muteStateCallbacks.delete(cb); };
export const getCurrentCall = () => currentCall;
export const getIsMuted = () => isMuted;

// DTMF Logic
export const sendDTMF = async (digits) => {
    if (!currentCall) return; 
    const mapCharToTone = (c) => { 
        switch (c) {
            case "0": return "Num0"; case "1": return "Num1"; case "2": return "Num2";
            case "3": return "Num3"; case "4": return "Num4"; case "5": return "Num5";
            case "6": return "Num6"; case "7": return "Num7"; case "8": return "Num8";
            case "9": return "Num9"; case "*": return "Star"; case "#": return "Pound";
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
        } catch (err) {}
        await new Promise(r => setTimeout(r, 500));
    }
};

export const rejectIncomingCall = async () => {
    if (incomingCall) {
        await incomingCall.reject();
        incomingCall = null;
    }
};