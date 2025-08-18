import React, { useState, useEffect, useRef } from 'react';
import { CallClient, CallAgent, Call, DeviceManager, LocalVideoStream, IncomingCall, VideoStreamRenderer } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

interface CallingComponentProps {}

const CallingComponent: React.FC<CallingComponentProps> = () => {
  const [callAgent, setCallAgent] = useState<CallAgent | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [deviceManager, setDeviceManager] = useState<DeviceManager | null>(null);
  const [callState, setCallState] = useState<string>('None');
  const [destinationUserId, setDestinationUserId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  // Replace with your actual token from Azure Communication Services
  const userAccessToken = process.env.REACT_APP_ACS_TOKEN || 'YOUR_ACS_TOKEN_HERE';

  useEffect(() => {
    initializeCallAgent();
  }, []);

  const initializeCallAgent = async () => {
    try {
      const callClient = new CallClient();
      const tokenCredential = new AzureCommunicationTokenCredential(userAccessToken);
      
      const agent = await callClient.createCallAgent(tokenCredential);
      const deviceMgr = await callClient.getDeviceManager();
      
      setCallAgent(agent);
      setDeviceManager(deviceMgr);
      setIsInitialized(true);

      // Subscribe to call state changes
      agent.on('incomingCall', (args) => {
        const incoming = args.incomingCall;
        setIncomingCall(incoming);
        setCallState('Incoming');

        // Set up incoming call event listeners
        incoming.on('callEnded', () => {
          setIncomingCall(null);
          setCall(null);
          setCallState('None');
        });
      });

    } catch (error) {
      console.error('Failed to initialize call agent:', error);
    }
  };

  const startCall = async () => {
    if (!callAgent || !destinationUserId) return;

    try {
      const call = callAgent.startCall([{ communicationUserId: destinationUserId }]);
      setCall(call);
      
      call.on('stateChanged', () => {
        setCallState(call.state);
      });

      call.on('remoteParticipantsUpdated', (e) => {
        e.added.forEach((participant) => {
          participant.on('videoStreamsUpdated', (e) => {
            e.added.forEach(async (stream) => {
              try {
                const renderer = new VideoStreamRenderer(stream);
                const view = await renderer.createView();
                if (remoteVideoRef.current && view.target instanceof HTMLElement) {
                  remoteVideoRef.current.appendChild(view.target);
                }
              } catch (error) {
                console.error('Error rendering remote video:', error);
              }
            });
          });
        });
      });

    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const endCall = async () => {
    if (call) {
      await call.hangUp();
      setCall(null);
      setCallState('None');
    }
  };

  const answerCall = async () => {
    if (incomingCall) {
      try {
        const acceptedCall = await incomingCall.accept();
        setCall(acceptedCall);
        setIncomingCall(null);
        
        // Set up call event listeners
        acceptedCall.on('stateChanged', () => {
          setCallState(acceptedCall.state);
        });

        acceptedCall.on('remoteParticipantsUpdated', (e) => {
          e.added.forEach((participant) => {
            participant.on('videoStreamsUpdated', (e) => {
              e.added.forEach(async (stream) => {
                try {
                  const renderer = new VideoStreamRenderer(stream);
                  const view = await renderer.createView();
                  if (remoteVideoRef.current && view.target instanceof HTMLElement) {
                    remoteVideoRef.current.appendChild(view.target);
                  }
                } catch (error) {
                  console.error('Error rendering remote video:', error);
                }
              });
            });
          });
        });
      } catch (error) {
        console.error('Failed to answer call:', error);
      }
    }
  };

  const rejectCall = async () => {
    if (incomingCall) {
      await incomingCall.reject();
      setIncomingCall(null);
      setCall(null);
      setCallState('None');
    }
  };

  const toggleLocalVideo = async () => {
    if (!call || !deviceManager) return;

    try {
      const cameras = await deviceManager.getCameras();
      if (cameras.length > 0) {
        const localVideoStream = new LocalVideoStream(cameras[0]);
        
        if (call.localVideoStreams.length === 0) {
          await call.startVideo(localVideoStream);
          try {
            const renderer = new VideoStreamRenderer(localVideoStream);
            const view = await renderer.createView();
            if (localVideoRef.current && view.target instanceof HTMLElement) {
              // Clear previous content
              localVideoRef.current.innerHTML = '';
              localVideoRef.current.appendChild(view.target);
            }
          } catch (error) {
            console.error('Error rendering local video:', error);
          }
        } else {
          await call.stopVideo(call.localVideoStreams[0]);
          if (localVideoRef.current) {
            localVideoRef.current.innerHTML = '';
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  if (!isInitialized) {
    return <div>Initializing Azure Communication Services...</div>;
  }

  return (
    <div className="calling-component">
      <div className="call-controls">
        <h2>Call Status: {callState}</h2>
        
        {callState === 'None' && (
          <div>
            <input
              type="text"
              placeholder="Enter user ID to call"
              value={destinationUserId}
              onChange={(e) => setDestinationUserId(e.target.value)}
            />
            <button onClick={startCall} disabled={!destinationUserId}>
              Start Call
            </button>
          </div>
        )}

        {callState === 'Incoming' && (
          <div>
            <p>Incoming call...</p>
            <button onClick={answerCall}>Answer</button>
            <button onClick={rejectCall}>Reject</button>
          </div>
        )}

        {(callState === 'Connected' || callState === 'LocalHold' || callState === 'RemoteHold') && (
          <div>
            <button onClick={endCall}>End Call</button>
            <button onClick={toggleLocalVideo}>Toggle Video</button>
          </div>
        )}
      </div>

      <div className="video-container">
        <div className="local-video">
          <h3>Local Video</h3>
          <div ref={localVideoRef} style={{ width: '300px', height: '200px', border: '1px solid #ccc' }} />
        </div>
        <div className="remote-video">
          <h3>Remote Video</h3>
          <div ref={remoteVideoRef} style={{ width: '300px', height: '200px', border: '1px solid #ccc' }} />
        </div>
      </div>
    </div>
  );
};

export default CallingComponent;
