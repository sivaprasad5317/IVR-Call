import React from 'react';

export default function CallRecordingPlayer({ recordingUrl }) {
  if (!recordingUrl) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
        <p className="text-gray-500 text-sm">No recording available for this call.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">Call Recording</h2>
      <audio controls className="w-full">
        <source src={recordingUrl} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      <a
        href={recordingUrl}
        download
        className="block mt-3 text-blue-600 hover:underline text-sm text-center"
      >
        Download Recording
      </a>
    </div>
  );
}
