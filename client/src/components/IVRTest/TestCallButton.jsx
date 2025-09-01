import React, { useState } from "react";
import { getACSToken, makeCall } from '../Services/api';

export default function TestCallButton({ phone }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTestCall = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // First get ACS token
      const acsData = await getACSToken();
      // Then initiate call
      const callData = await makeCall(phone);
      console.log('Call initiated:', callData);
    } catch (err) {
      setError(err.message);
      console.error('Error making test call:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleTestCall}
        disabled={!phone || isLoading}
        className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
      >
        {isLoading ? 'Initiating Call...' : 'Test Call'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
