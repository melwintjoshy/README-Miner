import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GitHubRepoInput from './GitHubRepoInput';
import LoginPage from './components/LoginPage';
import { AuthProvider } from './context/AuthContext'; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<GitHubRepoInput />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
