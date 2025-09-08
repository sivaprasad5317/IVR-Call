import React, { useState } from "react";

const allowedEmails = ["chetan.jagadale@nuance.com", "sivaprasad.cp@nuance.com", "biplav.kumar@nuance.com", "michael.gourlay@nuance.com", "luis.zhinin@nuance.com"];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // normalize input (trim + lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    if (allowedEmails.includes(normalizedEmail)) {
      setError("");
      onLogin(normalizedEmail); // pass normalized email up to App
    } else {
      setError("Access denied. Email not allowed.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-3 rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
