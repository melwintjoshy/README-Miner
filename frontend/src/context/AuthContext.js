import React, { createContext, useState } from 'react';

const getApiBase = () => {
  const envBase = process.env.REACT_APP_API_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  return window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://readme-miner.onrender.com';
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, updateToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(null);

  const login = async (googleCredential) => {
    try {
      const res = await fetch(`${getApiBase()}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: googleCredential })
      });
      if (!res.ok) {
        throw new Error('Auth failed');
      }
      const data = await res.json();
      const accessToken = data.access_token;
      updateToken(accessToken);
      localStorage.setItem('access_token', accessToken);
      return true;
    } catch (e) {
      console.error('Auth error:', e);
      return false;
    }
  };

  const logout = () => {
    updateToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
  };

  const authContextValue = {
    token,
    user,
    setToken: updateToken, // Rename exposed setter to match your usage
    setUser,
    isAuthenticated: !!token,
    login,
    logout,
    setIsAuthenticated: (val) => {
      if (val) {
        // Future logic (optional)
      } else {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
