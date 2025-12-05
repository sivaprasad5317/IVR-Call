import { useEffect, useRef, useState } from "react";
import { 
  initCallClient, 
  makePSTNCall, 
  hangUpCall, 
  toggleMute, 
  onCallEvents,
  onIncomingCall,    
  acceptIncomingCall,
  rejectIncomingCall,
  onMuteChange 
} from "../components/Dialer/callClient"; 
import { getACSToken } from "../components/Services/api";

export function useCallManager() {
  const [status, setStatus] = useState("idle");
  const [calling, setCalling] = useState(false);
  const [muted, setMuted] = useState(false);
  const [incomingCaller, setIncomingCaller] = useState(null); 

  useEffect(() => {
    // 1. Call Status Events
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

    // 2. Incoming Call Events
    const cleanupIncoming = onIncomingCall((call) => {
        setIncomingCaller(call ? call.callerInfo.phoneNumber : null);
    });

    // 3. Mute State Events
    const cleanupMute = onMuteChange((isMutedSDK) => {
        // Log the state sync
        console.log(`⚛️ React Hook: Syncing 'muted' state to: [${isMutedSDK}]`);
        setMuted(isMutedSDK); 
    });

    return () => {
      cleanupEvents();
      cleanupIncoming();
      cleanupMute();
    };
  }, []);

  const askDevicePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    const hasPermission = await askDevicePermission();
    if (!hasPermission) return;

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
          console.error(e);
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
    // Log the button click
    console.log("🖱️ UI: Mute button clicked");
    await toggleMute();
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