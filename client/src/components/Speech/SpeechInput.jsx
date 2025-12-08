import React, { useState } from 'react';
import { synthesizeTextToAudio } from '../../services/azureSpeechService';
import { injectAudioBuffer, stopInjection } from '../../services/audioMixer';
import { useCallManager } from "../../hooks/useCallManager";
import { activateVirtualAudio } from "../../components/Dialer/callClient";

export default function SpeechInput() {
  const [speechText, setSpeechText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { status } = useCallManager();
  const isConnected = status === "connected";

  const handleSendSpeech = async () => {
    console.log("🟦 [UI] 'Inject Speech' button clicked.");
    
    if (!speechText.trim()) {
        console.warn("⚠️ [UI] Speech text is empty.");
        return;
    }
    if (!isConnected) {
        console.warn("⚠️ [UI] Call is NOT connected. Status:", status);
        return;
    }

    try {
      setIsProcessing(true);
      stopInjection(); 

      console.log("🟦 [UI] Step 1: Requesting Audio Switch...");
      const switchResult = await activateVirtualAudio();
      console.log("🟦 [UI] Audio Switch Result:", switchResult);

      console.log("🟦 [UI] Step 2: Requesting Azure TTS...");
      const audioData = await synthesizeTextToAudio(speechText);
      console.log(`🟦 [UI] Audio Data Received. Size: ${audioData.byteLength} bytes`);

      console.log("🟦 [UI] Step 3: Sending to Audio Mixer...");
      await injectAudioBuffer(audioData);
      console.log("🟦 [UI] Injection Sequence Complete.");

      setSpeechText(''); 
    } catch (err) {
      console.error("❌ [UI] Injection Failed:", err);
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">IVR Speech Injection</h2>
        <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {isConnected ? "Ready" : "No Call"}
        </span>
      </div>
      
      <textarea
        value={speechText}
        onChange={(e) => setSpeechText(e.target.value)}
        placeholder="Type phrase..."
        rows={3}
        disabled={isProcessing || !isConnected}
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 mb-4 resize-none disabled:bg-gray-50"
      />
      
      <button
        onClick={handleSendSpeech}
        disabled={!speechText.trim() || isProcessing || !isConnected}
        className={`w-full py-2 rounded font-semibold transition flex items-center justify-center gap-2 ${
          speechText.trim() && !isProcessing && isConnected
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isProcessing ? "Processing..." : "Inject Speech"}
      </button>
    </div>
  );
}