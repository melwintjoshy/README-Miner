import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  // Using destructuring with default empty object as a safeguard
  const { login } = authContext || {};

  // Debug log 1: See what useContext actually returns
  console.log('LoginPage: AuthContext value directly from useContext:', authContext);
  // Debug log 2: See what 'login' is after destructuring
  console.log('LoginPage: Extracted login function:', login);

  useEffect(() => {
    /* global google */
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: '123890995190-pm9va1aupc6hotk1veu0cbr723kqck8o.apps.googleusercontent.com',
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin'),
        { theme: 'outline', size: 'large' }
      );

      console.log("Google object:", window.google);
      console.log("GSI initialized?", window.google?.accounts?.id);

      window.google.accounts.id.prompt();
    } else {
      console.error('Google GSI script not loaded or initialized correctly.');
    }
  }, [login]); // Add login to dependency array to re-run if it changes

  const handleCredentialResponse = (response) => {
    // Debug log 3: See the response from Google
    console.log('LoginPage: Google Credential Response:', response);
    // Debug log 4: Confirm 'login' is still a function here
    console.log('LoginPage: Type of login in handleCredentialResponse:', typeof login);

    if (login) {
      login(response.credential); // Calls context login (which internally calls setToken)
      navigate('/');
    } else {
      console.error('❌ LoginPage: login is undefined. Make sure AuthProvider wraps App and provides "login".');
    }
  };

  return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <h1>Login with Google</h1>
      <div id="google-signin"></div>
    </div>
  );
};

export default LoginPage;