import React, { useState, useRef } from "react";
import { FiPhone, FiMicOff, FiUserPlus } from "react-icons/fi";
import SaveContactModal from "./SaveContactModal";
import { initCallClient, hangUpCall, toggleMute } from "./callClient";
import { getACSToken, makeCall } from "../Services/api";

const DIAL_PAD = [
  ["1", "", ""],
  ["2", "ABC", ""],
  ["3", "DEF", ""],
  ["4", "GHI", ""],
  ["5", "JKL", ""],
  ["6", "MNO", ""],
  ["7", "PQRS", ""],
  ["8", "TUV", ""],
  ["9", "WXYZ", ""],
  ["*", "", ""],
  ["0", "+", ""],
  ["#", "", ""],
];

export default function DialerPanel({ phone, setPhone }) {
  const [calling, setCalling] = useState(false);
  const [muted, setMuted] = useState(false);
  const longPressTimer = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState(null);

  const handleInput = (val) => {
    setPhone((prev) => prev + val);
  };

  const handleBackspace = () => {
    setPhone((prev) => prev.slice(0, -1));
  };

  const handleDialPad = (val, idx) => {
    if (val === "0") {
      longPressTimer.current = setTimeout(() => {
        setPhone((prev) => prev + "+");
      }, 500);
    }
  };

  const handleDialPadUp = (val) => {
    if (val === "0") {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        setPhone((prev) => prev + "0");
      }
    }
  };

  const handleDialPadClick = (val) => {
    if (val !== "0") handleInput(val);
  };

  const handleCall = async () => {
    if (!calling) {
      try {
        setCalling(true);
        setError(null);

        // 1. Get ACS token from backend
        const acsData = await getACSToken();

        // 2. Initialize ACS client with token
        await initCallClient(acsData.token, acsData.userId);
        await makeCall(phone, import.meta.env.VITE_ACS_TRIAL_NUMBER);
        const callData = await makeCall(phone);
        console.log("Call initiated:", callData);
      } catch (err) {
        console.error("Call failed:", err);
        setError(err.message || "Failed to start call");
        setCalling(false);
      }
    } else {
      hangUpCall();
      setCalling(false);
    }
  };

  const handleMute = () => {
    toggleMute();
    setMuted((m) => !m);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 text-xl px-3 py-2 border rounded focus:outline-none focus:ring"
          type="text"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value.replace(/[^\d*#+]/g, ""))
          }
          placeholder="Enter phone number"
          inputMode="tel"
        />

        <button
          className="text-gray-500 hover:text-blue-600"
          title="Save Contact"
          onClick={() => {
            setContactName("");
            setContactNumber(phone);
            setShowModal(true);
          }}
        >
          <FiUserPlus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {DIAL_PAD.map(([num, sub], idx) => (
          <button
            key={num + idx}
            className="flex flex-col items-center justify-center bg-gray-100 hover:bg-blue-100 active:bg-blue-200 rounded-lg py-4 text-2xl font-semibold select-none transition"
            onMouseDown={() => handleDialPad(num, idx)}
            onMouseUp={() => handleDialPadUp(num)}
            onMouseLeave={() => {
              if (longPressTimer.current) clearTimeout(longPressTimer.current);
            }}
            onClick={() => handleDialPadClick(num)}
            tabIndex={0}
          >
            <span>{num}</span>
            {sub && <span className="text-xs text-gray-400">{sub}</span>}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-white font-bold transition ${
            calling ? "bg-red-500" : "bg-green-500 hover:bg-green-600"
          }`}
          onClick={handleCall}
          disabled={!phone}
        >
          <FiPhone size={22} />
          {calling ? "End" : "Call"}
        </button>

        <button
          className={`ml-3 p-3 rounded-lg transition ${
            muted ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={handleMute}
          title="Mute"
          disabled={!calling}
        >
          <FiMicOff size={22} />
        </button>

        <button
          className="ml-3 p-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          onClick={handleBackspace}
          title="Backspace"
        >
          <svg
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M20 7v10a2 2 0 0 1-2 2H7a2 2 0 0 1-1.7-1l-4-7a2 2 0 0 1 0-2l4-7A2 2 0 0 1 7 3h11a2 2 0 0 1 2 2z" />
            <path d="M10 9l4 4m0-4l-4 4" />
          </svg>
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {showModal && (
        <SaveContactModal
          contactName={contactName}
          contactNumber={contactNumber}
          setContactName={setContactName}
          setContactNumber={setContactNumber}
          onSave={() => {
            console.log("Saving contact:", contactName, contactNumber);
            setShowModal(false);
            setContactName("");
            setContactNumber();
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
