import React, { useState } from 'react';

export default function CallNotes({ callId }) {
  const [notes, setNotes] = useState('');

  const handleSaveNotes = () => {
    // Placeholder for backend integration
    console.log(`Saving notes for call ${callId}:`, notes);
    alert('Notes saved!');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-2xl mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">Call Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write notes about this call..."
        rows={5}
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 resize-none mb-4"
      />
      <button
        onClick={handleSaveNotes}
        disabled={!notes.trim()}
        className={`w-full py-2 rounded font-semibold transition ${
          notes.trim()
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Save Notes
      </button>
    </div>
  );
}
