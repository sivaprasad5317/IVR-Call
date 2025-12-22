// client/src/services/audioMixer.js

let audioContext = null;
let mediaStreamDestination = null;
let micSource = null;
let keepAliveOscillator = null;
let hiddenAudioSink = null;
let micStreamReference = null;

/**
 * Initialize the Audio Mixer (Context + Mic + Destination)
 */
export const initAudioMixer = async () => {
  console.log("🎛️ [Mixer] initAudioMixer() called.");

  // 1. Return existing stream if active (Prevents duplicate inits)
  if (mediaStreamDestination && mediaStreamDestination.stream.active && audioContext && audioContext.state !== 'closed') {
    if (audioContext.state === "suspended") await audioContext.resume();
    console.log("ℹ️ [Mixer] Stream already active. Reusing.");
    return mediaStreamDestination.stream;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContextClass();

  if (audioContext.state === "suspended") {
      await audioContext.resume();
  }
  
  console.log(`🎛️ [Mixer] AudioContext Created. Rate: ${audioContext.sampleRate} Hz`);

  mediaStreamDestination = audioContext.createMediaStreamDestination();
  mediaStreamDestination.channelCount = 1; 

  // 2. Keep-Alive Oscillator (Prevents audio dropout)
  keepAliveOscillator = audioContext.createOscillator();
  const silentGain = audioContext.createGain();
  keepAliveOscillator.type = 'sine';
  keepAliveOscillator.frequency.value = 10; 
  silentGain.gain.value = 0.001; 
  keepAliveOscillator.connect(silentGain);
  silentGain.connect(mediaStreamDestination);
  keepAliveOscillator.start();

  // 3. Microphone Setup (Optimized for IVR)
  try {
    const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
            deviceId: "default", 
            channelCount: 1, 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
        } 
    });
    
    micStreamReference = micStream;
    const micTrack = micStream.getAudioTracks()[0];
    console.log("🎤 [Mixer] Mic Attached:", micTrack.label);

    micSource = audioContext.createMediaStreamSource(micStream);

    // Boost Mic Volume (1.5x) so IVR hears you clearly
    const micGain = audioContext.createGain();
    micGain.gain.value = 1.5; 

    micSource.connect(micGain);
    micGain.connect(mediaStreamDestination);
    
    console.log("✅ [Mixer] Microphone connected & boosted.");

  } catch (err) {
    console.error("❌ [Mixer] Mic capture failed:", err);
    throw err;
  }

  // 4. Hidden Sink (Chrome Hack)
  if (!hiddenAudioSink) {
    hiddenAudioSink = document.createElement("audio");
    hiddenAudioSink.style.display = "none";
    document.body.appendChild(hiddenAudioSink);
  }
  hiddenAudioSink.srcObject = mediaStreamDestination.stream;
  hiddenAudioSink.volume = 0; 
  hiddenAudioSink.play().catch(e => console.warn("⚠️ [Mixer] Sink blocked:", e));

  return mediaStreamDestination.stream;
};

/**
 * Injects TTS Audio into the active stream
 */
export const injectAudioBuffer = async (audioData) => {
  // 👇 FIX: Auto-Recover if context is dead
  if (!audioContext || audioContext.state === 'closed') {
      console.warn("⚠️ [Mixer] Context was closed. Re-initializing now...");
      await initAudioMixer();
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  try {
    const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));
    
    const ttsSource = audioContext.createBufferSource();
    ttsSource.buffer = audioBuffer;

    const boostGain = audioContext.createGain();
    boostGain.gain.value = 2.0; // Boost TTS volume

    // Route TTS to ACS (Call)
    ttsSource.connect(boostGain);
    boostGain.connect(mediaStreamDestination);

    // Route TTS to Speakers (Monitor)
    ttsSource.connect(audioContext.destination); 

    ttsSource.start(0);
    console.log(`▶️ [Mixer] Playback Started...`);

    return new Promise((resolve) => {
      ttsSource.onended = () => {
          console.log("✅ [Mixer] Playback Finished.");
          resolve();
      };
    });
  } catch (err) {
    console.error("❌ [Mixer] Injection Error:", err);
  }
};

/**
 * Cleanup Function
 * 👇 FIX: Made Safe. Does NOT destroy the context/mic anymore.
 */
export const stopInjection = () => {
    // We intentionally DO NOT close the AudioContext here.
    // Why? Because the Microphone is using it for the active call.
    // If we close it, the user goes mute.
    console.log("ℹ️ [Mixer] stopInjection called (No-op to protect Mic stream).");
    
    // Only close if you specifically want to end the call (handled by page refresh usually)
};