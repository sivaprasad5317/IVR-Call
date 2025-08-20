import React, { useState } from 'react';

export default function SpeechInput() {
  const [speechText, setSpeechText] = useState('');

  const handleSendSpeech = () => {
    // Placeholder for backend integration
    console.log('Sending speech text:', speechText);
    setSpeechText('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">Speech Input</h2>
      <textarea
        value={speechText}
        onChange={(e) => setSpeechText(e.target.value)}
        placeholder="Enter speech text to send"
        rows={3}
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 mb-4 resize-none"
      />
      <button
        onClick={handleSendSpeech}
        disabled={!speechText.trim()}
        className={`w-full py-2 rounded font-semibold transition ${
          speechText.trim()
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Send Speech
      </button>
    </div>
  );
}
