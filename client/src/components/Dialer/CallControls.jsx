import React from "react";
import { FiPhone, FiMicOff } from "react-icons/fi";

export default function CallControls({ phone, calling, muted, onCall, onMute, onBackspace }) {
  return (
    <div className="flex items-center justify-between mt-2">
      <button
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-white font-bold transition ${
          calling ? "bg-red-500" : "bg-green-500 hover:bg-green-600"
        }`}
        onClick={onCall}
        disabled={!phone}
      >
        <FiPhone size={22} />
        {calling ? "End" : "Call"}
      </button>

      <button
        className={`ml-3 p-3 rounded-lg transition ${
          muted ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"
        }`}
        onClick={onMute}
        title="Mute"
        disabled={!calling}
      >
        <FiMicOff size={22} />
      </button>

      <button
        className="ml-3 p-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
        onClick={onBackspace}
        title="Backspace"
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 7v10a2 2 0 0 1-2 2H7a2 2 0 0 1-1.7-1l-4-7a2 2 0 0 1 0-2l4-7A2 2 0 0 1 7 3h11a2 2 0 0 1 2 2z" />
          <path d="M10 9l4 4m0-4l-4 4" />
        </svg>
      </button>
    </div>
  );
}
