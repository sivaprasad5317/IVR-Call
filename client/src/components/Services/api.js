// api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const getACSToken = async () => {
  const response = await api.get("/api/acs/getToken");
  return response.data;
};

export const makeCall = async (phoneNumber) => {
  const ACS_TRIAL_NUMBER = import.meta.env.VITE_ACS_TRIAL_NUMBER || "+18332404099";
  const response = await api.post("/api/calls/startCall", { phoneNumber, callerACSNumber: ACS_TRIAL_NUMBER });
  return response.data;
};
