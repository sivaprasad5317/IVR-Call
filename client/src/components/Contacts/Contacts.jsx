// client/src/components/Contacts/Contacts.jsx
import React, { useState, useEffect, useMemo } from "react";
import { contactService } from "../../services/contactService";

const Contacts = ({ onSelect }) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadContacts();
    // subscribe if service provides a subscribe method
    const unsubscribe =
      contactService && typeof contactService.subscribe === "function"
        ? contactService.subscribe(loadContacts)
        : null;
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedContacts =
        contactService && typeof contactService.getContacts === "function"
          ? await contactService.getContacts()
          : [];
      const arr = Array.isArray(loadedContacts) ? loadedContacts : [];
      setContacts(arr);
      setFilteredContacts(arr);
    } catch (err) {
      console.error("Failed to load contacts:", err);
      setError("Failed to load contacts");
      setContacts([]);
      setFilteredContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep filteredContacts in sync with contacts and search query
  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      setFilteredContacts(contacts);
      return;
    }
    const filtered = contacts.filter((c) => {
      const name = (c.name || c.displayName || "").toString().toLowerCase();
      const phone = (c.phone || c.number || c.phoneNumber || "").toString().toLowerCase();
      // fallback to JSON search for odd shapes
      return (
        name.includes(q) ||
        phone.includes(q) ||
        JSON.stringify(c).toLowerCase().includes(q)
      );
    });
    setFilteredContacts(filtered);
  }, [query, contacts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newContact.name && newContact.phone) {
      try {
        const savedContact =
          contactService && typeof contactService.addContact === "function"
            ? await contactService.addContact(newContact)
            : newContact;
        setContacts((prev) => (Array.isArray(prev) ? [...prev, savedContact] : [savedContact]));
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
      if (contactService && typeof contactService.deleteContact === "function") {
        await contactService.deleteContact(contactId);
      } else if (contactService && typeof contactService.delete === "function") {
        await contactService.delete(contactId);
      } else {
        console.warn("No delete method found on contactService. Skipping server delete.");
      }

      setContacts((prev) =>
        Array.isArray(prev) ? prev.filter((c) => (c.id ?? c.phone ?? c._id) !== contactId) : []
      );
      setFilteredContacts((prev) =>
        Array.isArray(prev) ? prev.filter((c) => (c.id ?? c.phone ?? c._id) !== contactId) : []
      );
      setError(null);
    } catch (err) {
      console.error("Failed to delete contact:", err);
      setError("Failed to delete contact");
    }
  };

  const handleSelect = (phone) => {
    if (typeof onSelect === "function") {
      onSelect(phone);
    }
  };

  // Memoized render list
  const listToRender = useMemo(() => filteredContacts || [], [filteredContacts]);

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

  // Guard: ensure contacts array shape
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
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Contacts</h2>
        <button
          onClick={() => setIsAdding((s) => !s)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
          type="button"
        >
          {isAdding ? "Cancel" : "Add Contact"}
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-3">
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

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search contacts by name or number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded"
          aria-label="Search contacts"
        />
      </div>

      {/* Scrollable list area */}
      <div
        className="space-y-2"
        style={{
          overflowY: "auto",
          maxHeight: "56vh", // prevents right column from growing indefinitely
          paddingRight: 8,
        }}
      >
        {listToRender.length === 0 ? (
          <div>No contacts found.</div>
        ) : (
          listToRender.map((contact) => {
            const key = contact.id ?? contact._id ?? contact.phone ?? JSON.stringify(contact);
            return (
              <div
                key={key}
                className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
              >
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-gray-600">{contact.phone}</div>
                </div>
                <div>
                  <button
                    onClick={() => handleSelect(contact.phone ?? contact.number)}
                    className="text-blue-500 px-2"
                    type="button"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id ?? contact._id ?? contact.phone)}
                    className="text-red-500 px-2"
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Contacts;
