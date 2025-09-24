// api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ------------------- Get ACS Token -------------------
export const getACSToken = async () => {
  const response = await api.get("/api/acs/getToken"); // matches backend
  return response.data;
};

// ------------------- Make PSTN Call -------------------
export const makeCall = async (phoneNumber) => {
  const response = await api.post("/api/acs/make-call", {
    to: phoneNumber, // matches backend expected payload
  });
  return response.data;
};
