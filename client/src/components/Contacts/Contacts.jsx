// client/src/components/Contacts/Contacts.jsx
import React, { useState, useEffect } from "react";
import { contactService } from "../../services/contactService";

const Contacts = ({ onSelect }) => {
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
    const unsubscribe = contactService.subscribe(loadContacts);
    return () => unsubscribe && unsubscribe();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedContacts = await contactService.getContacts();
      // Defensive: ensure contacts is always an array
      setContacts(Array.isArray(loadedContacts) ? loadedContacts : []);
    } catch (err) {
      console.error("Failed to load contacts:", err);
      setError("Failed to load contacts");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newContact.name && newContact.phone) {
      try {
        const savedContact = await contactService.addContact(newContact);
        // ensure contacts stays array
        setContacts((prev) => Array.isArray(prev) ? [...prev, savedContact] : [savedContact]);
        setNewContact({ name: "", phone: "" });
        setIsAdding(false);
        setError(null);
      } catch (err) {
        console.error("Failed to add contact:", err);
        setError("Failed to add contact");
      }
    }
  };

  const handleDelete = async (contactId) => {
    try {
      await contactService.deleteContact(contactId);
      setContacts((prev) => (Array.isArray(prev) ? prev.filter((c) => c.id !== contactId) : []));
      setError(null);
    } catch (err) {
      console.error("Failed to delete contact:", err);
      setError("Failed to delete contact");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div>Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Final guard: if not array, show debug
  if (!Array.isArray(contacts)) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div>Unexpected contacts shape from server:</div>
        <pre>{JSON.stringify(contacts, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Contacts</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          {isAdding ? "Cancel" : "Add Contact"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            placeholder="Name"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newContact.phone}
            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          />
          <button type="submit" className="w-full bg-green-500 text-white py-2 rounded">
            Save Contact
          </button>
        </form>
      )}

      <div className="space-y-2">
        {contacts.length === 0 ? (
          <div>No contacts found.</div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id ?? contact.phone ?? Math.random()}
              className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium">{contact.name}</div>
                <div className="text-gray-600">{contact.phone}</div>
              </div>
              <div>
                <button onClick={() => onSelect(contact.phone)} className="text-blue-500 px-2">
                  Select
                </button>
                <button onClick={() => handleDelete(contact.id)} className="text-red-500 px-2">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Contacts;
