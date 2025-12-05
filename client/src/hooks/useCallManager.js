import { useEffect, useRef, useState } from "react";
import { 
  initCallClient, 
  makePSTNCall, 
  hangUpCall, 
  toggleMute, 
  onCallEvents,
  onIncomingCall,    
  acceptIncomingCall,
  rejectIncomingCall 
} from "../components/Dialer/callClient"; 
import { getACSToken } from "../components/Services/api";

export function useCallManager() {
  const [status, setStatus] = useState("idle");
  const [calling, setCalling] = useState(false);
  const [muted, setMuted] = useState(false);
  const [incomingCaller, setIncomingCaller] = useState(null); 

  useEffect(() => {
    // 1. Monitor Outgoing/Active Call States
    const cleanupEvents = onCallEvents(
      () => { // Connected
        setStatus("connected");
        setCalling(true);
      },
      () => { // Disconnected
        setStatus("ended");
        setCalling(false);
        setMuted(false);
        setTimeout(() => setStatus("idle"), 2000);
      }
    );

    // 2. Monitor Incoming Calls
    const cleanupIncoming = onIncomingCall((call) => {
        if (call) {
            setIncomingCaller(call.callerInfo.phoneNumber);
        } else {
            setIncomingCaller(null);
        }
    });

    return () => {
      cleanupEvents();
      cleanupIncoming();
    };
  }, []);

  // --- NEW HELPER: Force Mic Permission ---
  const askDevicePermission = async () => {
    try {
      // This forces the browser popup for "Allow Microphone"
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // We don't need the stream, just the permission, so stop it immediately
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      alert("Please allow microphone access to make calls.");
      return false;
    }
  };

  const startCall = async (phone) => {
    if (!phone) return;
    
    // 1. PRE-FLIGHT CHECK
    const hasPermission = await askDevicePermission();
    if (!hasPermission) return; // Stop here if user said "Block"

    try {
      setCalling(true);
      setStatus("calling");
      
      const acsData = await getACSToken();
      await initCallClient(acsData.token, acsData.userId); 

      await makePSTNCall(
        phone,
        import.meta.env.VITE_ACS_TRIAL_NUMBER,
        () => { setStatus("connected"); setCalling(true); },
        () => { setStatus("ended"); setCalling(false); setTimeout(() => setStatus("idle"), 2000); }
      );
    } catch (err) {
      console.error(err);
      setStatus("idle");
      setCalling(false);
    }
  };

  const acceptCall = async () => {
      // Also check permission before answering
      const hasPermission = await askDevicePermission();
      if (!hasPermission) return;

      setIncomingCaller(null); 
      setStatus("calling"); 
      try {
        await acceptIncomingCall(
            () => { setStatus("connected"); setCalling(true); },
            () => { setStatus("ended"); setCalling(false); setTimeout(() => setStatus("idle"), 2000); }
        );
      } catch(e) {
          console.error("Failed to accept", e);
          setStatus("idle");
      }
  };

  const rejectCall = async () => {
      setIncomingCaller(null);
      await rejectIncomingCall();
  };

  const endCall = () => {
    hangUpCall();
  };

  const toggleMuteCall = async () => {
    await toggleMute();
    setMuted(prev => !prev);
  };

  return { 
      status, 
      calling, 
      muted, 
      startCall, 
      endCall, 
      toggleMuteCall, 
      incomingCaller, 
      acceptCall,     
      rejectCall      
  };
}