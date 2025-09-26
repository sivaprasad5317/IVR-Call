import { useEffect, useRef, useState } from "react";
import { initCallClient, makePSTNCall, hangUpCall, toggleMute, onCallEvents } from "../components/Dialer/callClient";
import { getACSToken } from "../components/Services/api";

// Handles starting/ending calls, mute and optional WebSocket events.
export function useCallManager() {
  const [status, setStatus] = useState("idle");
  const [calling, setCalling] = useState(false);
  const [muted, setMuted] = useState(false);
  const wsRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Attach SDK-level callbacks (so other parts of app can register too)
    unsubscribeRef.current = onCallEvents(
      () => {
        setStatus("connected");
        setCalling(true);
      },
      () => {
        setStatus("ended");
        setCalling(false);
        setTimeout(() => {
          setStatus("idle");
        }, 2000);
      }
    );

    // Optional WebSocket for external signaling (fallback / server-driven events)
    const WS_URL = import.meta.env.VITE_CALL_WS_URL || "wss://5f5b17ccd9ce.ngrok-free.app";
    try {
      wsRef.current = new WebSocket(WS_URL);
      wsRef.current.onopen = () => console.log("WebSocket connected to", WS_URL);
      wsRef.current.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          console.log("📡 WebSocket message:", data);
          if (data.type === "connected") {
            setStatus("connected");
            setCalling(true);
          } else if (data.type === "ended") {
            setStatus("ended");
            setCalling(false);
            setTimeout(() => setStatus("idle"), 2000);
          }
        } catch (err) {
          console.warn("Failed to parse ws message", err);
        }
      };
      wsRef.current.onclose = () => console.log("WebSocket closed");
      wsRef.current.onerror = (e) => console.warn("WebSocket error", e);
    } catch (err) {
      console.warn("WebSocket init failed", err);
    }

    return () => {
      // cleanup
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (wsRef.current) try { wsRef.current.close(); } catch (e) {}
    };
  }, []);

  const startCall = async (phone) => {
    if (!phone) throw new Error("No phone number provided");
    if (calling) return;
    try {
      setCalling(true);
      setStatus("calling");
      setMuted(false);

      const acsData = await getACSToken();
      await initCallClient(acsData.token, acsData.userId);

      await makePSTNCall(
        phone,
        import.meta.env.VITE_ACS_TRIAL_NUMBER,
        () => {
          setStatus("connected");
          setCalling(true);
        },
        () => {
          setStatus("ended");
          setCalling(false);
          setTimeout(() => setStatus("idle"), 2000);
        }
      );
    } catch (err) {
      console.error("Call failed:", err);
      setStatus("idle");
      setCalling(false);
      throw err;
    }
  };

  const endCall = () => {
    hangUpCall();
    setCalling(false);
    setStatus("ended");
    setTimeout(() => setStatus("idle"), 2000);
  };

  const toggleMuteCall = async () => {
    try {
      await toggleMute();
      setMuted((m) => !m);
    } catch (err) {
      console.warn("toggleMuteCall error", err);
    }
  };

  return { status, calling, muted, startCall, endCall, toggleMuteCall };
}