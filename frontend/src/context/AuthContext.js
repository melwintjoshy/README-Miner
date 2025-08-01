import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, updateToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(null);

  const login = (newToken) => {
    console.log('AuthProvider: "login" called with newToken:', newToken);
    updateToken(newToken);
    localStorage.setItem('access_token', newToken);
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
