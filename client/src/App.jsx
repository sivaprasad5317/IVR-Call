import './index.css';
import React, { useState, useEffect } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { SignOutButton } from "./components/Auth/SignOutButton";
import DialerPanel from './components/Dialer/DialerPanel';
import DTMFInput from './components/DTMF/DTMFInput';
import SpeechInput from './components/Speech/SpeechInput';
import Contacts from './components/Contacts/Contacts';
import CallNotes from './components/Calls/CallNotes';
import IncomingCallModal from './components/Dialer/IncomingCallModal';

// 1. IMPORT THE HOOK
import { useCallManager } from "./hooks/useCallManager";

function App() {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState(''); 
  const [contacts, setContacts] = useState([]);
  const isAuthenticated = useIsAuthenticated();

  // 2. USE THE HOOK
  // We only need the Incoming Call features here.
  // The DialerPanel will call this hook separately for its own features.
  // (Our updated logic supports multiple components listening to the same events)
  const { incomingCaller, acceptCall, rejectCall } = useCallManager();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);

    const savedContacts = localStorage.getItem("contacts");
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
  }, []);

  const handleAddContact = (newContact) => {
    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    localStorage.setItem("contacts", JSON.stringify(updatedContacts));
  };

  const handleDeleteContact = (contactId) => {
    const updatedContacts = contacts.filter(contact => contact.id !== contactId);
    setContacts(updatedContacts);
    localStorage.setItem("contacts", JSON.stringify(updatedContacts));
  };

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
        
      {/* 3. CONDITIONAL RENDER
          Only show the modal if there is actually an incoming caller 
      */}
      {incomingCaller && (
        <IncomingCallModal 
            callerNumber={incomingCaller} 
            onAccept={acceptCall}
            onReject={rejectCall}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">IVR Testing Tool</h1>
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
               {/* Optional: Show who is logged in */}
               {localStorage.getItem("acs_user_id")?.split(":")?.[2]?.substring(0,8) || "Online"}...
            </span>
            <SignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Column: Tools */}
        <div className="flex flex-col gap-4">
          <DTMFInput />
          <SpeechInput />
        </div>
        
        {/* Center Column: Dialer */}
        <div>
          <DialerPanel 
            phone={phone} 
            setPhone={setPhone} 
            onSaveContact={handleAddContact}
          />
         </div>

        {/* Right Column: Contacts & Notes */}
        <div className="flex flex-col gap-4">
          <Contacts 
            contacts={contacts}
            onSelect={setPhone}
            onDelete={handleDeleteContact}
            onAdd={handleAddContact}
          />
          <CallNotes callId="12345" />
        </div>
      </div>
    </div>
  );
}

export default App;