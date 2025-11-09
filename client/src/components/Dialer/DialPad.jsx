// client/src/components/Dialer/DialPad.jsx
import React, { useRef } from "react";
import { sendDTMF, getCurrentCall } from "./callClient";

const DIAL_PAD = [
  ["1", "ABC"],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["*", ""],
  ["0", "+"],
  ["#", ""],
];

/**
 * speakDigit(d) uses the browser Speech Synthesis API to speak the pressed key.
 * It is non-blocking and runs only locally (local user will hear it).
 * If speechSynthesis is not supported, it silently does nothing.
 */
function speakDigit(d) {
  try {
    if (!("speechSynthesis" in window)) return;
    // map some characters to friendly words
    const mapping = {
      "*": "star",
      "#": "hash",
      "+": "plus",
      "0": "zero",
      "1": "one",
      "2": "two",
      "3": "three",
      "4": "four",
      "5": "five",
      "6": "six",
      "7": "seven",
      "8": "eight",
      "9": "nine",
      A: "A",
      B: "B",
      C: "C",
      D: "D",
    };

    const utteranceText = mapping[d] ?? d;
    const utterance = new SpeechSynthesisUtterance(utteranceText);

    // Optional: set voice, rate, pitch
    // const voices = window.speechSynthesis.getVoices();
    // utterance.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    utterance.rate = 1; // 0.1 - 10
    utterance.pitch = 1; // 0 - 2

    // Non-blocking: speak and return
    window.speechSynthesis.cancel(); // cancel queued utterances if you want only last one
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    // don't crash the UI — just log for debugging
    console.warn("speakDigit error:", err);
  }
}

export default function DialPad({ onDigit }) {
  const longPressTimer = useRef(null);
  const longPressed = useRef(false);

  const startLongPress = (val) => {
    if (val !== "0") return;
    longPressed.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      if (typeof onDigit === "function") onDigit("+");
      // speak the plus if you'd like
      speakDigit("+");
      longPressTimer.current = null;
    }, 500);
  };

  const endLongPress = (val) => {
    if (val !== "0") return;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressed.current) {
      if (typeof onDigit === "function") onDigit("0");
      speakDigit("0");        // speak locally
      trySendDTMF("0");      // non-blocking send DTMF
    }
    longPressed.current = false;
  };

  const handleClick = (num) => {
    if (num !== "0") {
      // local number input handler
      if (typeof onDigit === "function") onDigit(num);

      // speak locally
      // avoid speaking '+' (only from long-press which is handled elsewhere)
      if (num !== "+") speakDigit(num);

      // try send DTMF
      trySendDTMF(num);
    }
  };

  const trySendDTMF = async (digit) => {
    try {
      const active = getCurrentCall();
      if (active) {
        await sendDTMF(String(digit));
      }
    } catch (err) {
      // do not break local behavior; log only
      console.warn("DTMF send failed (ignored):", err && err.message ? err.message : err);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {DIAL_PAD.map(([num, sub]) => (
        <button
          key={num}
          className="flex flex-col items-center justify-center bg-gray-100 hover:bg-blue-100 active:bg-blue-200 rounded-lg py-4 text-2xl font-semibold select-none transition"
          onMouseDown={() => startLongPress(num)}
          onMouseUp={() => endLongPress(num)}
          onMouseLeave={() => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }}
          onTouchStart={() => startLongPress(num)}
          onTouchEnd={() => endLongPress(num)}
          onClick={() => {
            if (num !== "0") handleClick(num);
          }}
          tabIndex={0}
          aria-label={`Key ${num}`}
        >
          <span>{num}</span>
          {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </button>
      ))}
    </div>
  );
}
