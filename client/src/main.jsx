import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import App from './App';
import './index.css';
import { msalConfig } from './components/Auth/authConfig';
import { SignInButton } from './components/Auth/SignInButton';

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthenticatedTemplate>
        <App />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <h2 className="text-xl mb-4">Please sign in to access the application</h2>
          <SignInButton />
        </div>
      </UnauthenticatedTemplate>
    </MsalProvider>
  </React.StrictMode>
);
