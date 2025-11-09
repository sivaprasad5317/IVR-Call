import React, { useState } from "react";
import { sendDTMF } from "../Dialer/callClient";

export default function DTMFInput() {
  const [dtmf, setDtmf] = useState("");

  const handleSendDTMF = async () => {
    if (!dtmf) return;
    try {
      await sendDTMF(dtmf);
      setDtmf("");
    } catch (err) {
      console.error("Failed to send DTMF:", err);
      alert("Failed to send DTMF: " + (err.message || err));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">DTMF Input</h2>

      <div className="flex items-center">
        <input
          type="text"
          value={dtmf}
          onChange={(e) => setDtmf(e.target.value.replace(/[^\d*#ABCDabcd]/g, ""))}
          placeholder="Enter DTMF tones (e.g. 1234#* or A-D)"
          className="border rounded px-2 py-2 flex-1 mr-2"
        />
        <button
          onClick={handleSendDTMF}
          className={`px-4 py-2 rounded text-white font-semibold ${
            dtmf ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!dtmf}
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
