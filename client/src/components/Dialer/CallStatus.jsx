import React from "react";

export default function CallStatus({ phone, status, duration, dtmfLog }) {
  return (
    <div className="text-center">
      {/* The main Callee number (static during call) */}
      <p className="text-xl font-semibold">{phone}</p>

      {/* The Temporary DTMF Display (visible only when numbers are typed during a call) */}
      {status === "connected" && dtmfLog && (
        <p className="text-lg text-gray-800 font-mono mt-1 tracking-widest animate-pulse">
          {dtmfLog}
        </p>
      )}

      {/* Call State / Timer */}
      <div className="mt-2">
        {status === "calling" && <p className="text-gray-500">Calling...</p>}
        {status === "connected" && <p className="text-green-600 font-medium">{duration}</p>}
        {status === "ended" && <p className="text-red-500">Call ended</p>}
      </div>
    </div>
  );
}