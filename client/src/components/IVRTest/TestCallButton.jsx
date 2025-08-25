import React from "react";

const TestCallButton = ({ phone }) => {
  const startTestCall = async () => {
    if (!phone) {
      alert("Please enter a phone number first.");
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;

    try {
      const response = await fetch(`${apiUrl}/api/ivr/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      console.log(data);
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Error starting IVR call");
    }
  };

  return (
    <button
      onClick={startTestCall}
      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Start Test Call
    </button>
  );
};

export default TestCallButton;
