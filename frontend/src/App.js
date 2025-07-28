import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext'; // Import AuthProvider and AuthContext

import GitHubRepoInput from './GitHubRepoInput'; // Your existing component
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HistoryPage from './components/HistoryPage';
import ReadmeDetailPage from './components/ReadmeDetailPage';
import PrivateRoute from './components/PrivateRoute';
import './App.css'; // Your existing CSS file
import './index.css'; // Your existing CSS file

// --- Global Styles Injection (Moved from GitHubRepoInput.jsx) ---
const injectGlobalStyles = () => {
  const styleId = 'github-readme-global-styles';
  if (document.getElementById(styleId)) return; // Prevent multiple injections

  const styleSheet = document.createElement("style");
  styleSheet.id = styleId;
  styleSheet.innerText = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f7faff;
      overflow-x: hidden; /* Prevents horizontal scroll */
    }

    .aurora-bg {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }

    .aurora-layer {
      position: absolute;
      width: 140vw;
      height: 140vh;
      filter: blur(90px);
      opacity: 0.4;
      animation: floatMove 18s linear infinite alternate;
      background:
        radial-gradient(circle at 50% 30%, #6ab7ff 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, #d0eaff 0%, transparent 60%),
        radial-gradient(circle at 80% 70%, #5a9dff 0%, transparent 60%);
    }

    .aurora-layer-2 {
      filter: blur(120px);
      opacity: 0.35;
      animation: floatMove2 24s linear infinite alternate;
      background:
        radial-gradient(circle at 60% 40%, #b7eaff 0%, transparent 70%),
        radial-gradient(circle at 40% 60%, #4a7dff 0%, transparent 70%);
    }

    @keyframes floatMove {
      from { transform: translate(-5vw, -10vh) scale(1); }
      to { transform: translate(10vw, 5vh) scale(1.2); }
    }

    @keyframes floatMove2 {
      from { transform: translate(10vw, 5vh) scale(1); }
      to { transform: translate(-10vw, -10vh) scale(1.1); }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(styleSheet);
};
// --- End Global Styles Injection ---


// Component for the navigation bar
const NavBar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);

  // Define inline styles for the navbar to match the aesthetic
  const navStyles = {
    navbar: {
      background: 'rgba(255, 255, 255, 0.7)',
      boxShadow: '0 4px 12px rgba(61, 138, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '0 0 15px 15px',
      padding: '15px 30px',
      display: 'flex',
      justifyContent: 'flex-end', // Align items to the right
      gap: '20px', // Space between links/buttons
      position: 'fixed', // Make it stick to the top
      width: '100%',
      top: 0,
      left: 0,
      zIndex: 1000, // Ensure it's above other content
      boxSizing: 'border-box', // Include padding in width calculation
    },
    navLink: {
      color: '#1a5a99',
      textDecoration: 'none',
      padding: '10px 15px',
      borderRadius: '8px',
      fontWeight: 600,
      fontSize: '1rem',
      transition: 'all 0.2s ease-in-out',
    },
    navLinkHover: {
      background: 'rgba(61, 138, 255, 0.1)',
      color: '#3d8aff',
    },
    navButton: {
      background: 'linear-gradient(95deg, #3d8aff, #2a7de8)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: 600,
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      boxShadow: '0 4px 10px rgba(61, 138, 255, 0.2)',
    },
    navButtonHover: {
      opacity: 0.9,
      transform: 'translateY(-1px)',
    }
  };

  return (
    <nav style={navStyles.navbar}>
      <Link
        to="/"
        style={navStyles.navLink}
        onMouseEnter={e => Object.assign(e.target.style, navStyles.navLinkHover)}
        onMouseLeave={e => Object.assign(e.target.style, navStyles.navLink)}
      >
        Home
      </Link>
      {isAuthenticated ? (
        <>
          <Link
            to="/history"
            style={navStyles.navLink}
            onMouseEnter={e => Object.assign(e.target.style, navStyles.navLinkHover)}
            onMouseLeave={e => Object.assign(e.target.style, navStyles.navLink)}
          >
            History
          </Link>
          <button
            onClick={logout}
            style={navStyles.navButton}
            onMouseEnter={e => Object.assign(e.target.style, navStyles.navButtonHover)}
            onMouseLeave={e => Object.assign(e.target.style, navStyles.navButton)}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            style={navStyles.navLink}
            onMouseEnter={e => Object.assign(e.target.style, navStyles.navLinkHover)}
            onMouseLeave={e => Object.assign(e.target.style, navStyles.navLink)}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={navStyles.navLink}
            onMouseEnter={e => Object.assign(e.target.style, navStyles.navLinkHover)}
            onMouseLeave={e => Object.assign(e.target.style, navStyles.navLink)}
          >
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
};

// Main content wrapper, handles padding for fixed navbar
function AppContent() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <>
      <NavBar />
      {/* This div adds padding to prevent content from being hidden behind the fixed navbar */}
      <div style={{ paddingTop: '80px' }}> {/* Adjust this value based on your actual navbar height */}
        <Routes>
          {/* Main page for generating READMEs */}
          <Route path="/" element={<GitHubRepoInput />} />

          {/* Authentication Routes */}
          {/* If authenticated, redirect from login/register to history */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/history" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/history" /> : <RegisterPage />} />

          {/* Protected Routes: Navigate to login if not authenticated */}
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <HistoryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/history/:readmeId"
            element={
              <PrivateRoute>
                <ReadmeDetailPage />
              </PrivateRoute>
            }
/>


          {/* Catch-all for undefined routes */}
          <Route path="*" element={<h2>404 Not Found</h2>} />
        </Routes>
      </div>
    </>
  );
}

// Root App component
function App() {
  // Inject global styles once when the App component mounts
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  return (
    <Router>
      <AuthProvider> {/* Wrap your entire app with AuthProvider */}
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;