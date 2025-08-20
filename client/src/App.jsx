import './index.css';
import { useState } from 'react';
import DialerPanel from './components/DialerPanel';
import DTMFInput from './components/DTMFInput';
import SpeechInput from './components/SpeechInput';
import CallHistory from './components/CallHistory';
import Contacts from './components/Contacts';
import CallNotes from './components/CallNotes';
import CallRecordingPlayer from './components/CallRecordingPlayer';

function App() {
  // Shared phone number state for dialer and contact selection
  const [phone, setPhone] = useState('');

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
