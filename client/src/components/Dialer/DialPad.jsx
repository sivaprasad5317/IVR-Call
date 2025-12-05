import React from "react";

/**
 * Silent DialPad
 * - Simply triggers the onDigit callback
 * - No audio, no text-to-speech
 * - No complex long-press logic (unless strictly needed for '+', but for IVR DTMF '+' is rarely used)
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

export default function DialPad({ onDigit }) {
  
  const handleClick = (digit) => {
    // Purely pass the digit up to the parent (DialerPanel)
    // The parent handles sending DTMF to Azure SDK
    if (onDigit) onDigit(digit);
  };

  return (
    <div className="grid grid-cols-3 gap-3 mt-2">
      {DIAL_PAD.map(([num, sub]) => (
        <button
          key={num}
          // Prevent default to stop browser from focusing/reading text on some devices
          onMouseDown={(e) => e.preventDefault()} 
          onClick={() => handleClick(num)}
          className="
            flex flex-col items-center justify-center 
            bg-gray-100 hover:bg-blue-100 active:bg-blue-200 
            rounded-lg py-4 select-none transition shadow-sm
            focus:outline-none
          "
          type="button"
          aria-label={num}
        >
          <span className="text-2xl font-semibold text-gray-800">{num}</span>
          {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </button>
      ))}
    </div>
  );
}