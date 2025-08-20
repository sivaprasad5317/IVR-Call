import React, { useState } from 'react';

const mockContacts = [
  { id: 1, name: 'Support Line', number: '+1234567890' },
  { id: 2, name: 'QA Bot', number: '+1987654321' },
];

export default function Contacts({ onSelect }) {
  const [contacts, setContacts] = useState(mockContacts);

  const handleSelect = (number) => {
    if (onSelect) onSelect(number);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 max-w-md mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-4">Saved Contacts</h2>
      <ul className="divide-y divide-gray-200">
        {contacts.map((contact) => (
          <li
            key={contact.id}
            className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-2 rounded"
            onClick={() => handleSelect(contact.number)}
          >
            <div>
              <p className="font-medium">{contact.name}</p>
              <p className="text-sm text-gray-500">{contact.number}</p>
            </div>
            <button
              className="text-blue-600 hover:underline text-sm"
              title="Dial"
            >
              Dial
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
