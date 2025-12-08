import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import axios from "axios";

// Helper to get token from OUR backend (not Azure directly)
const getAuthToken = async () => {
  // Uses the same API base URL logic as your other services
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const response = await axios.get(`${API_URL}/api/speech/token`);
  return response.data; // { token, region }
};

/**
 * Converts text to an AudioBuffer using Azure Neural TTS.
 */
export const synthesizeTextToAudio = async (text) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Get Secure Token from Backend
      const { token, region } = await getAuthToken();

      // 2. Configure SDK with Token (NOT Key)
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      
      // Use a Neural voice (High quality)
      speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural"; 

      // 3. Synthesize
      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            resolve(result.audioData);
          } else {
            reject(new Error("Speech synthesis failed: " + result.errorDetails));
          }
          synthesizer.close();
        },
        (err) => {
          reject(err);
          synthesizer.close();
        }
      );
    } catch (err) {
      reject(new Error("Failed to initialize speech: " + err.message));
    }
  });
};