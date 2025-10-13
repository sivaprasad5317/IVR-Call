// client/src/services/contactService.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const listeners = [];

function notifyListeners() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (err) {
      console.warn("contactService listener error:", err);
    }
  });
}

/**
 * Fetch contacts - ALWAYS returns an array.
 * Handles various server shapes defensively.
 */
const getContacts = async () => {
  try {
    const response = await api.get("/api/contacts");
    const data = response && response.data;

    // Debugging helper (remove or comment out if noisy)
    // console.debug("contactService.getContacts response:", data);

    if (!data) return [];
    if (Array.isArray(data)) return data;
    // Common alternative shapes:
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.contacts)) return data.contacts;

    // If server returned an error object like { error: "..." }, return []
    if (data && typeof data === "object" && data.error && Object.keys(data).length === 1) {
      console.warn("contactService.getContacts received error object:", data);
      return [];
    }

    // If object looks like a single contact, wrap it
    if (data && (data.id || data.phone || data.name)) return [data];

    // If object with numeric keys, convert to array
    if (typeof data === "object") {
      const vals = Object.values(data);
      if (Array.isArray(vals) && vals.every((v) => v && (v.id || v.phone || v.name))) return vals;
    }

    // Fallback: return empty array
    return [];
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
};

const addContact = async (contact) => {
  try {
    const response = await api.post("/api/contacts", contact);
    notifyListeners();
    // response.data could be created item or something else; return it
    return response.data;
  } catch (error) {
    console.error("Error adding contact:", error);
    throw error;
  }
};

const deleteContact = async (id) => {
  try {
    await api.delete(`/api/contacts/${id}`);
    notifyListeners();
    return true;
  } catch (error) {
    console.error("Error deleting contact:", error);
    throw error;
  }
};

export const contactService = {
  getContacts,
  addContact,
  deleteContact,
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },
};
