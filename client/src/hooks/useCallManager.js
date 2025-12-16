import { useEffect, useState } from "react";
import axios from "axios"; 
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
  
  // State for the Pop-up Modal (Null = No popup)
  const [incomingCaller, setIncomingCaller] = useState(null);
  
  // NEW: Persistent State for the Connected Screen
  const [activePhoneNumber, setActivePhoneNumber] = useState(""); 

  // ---------------------------------------------------------
  // 1. AUTO-CONNECT & REGISTER
  // ---------------------------------------------------------
  useEffect(() => {
    const connectToAzure = async () => {
      try {
        console.log("🔄 [useCallManager] Auto-connecting to Azure...");
        const acsData = await getACSToken();
        const activeUserId = await initCallClient(acsData.token, acsData.userId); 
        console.log(`✅ [useCallManager] Connected. Active Agent ID: ${activeUserId}`);

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
        try {
            await axios.post(`${API_URL}/api/calls/register`, { userId: activeUserId });
            console.log(`✅ [useCallManager] Registered CORRECT ID: ${activeUserId}`);
        } catch (regErr) {
            console.warn("⚠️ [useCallManager] Server registration failed:", regErr.message);
        }
      } catch (err) {
        console.error("❌ [useCallManager] Failed to auto-connect:", err);
        if (err.message && (err.message.includes("401") || err.message.includes("403"))) {
             localStorage.removeItem("acs_user_id");
        }
      }
    };
    connectToAzure();
  }, []);

  // ---------------------------------------------------------
  // 2. EVENT LISTENERS
  // ---------------------------------------------------------
  useEffect(() => {
    const cleanupEvents = onCallEvents(
      () => { // Connected
        setStatus("connected");
        setCalling(true);
      },
      () => { // Disconnected
        setStatus("ended");
        setCalling(false);
        setMuted(false);
        setActivePhoneNumber(""); // Clear the number when call ends
        setTimeout(() => setStatus("idle"), 2000);
      }
    );

    const cleanupIncoming = onIncomingCall((call) => {
        if (!call) {
            setIncomingCaller(null);
            return;
        }

        // Safe Parsing Logic
        let callerNum = "Unknown Caller";
        try {
            if (call.callerInfo?.phoneNumber) {
                callerNum = call.callerInfo.phoneNumber;
            } else if (call.callerInfo?.identifier?.phoneNumber) {
                callerNum = call.callerInfo.identifier.phoneNumber;
            } else if (call.callerInfo?.identifier?.communicationUserId) {
                callerNum = "VoIP User";
            }
        } catch (e) {
            console.warn("Could not parse caller ID:", e);
        }

        console.log(`⚛️ React Hook: Incoming Call from [${callerNum}]`);
        
        // 1. Set text for the Modal
        setIncomingCaller(callerNum); 
        // 2. Set text for the Connected Screen (So it persists after accept)
        setActivePhoneNumber(callerNum);
    });

    const cleanupMute = onMuteChange((isMutedSDK) => setMuted(isMutedSDK));

    return () => {
      cleanupEvents();
      cleanupIncoming();
      cleanupMute();
    };
  }, []);

  // ---------------------------------------------------------
  // 3. ACTIONS
  // ---------------------------------------------------------

  const askDevicePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      return false;
    }
  };

  const startCall = async (phone) => {
    if (!phone) return;
    if (!await askDevicePermission()) return;

    try {
      setCalling(true);
      setStatus("calling");
      setActivePhoneNumber(phone); // Save dialed number for display

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
      if (!await askDevicePermission()) return;
      setStatus("calling"); 
      try {
        await acceptIncomingCall(
            () => { 
                setStatus("connected"); 
                setCalling(true); 
                setIncomingCaller(null); // Close modal, but 'activePhoneNumber' keeps the data
            },
            () => { 
                setStatus("ended"); 
                setCalling(false); 
                setTimeout(() => setStatus("idle"), 2000); 
            }
        );
      } catch(e) {
          console.error(e);
          setStatus("idle");
          setIncomingCaller(null);
      }
  };

  const rejectCall = async () => {
      setIncomingCaller(null);
      await rejectIncomingCall();
  };

  const endCall = () => hangUpCall();
  const toggleMuteCall = async () => await toggleMute();

  // EXPOSE 'activePhoneNumber' to the UI
  return { 
      status, calling, muted, incomingCaller, activePhoneNumber,
      startCall, endCall, toggleMuteCall, acceptCall, rejectCall      
  };
}