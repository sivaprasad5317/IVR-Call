import React, { useState } from "react";
import { sendDTMF } from "../Dialer/callClient";

export default function DTMFInput() {
  const [dtmf, setDtmf] = useState("");
  // 1. New state to track if we are currently transmitting
  const [isSending, setIsSending] = useState(false);

  const handleSendDTMF = async () => {
    // Prevent sending if empty or already sending
    if (!dtmf || isSending) return;

    // 2. Lock the UI immediately
    setIsSending(true);

    try {
      await sendDTMF(dtmf);
      setDtmf(""); // Clear input on success
    } catch (err) {
      console.error("Failed to send DTMF:", err);
      alert("Failed to send DTMF: " + (err.message || err));
    } finally {
      // 3. Unlock the UI only after everything is done
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">DTMF Input</h2>

      <div className="flex items-center">
        <input
          type="text"
          value={dtmf}
          // Added disabled state so they can't type while sending
          disabled={isSending} 
          onChange={(e) => setDtmf(e.target.value.replace(/[^\d*#ABCDabcd]/g, ""))}
          placeholder="Enter DTMF tones (e.g. 1234#*)"
          className="border rounded px-2 py-2 flex-1 mr-2 disabled:bg-gray-100 disabled:text-gray-400"
        />
        <button
          onClick={handleSendDTMF}
          type="button"
          // Disable button if empty OR if currently sending
          disabled={!dtmf || isSending}
          className={`px-4 py-2 rounded text-white font-semibold transition-all duration-200 ${
            !dtmf || isSending
              ? "bg-gray-400 cursor-not-allowed" // Grey out immediately
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {/* Change text based on state */}
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}