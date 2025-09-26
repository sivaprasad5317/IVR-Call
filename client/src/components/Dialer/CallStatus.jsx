import React from "react";

export default function CallStatus({ phone, status, duration }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold">{phone}</p>
      {status === "calling" && <p className="text-gray-500">Calling...</p>}
      {status === "connected" && <p className="text-green-600">{duration}</p>}
      {status === "ended" && <p className="text-red-500">Call ended</p>}
    </div>
  );
}
