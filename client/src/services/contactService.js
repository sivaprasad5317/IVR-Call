import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const listeners = [];

const getContacts = async () => {
  try {
    const response = await api.get("/api/contacts"); // Added /api prefix
    return response.data;
  } catch (error) {
    console.error('Error loading contacts:', error);
    return [];
  }
};

const addContact = async (contactData) => {
  try {
    const response = await api.post("/api/contacts", contactData); // Added /api prefix
    // Notify listeners after successful save
    listeners.forEach(listener => listener());
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to save contact');
  }
};

const deleteContact = async (contactId) => {
  try {
    await api.delete(`/api/contacts/${contactId}`); // Added /api prefix
    return true;
  } catch (error) {
    console.error('Error deleting contact:', error);
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
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }
};