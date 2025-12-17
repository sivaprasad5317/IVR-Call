import { useEffect, useState, useRef } from "react";
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
  
  // Persistent State for the Connected Screen
  const [activePhoneNumber, setActivePhoneNumber] = useState(""); 

  // Track WebSocket so we can close it on unmount
  const wsRef = useRef(null);

  // ---------------------------------------------------------
  // 1. AUTO-CONNECT & REGISTER (WebSocket Version)
  // ---------------------------------------------------------
  useEffect(() => {
    const connectToAzure = async () => {
      try {
        console.log("🔄 [useCallManager] Auto-connecting to Azure...");
        const acsData = await getACSToken();
        const activeUserId = await initCallClient(acsData.token, acsData.userId); 
        console.log(`✅ [useCallManager] Connected. Active Agent ID: ${activeUserId}`);

        // WEBSOCKET REGISTRATION
        // This links the browser tab to the Server's "Active Agents" list.
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
        const WS_URL = API_URL.replace(/^http/, 'ws'); // Handles http -> ws and https -> wss

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws; 

        ws.onopen = () => {
             console.log("✅ [WS] Connected to Server");
             // Send "REGISTER" immediately so Server knows who we are
             ws.send(JSON.stringify({ 
                 type: 'REGISTER', 
                 userId: activeUserId 
             }));
        };

        ws.onerror = (err) => console.error("❌ [WS] Connection Error:", err);
        
      } catch (err) {
        console.error("❌ [useCallManager] Failed to auto-connect:", err);
        if (err.message && (err.message.includes("401") || err.message.includes("403"))) {
             localStorage.removeItem("acs_user_id");
        }
      }
    };

    connectToAzure();

    // CLEANUP: Close socket when component unmounts (closes/refreshes)
    return () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
    };
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
        setActivePhoneNumber(""); 
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
        setIncomingCaller(callerNum); 
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
      setActivePhoneNumber(phone); 

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
                setIncomingCaller(null); 
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

  return { 
      status, calling, muted, incomingCaller, activePhoneNumber,
      startCall, endCall, toggleMuteCall, acceptCall, rejectCall      
  };
}