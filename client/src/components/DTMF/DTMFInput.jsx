import React, { useState } from 'react';

export default function DTMFInput() {
  const [dtmf, setDtmf] = useState('');

  const handleSendDTMF = () => {
    // Placeholder for backend integration
    console.log('Sending DTMF:', dtmf);
    setDtmf('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">DTMF Input</h2>
      <input
        type="text"
        value={dtmf}
        onChange={(e) => setDtmf(e.target.value.replace(/[^\d*#]/g, ''))}
        placeholder="Enter DTMF tones (e.g. 1234#*)"
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 mb-4"
      />
      <button
        onClick={handleSendDTMF}
        disabled={!dtmf}
        className={`w-full py-2 rounded font-semibold transition ${
          dtmf
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Send DTMF
      </button>
    </div>
  );
}
