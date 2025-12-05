import './index.css';
import React, { useState, useEffect } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { SignOutButton } from "./components/Auth/SignOutButton";
import DialerPanel from './components/Dialer/DialerPanel';
import DTMFInput from './components/DTMF/DTMFInput';
import SpeechInput from './components/Speech/SpeechInput';
// import CallHistory from './components/Calls/CallHistory';
import Contacts from './components/Contacts/Contacts';
import CallNotes from './components/Calls/CallNotes';
// import CallRecordingPlayer from './components/Calls/CallRecordingPlayer';

function App() {
  const [user, setUser] = useState(null);
  
  // This 'phone' state will now strictly represent the destination number.
  // DTMF digits will be handled locally inside DialerPanel.
  const [phone, setPhone] = useState(''); 
  
  const [contacts, setContacts] = useState([]);
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);

    // Load contacts from localStorage on component mount
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
    return null; // Or return a Login component here
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header with title and logout button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">IVR Testing Tool</h1>
        <SignOutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Column: Notes & History */}
        <div>
          {/* <CallHistory /> */}
          {/* <CallRecordingPlayer recordingUrl="..." /> */}
          <CallNotes callId="12345" />
        </div>
        
        {/* Center Column: Dialer */}
        <div>
          <DialerPanel 
            phone={phone} 
            setPhone={setPhone} 
            onSaveContact={handleAddContact}
          />
         </div>

        {/* Right Column: Contacts & Tools */}
        <div>
          <Contacts 
            contacts={contacts}
            onSelect={setPhone}
            onDelete={handleDeleteContact}
            onAdd={handleAddContact}
          />
          {/* These components below might be redundant if DialerPanel handles DTMF, 
              but keeping them as standalone tools is fine. */}
          <DTMFInput />
          <SpeechInput />
        </div>
      </div>
    </div>
  );
}

export default App;