import React from 'react';

const mockCallHistory = [
  {
    id: 1,
    number: '+1234567890',
    name: 'Support Line',
    timestamp: '2025-08-18 14:32',
    duration: '2m 15s',
    recordingUrl: '#',
  },
  {
    id: 2,
    number: '+1987654321',
    name: 'QA Bot',
    timestamp: '2025-08-17 10:05',
    duration: '1m 42s',
    recordingUrl: '#',
  },
];

export default function CallHistory() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-2xl mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-4">Call History</h2>
      <ul className="divide-y divide-gray-200">
        {mockCallHistory.map((call) => (
          <li key={call.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{call.name} ({call.number})</p>
              <p className="text-sm text-gray-500">
                {call.timestamp} • Duration: {call.duration}
              </p>
            </div>
            <a
              href={call.recordingUrl}
              download
              className="text-blue-600 hover:underline text-sm"
            >
              Download Recording
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
