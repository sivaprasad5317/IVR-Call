import './index.css';
import React, { useState, useEffect } from "react";
import Login from './components/Auth/Login';
import DialerPanel from './components/Dialer/DialerPanel';
import DTMFInput from './components/DTMF/DTMFInput';
import SpeechInput from './components/Speech/SpeechInput';
import CallHistory from './components/Calls/CallHistory';
import Contacts from './components/Contacts/Contacts';
import CallNotes from './components/Calls/CallNotes';
import CallRecordingPlayer from './components/Calls/CallRecordingPlayer';

function App() {
  const [user, setUser] = useState(null);
  // Shared phone number state for dialer and contact selection
  const [phone, setPhone] = useState('');
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
  }, []);
  
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-center mb-6">IVR Testing Tool</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <CallHistory />
          <CallRecordingPlayer recordingUrl="https://yourdomain.com/path/to/recording.mp3" />
          <CallNotes callId="12345" />
        </div>
        <div>
          <DialerPanel phone={phone} setPhone={setPhone} />
         </div>

        <div>
          <Contacts onSelect={setPhone} />
          <DTMFInput />
          <SpeechInput />
        </div>
      </div>
    </div>
  );
}

export default App;
