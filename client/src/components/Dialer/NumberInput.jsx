import React from "react";
import { FiUserPlus } from "react-icons/fi";

export default function NumberInput({ phone, setPhone, onOpenSave }) {
  return (
    <div className="flex items-center gap-2">
      <input
        className="flex-1 text-xl px-3 py-2 border rounded focus:outline-none focus:ring"
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/[^\d*#+]/g, ""))}
        placeholder="Enter phone number"
        inputMode="tel"
        aria-label="Phone number"
      />
      <button
        className="text-gray-500 hover:text-blue-600"
        title="Save Contact"
        onClick={onOpenSave}
      >
        <FiUserPlus size={24} />
      </button>
    </div>
  );
}