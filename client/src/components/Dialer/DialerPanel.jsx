import React, { useState, useEffect, useRef } from "react";
import NumberInput from "./NumberInput";
import CallStatus from "./CallStatus";
import DialPad from "./DialPad";
import CallControls from "./CallControls";
import { useCallManager } from "../../hooks/useCallManager";
import { useCallTimer } from "../../hooks/useCallTimer";

// 👇 CORRECT PATH for your project
import { sendDTMF } from "../../components/Dialer/callClient"; 

export default function DialerPanel({ phone, setPhone }) {
  const [dtmfLog, setDtmfLog] = useState("");
  
  // Ref for audio context to play the "Click" sound
  const audioContextRef = useRef(null);

  const { 
      status, calling, muted, startCall, endCall, toggleMuteCall, 
      incomingCaller, acceptCall, rejectCall 
  } = useCallManager();
  
  const { duration } = useCallTimer(status);

  useEffect(() => {
    if (status === "idle") setDtmfLog("");
  }, [status]);

  // ---------------------------------------------------------
  // SAFE UI SOUND: Short "Blip" only.
  // This is NOT a DTMF tone, so the IVR will ignore it even 
  // if the microphone picks it up.
  // ---------------------------------------------------------
  const playSafeClick = () => {
    try {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
        }
        
        // Resume context if suspended (browser requirement)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();

        // 800Hz is a pleasant "High C" beep, distinct from DTMF
        osc.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
        osc.type = "sine";

        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);

        // Low volume (5%) so it doesn't bleed into the mic too much
        gain.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
        // Fade out quickly (0.1s)
        gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);

        osc.start(audioContextRef.current.currentTime);
        osc.stop(audioContextRef.current.currentTime + 0.1);
    } catch (e) {
        console.warn("Audio feedback failed", e);
    }
  };

  const handleDigitPress = (digit) => {
    // 1. Play the safe click for the User
    playSafeClick();

    // 2. Send the digital signal for the IVR
    if (status === "connected" || status === "calling") {
      sendDTMF(digit);
      setDtmfLog((prev) => prev + digit);
    } else {
      setPhone((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    // Optional: Play a different "delete" click
    playSafeClick(); 
    
    if (status === "connected" || status === "calling") {
        setDtmfLog(prev => prev.slice(0, -1));
    } else {
        setPhone(p => p.slice(0, -1));
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 relative">
      
      {/* INCOMING CALL MODAL */}
      {incomingCaller && (
          <div className="absolute inset-0 bg-black bg-opacity-80 rounded-xl flex flex-col items-center justify-center z-50 text-white animate-pulse">
              <p className="mb-4 text-lg">Incoming Call...</p>
              <h2 className="text-2xl font-bold mb-6">{incomingCaller}</h2>
              <div className="flex gap-4">
                  <button onClick={acceptCall} className="bg-green-500 p-4 rounded-full">Answer</button>
                  <button onClick={rejectCall} className="bg-red-500 p-4 rounded-full">Reject</button>
              </div>
          </div>
      )}

      {status === "idle" ? (
        <NumberInput phone={phone} setPhone={setPhone} />
      ) : (
        <CallStatus 
          phone={phone} 
          status={status} 
          duration={duration} 
          dtmfLog={dtmfLog} 
        />
      )}

      <DialPad onDigit={handleDigitPress} />

      <CallControls
        phone={phone}
        calling={calling}
        muted={muted}
        onCall={() => calling ? endCall() : startCall(phone)}
        onMute={toggleMuteCall}
        onBackspace={handleBackspace}
      />
    </div>
  );
}