let audioContext = null;
let mediaStreamDestination = null;
let micSource = null;
let keepAliveOscillator = null;
let hiddenAudioSink = null;

export const initAudioMixer = async () => {
  console.log("🎛️ [Mixer] initAudioMixer() called.");

  if (mediaStreamDestination && mediaStreamDestination.stream.active) {
    console.log("ℹ️ [Mixer] Stream already active. Returning existing stream.");
    return mediaStreamDestination.stream;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  
  // ---------------------------------------------------------
  // FIX: REMOVE FORCED SAMPLE RATE
  // Let the browser pick the native hardware rate (e.g. 44100 or 48000)
  // This prevents resampling glitches on the microphone input.
  // ---------------------------------------------------------
  audioContext = new AudioContextClass(); 
  
  console.log(`🎛️ [Mixer] AudioContext Created.`);
  console.log(`📊 [Mixer] Native Sample Rate: ${audioContext.sampleRate} Hz`);
  console.log(`📊 [Mixer] State: ${audioContext.state}`);

  mediaStreamDestination = audioContext.createMediaStreamDestination();
  mediaStreamDestination.channelCount = 1; // Mono is still best for phone

  // Keep Alive Oscillator
  keepAliveOscillator = audioContext.createOscillator();
  const silentGain = audioContext.createGain();
  keepAliveOscillator.type = 'sine';
  keepAliveOscillator.frequency.value = 10; 
  silentGain.gain.value = 0.001; 
  keepAliveOscillator.connect(silentGain);
  silentGain.connect(mediaStreamDestination);
  keepAliveOscillator.start();
  console.log("🎛️ [Mixer] Keep-Alive signal started.");

  try {
    const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
            deviceId: "default", 
            channelCount: 1, 
            // Removed forced sampleRate - let the hardware decide
            echoCancellation: false, 
            noiseSuppression: false, 
            autoGainControl: false 
        } 
    });
    
    const micTrack = micStream.getAudioTracks()[0];
    const micSettings = micTrack.getSettings();
    console.log("🎤 [Mixer] Microphone Attached:", micTrack.label);
    console.log(`🎤 [Mixer] Mic Rate: ${micSettings.sampleRate} Hz`);

    micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(mediaStreamDestination);
  } catch (err) {
    console.error("❌ [Mixer] Mic capture failed:", err);
    throw err;
  }

  // Hidden Sink
  if (!hiddenAudioSink) {
    hiddenAudioSink = document.createElement("audio");
    hiddenAudioSink.style.display = "none";
    document.body.appendChild(hiddenAudioSink);
  }
  hiddenAudioSink.srcObject = mediaStreamDestination.stream;
  hiddenAudioSink.volume = 0; 
  
  hiddenAudioSink.play()
    .then(() => console.log("🎛️ [Mixer] Hidden Sink playing."))
    .catch(e => console.warn("⚠️ [Mixer] Hidden Sink blocked:", e));

  return mediaStreamDestination.stream;
};

export const injectAudioBuffer = async (audioData) => {
  if (!audioContext) throw new Error("Mixer not init");

  console.log(`🔊 [Mixer] Request to inject ${audioData.byteLength} bytes.`);

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  try {
    // 1. Decode Audio
    // The browser will automatically resample the 16k Robot Voice 
    // to match the 44.1k/48k Context. This is safe.
    const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));
    
    console.log(`📉 [Mixer] Audio Ready for Playback:`);
    console.log(`   - Duration: ${audioBuffer.duration.toFixed(2)}s`);
    console.log(`   - Context Rate: ${audioContext.sampleRate} Hz`);

    const ttsSource = audioContext.createBufferSource();
    ttsSource.buffer = audioBuffer;

    const boostGain = audioContext.createGain();
    boostGain.gain.value = 2.0; 

    ttsSource.connect(boostGain);
    boostGain.connect(mediaStreamDestination);
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

export const stopInjection = () => {};