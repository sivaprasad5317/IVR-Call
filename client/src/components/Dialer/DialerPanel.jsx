import React, { useState } from "react";
import NumberInput from "./NumberInput";
import CallStatus from "./CallStatus";
import DialPad from "./DialPad";
import CallControls from "./CallControls";
import SaveContactModal from "./SaveContactModal";
import { useCallManager } from "../../hooks/useCallManager";
import { useCallTimer } from "../../hooks/useCallTimer";
import { contactService } from "../../services/contactService";

export default function DialerPanel({ phone, setPhone }) {
  const [showModal, setShowModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState(null);

  // Centralized call manager (handles ACS init, start/end, mute, WS fallback)
  const { status, calling, muted, startCall, endCall, toggleMuteCall } = useCallManager();

  // Timer for connected calls
  const { duration } = useCallTimer(status);

  // Open save contact modal (we keep modal logic here so it has access to contactService)
  const openSaveModal = () => {
    setContactName("");
    setContactNumber(phone);
    setShowModal(true);
  };

  const handleSaveContact = async () => {
    try {
      await contactService.addContact({ name: contactName, phone: contactNumber });
      setShowModal(false);
      setContactName("");
      setContactNumber("");
      setError(null);
    } catch (err) {
      console.error("Failed to save contact:", err);
      setError(err?.message || "Failed to save contact");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4">
      {/* Number input or call status */}
      {status === "idle" ? (
        <NumberInput
          phone={phone}
          setPhone={setPhone}
          onOpenSave={() => openSaveModal()}
        />
      ) : (
        <CallStatus phone={phone} status={status} duration={duration} />
      )}

      {/* Dial pad */}
      <DialPad
        onDigit={(digit) => setPhone((p) => p + digit)}
      />

      {/* Call controls */}
      <CallControls
        phone={phone}
        calling={calling}
        muted={muted}
        onCall={() => (calling ? endCall() : startCall(phone))}
        onMute={toggleMuteCall}
        onBackspace={() => setPhone((p) => p.slice(0, -1))}
      />

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {showModal && (
        <SaveContactModal
          contactName={contactName}
          contactNumber={contactNumber}
          setContactName={setContactName}
          setContactNumber={setContactNumber}
          onSave={handleSaveContact}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}