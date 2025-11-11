// client/src/components/Dialer/DialPad.jsx
import React, { useRef } from "react";
import { sendDTMF, getCurrentCall } from "./callClient";

/**
 * DialPad with:
 * - long-press 0 -> '+'
 * - short-press 0 -> '0' (single)
 * - prevents duplicate firing on touchscreens (touch + mouse events)
 * - speaks digits locally using speechSynthesis
 * - sends DTMF if there's an active call (non-blocking)
 */

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

function speakDigit(d) {
  try {
    if (!("speechSynthesis" in window)) return;
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
    const u = new SpeechSynthesisUtterance(utteranceText);
    // optional tuning
    u.rate = 1;
    u.pitch = 1;
    // Cancel previously queued utterances so rapid presses only keep the latest
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (err) {
    console.warn("speakDigit error:", err);
  }
}

export default function DialPad({ onDigit }) {
  const longPressTimer = useRef(null);
  const longPressed = useRef(false);

  // Guard to avoid mouse events after touch events on mobile (prevents double append)
  const ignoreMouse = useRef(false);
  const IGNORE_MOUSE_MS = 700;

  // Called when a press starts (mouse or touch)
  const startPress = (val, eventType) => {
    // If it's a touch event, mark ignoreMouse so subsequent mouse events are ignored briefly
    if (eventType === "touch") {
      ignoreMouse.current = true;
      // clear after a short window
      setTimeout(() => {
        ignoreMouse.current = false;
      }, IGNORE_MOUSE_MS);
    }

    if (val !== "0") return;
    longPressed.current = false;
    // start a timer for long press (500ms)
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      if (typeof onDigit === "function") onDigit("+");
      // Speak plus
      speakDigit("+");
      longPressTimer.current = null;
    }, 500);
  };

  // Called when press ends (mouse or touch)
  const endPress = (val, eventType) => {
    // If this is a mouse event and a recent touch occurred, ignore it
    if (eventType === "mouse" && ignoreMouse.current) {
      // ignore duplicate mouse event after touch
      return;
    }

    if (val !== "0") return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressed.current) {
      // short press: append "0" and send dtmf for '0'
      if (typeof onDigit === "function") onDigit("0");
      speakDigit("0");
      trySendDTMF("0");
    }
    longPressed.current = false;
  };

  // Click handler for non-zero keys (0 handled via press start/end)
  const handleClick = (num) => {
    if (num === "0") return; // 0 handled by touch/mouse press handlers
    if (typeof onDigit === "function") onDigit(num);
    // avoid speaking '+' (only created via long-press)
    if (num !== "+") speakDigit(num);
    trySendDTMF(num);
  };

  const trySendDTMF = async (digit) => {
    try {
      const active = getCurrentCall();
      if (active) {
        await sendDTMF(String(digit));
      }
    } catch (err) {
      console.warn("DTMF send failed (ignored):", err && err.message ? err.message : err);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {DIAL_PAD.map(([num, sub]) => (
        <button
          key={num}
          className="flex flex-col items-center justify-center bg-gray-100 hover:bg-blue-100 active:bg-blue-200 rounded-lg py-4 text-2xl font-semibold select-none transition"
          // Mouse events: check ignoreMouse in their handlers
          onMouseDown={(e) => {
            if (ignoreMouse.current) return;
            startPress(num, "mouse");
          }}
          onMouseUp={(e) => {
            if (ignoreMouse.current) return;
            endPress(num, "mouse");
          }}
          // Touch events: mark ignoreMouse and call same logic
          onTouchStart={(e) => {
            startPress(num, "touch");
          }}
          onTouchEnd={(e) => {
            endPress(num, "touch");
          }}
          onMouseLeave={() => {
            // clear timer if pointer leaves (mouse)
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }}
          onClick={() => handleClick(num)}
          tabIndex={0}
          aria-label={`Key ${num}`}
          type="button"
        >
          <span>{num}</span>
          {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </button>
      ))}
    </div>
  );
}
