import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ------------------- Get ACS Token -------------------
export const getACSToken = async () => {
  try {
    const response = await api.get("/api/calls/getToken");
    return response.data;
  } catch (err) {
    console.error("Failed to get ACS token:", err);
    throw err;
  }
};

// ------------------- Make PSTN Call (Server-side Trigger) -------------------
// Note: This is usually for Server-to-Server dialing. 
// Your current app seems to use Client-side dialing (via SDK).
// Keep this if you plan to trigger calls via backend logic later.
export const makeCall = async (phoneNumber) => {
  try {
    const response = await api.post("/api/calls/startCall", {
      phoneNumber, 
    });
    return response.data;
  } catch (err) {
    console.error("Failed to start call:", err);
    throw err;
  }
};

// ------------------- Save Contact -------------------
export const addContact = async (contact) => {
  try {
    const response = await api.post("/api/contacts", contact);
    return response.data;
  } catch (err) {
    console.error("Failed to save contact:", err);
    throw err;
  }
};

// ------------------- Fetch Contacts -------------------
export const getContacts = async () => {
  try {
    const response = await api.get("/api/contacts");
    return response.data;
  } catch (err) {
    console.error("Failed to fetch contacts:", err);
    throw err;
  }
};

// ------------------- Delete Contact -------------------
export const deleteContact = async (contactId) => {
  try {
    const response = await api.delete(`/api/contacts/${contactId}`);
    return response.data;
  } catch (err) {
    console.error("Failed to delete contact:", err);
    throw err;
  }
};