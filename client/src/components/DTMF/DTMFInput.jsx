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

  const handleAppend = (char) => setDtmf((d) => d + char);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">DTMF Input</h2>

      <div className="flex items-center mb-3">
        <input
          type="text"
          value={dtmf}
          onChange={(e) => setDtmf(e.target.value.replace(/[^\d*#]/g, ""))}
          placeholder="Enter DTMF tones (e.g. 1234#*)"
          className="border rounded px-2 py-1 flex-1 mr-2"
        />
        <button
          onClick={handleSendDTMF}
          className={`px-4 py-2 rounded text-white font-semibold ${
            dtmf ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!dtmf}
        >
          Send
        </button>
      </div>

      {/* Dialpad */}
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
          <button
            key={k}
            onClick={() => handleAppend(k)}
            className="p-3 border rounded text-lg font-medium hover:bg-blue-100"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
