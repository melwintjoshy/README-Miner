import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <GoogleOAuthProvider clientId='123890995190-pm9va1aupc6hotk1veu0cbr723kqck8o.apps.googleusercontent.com'>
    <AuthProvider>
      <App />
    </AuthProvider>
  </GoogleOAuthProvider>
);
