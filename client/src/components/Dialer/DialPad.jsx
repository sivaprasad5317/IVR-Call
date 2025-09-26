import React, { useRef } from "react";

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

export default function DialPad({ onDigit }) {
  const longPressTimer = useRef(null);
  const longPressed = useRef(false);

  const startLongPress = (val) => {
    if (val !== "0") return;
    longPressed.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      onDigit("+");
    }, 500);
  };

  const endLongPress = (val) => {
    if (val !== "0") return;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressed.current) {
      onDigit("0");
    }
    longPressed.current = false;
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {DIAL_PAD.map(([num, sub], idx) => (
        <button
          key={num + idx}
          className="flex flex-col items-center justify-center bg-gray-100 hover:bg-blue-100 active:bg-blue-200 rounded-lg py-4 text-2xl font-semibold select-none transition"
          onMouseDown={() => startLongPress(num)}
          onMouseUp={() => endLongPress(num)}
          onMouseLeave={() => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
          }}
          onTouchStart={() => startLongPress(num)}
          onTouchEnd={() => endLongPress(num)}
          onClick={() => {
            if (num !== "0") onDigit(num);
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