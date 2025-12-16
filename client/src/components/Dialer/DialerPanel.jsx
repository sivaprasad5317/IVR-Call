import React, { useState, useEffect, useRef } from "react";
import NumberInput from "./NumberInput";
import CallStatus from "./CallStatus";
import DialPad from "./DialPad";
import CallControls from "./CallControls";
import { useCallManager } from "../../hooks/useCallManager";
import { useCallTimer } from "../../hooks/useCallTimer";
import { sendDTMF } from "../../components/Dialer/callClient"; 

export default function DialerPanel({ phone, setPhone }) {
  const [dtmfLog, setDtmfLog] = useState("");
  const audioContextRef = useRef(null);

  const { 
      status, 
      calling, 
      muted, 
      activePhoneNumber, // 👈 NEW: Grab the active number (Incoming or Outgoing)
      startCall, 
      endCall, 
      toggleMuteCall
  } = useCallManager();
  
  const { duration } = useCallTimer(status);

  useEffect(() => {
    if (status === "idle") setDtmfLog("");
  }, [status]);

  // ---------------------------------------------------------
  // SAFE UI SOUND (Preserved)
  // ---------------------------------------------------------
  const playSafeClick = () => {
    try {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        osc.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        gain.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
        osc.start(audioContextRef.current.currentTime);
        osc.stop(audioContextRef.current.currentTime + 0.1);
    } catch (e) {
        console.warn("Audio feedback failed", e);
    }
  };

  const handleDigitPress = (digit) => {
    playSafeClick();
    // Send DTMF if in a call, otherwise type the number
    if (status === "connected" || status === "calling") {
      sendDTMF(digit);
      setDtmfLog((prev) => prev + digit);
    } else {
      setPhone((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    playSafeClick(); 
    if (status === "connected" || status === "calling") {
        setDtmfLog(prev => prev.slice(0, -1));
    } else {
        setPhone(p => p.slice(0, -1));
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 relative">
      
      {/* DISPLAY LOGIC:
         1. If IDLE: Show the number input (for typing outgoing calls).
         2. If CONNECTED/CALLING: Show CallStatus with the 'activePhoneNumber'.
            This ensures incoming calls display the caller's number here too.
      */}
      {status === "idle" ? (
        <NumberInput phone={phone} setPhone={setPhone} />
      ) : (
        <CallStatus 
          phone={activePhoneNumber || phone} // 👈 Use active number if available
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