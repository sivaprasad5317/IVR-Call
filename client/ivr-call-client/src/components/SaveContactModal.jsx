import React from 'react';

export default function SaveContactModal({
  contactName,
  contactNumber,
  setContactName,
  setContactNumber,
  onSave,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Save Contact</h2>

        <input
          type="text"
          placeholder="Name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="text"
          placeholder="Number"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
