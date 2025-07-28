import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(null); // Optional: store user details if fetched from /users/me

  useEffect(() => {
    // Attempt to fetch user details if a token exists on app load
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token might be expired or invalid on the backend
            console.error("Failed to fetch user, logging out.");
            logout(); // Clear invalid token
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          logout(); // Clear token on network/API error
        }
      }
    };
    fetchUser();
  }, [token]); // Re-run if token changes (e.g., after login/logout)

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('access_token', newToken);
    // After login, you might want to immediately fetch user data here if not done in useEffect
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
  };

  const authContextValue = {
    token,
    user,
    isAuthenticated: !!token, // True if token exists
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};