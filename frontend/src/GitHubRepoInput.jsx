import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { apiCall } from './services/api';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';

function GitHubRepoInput() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [generatedReadme, setGeneratedReadme] = useState('');
  const readmePreviewRef = useRef(null);

  const {
    token,
    isAuthenticated,
    setToken,
    setIsAuthenticated
  } = useContext(AuthContext);

  const backendBaseUrl =
    window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://your-deployed-backend.com'; // <-- Change for production

  const handleUrlChange = (event) => {
    setRepoUrl(event.target.value);
    setIsReady(false);
    setMessage('');
    setError('');
    setGeneratedReadme('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setMessage('Please log in to generate and save READMEs.');
      return;
    }

    if (!repoUrl.trim()) {
      setMessage('❌ Please enter a GitHub repository URL.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');
    setGeneratedReadme('');
    setIsReady(false);

    try {
      await apiCall('/get_readme', 'POST', { repo_url: repoUrl }, token);
      setMessage('README generation initiated successfully! Fetching content...');

      const readmeResponse = await fetch(`${backendBaseUrl}/download_readme`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (readmeResponse.ok) {
        const readmeText = await readmeResponse.text();
        setGeneratedReadme(readmeText);
        setMessage('✅ README generated successfully!');
        setIsReady(true);
        readmePreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const errorData = await readmeResponse.json();
        setError(`❌ Failed to download README: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (apiError) {
      console.error('API Error:', apiError);
      setError(`❌ An error occurred: ${apiError.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedReadme) {
      setMessage('No README to download.');
      return;
    }

    if (!isAuthenticated) {
      setMessage('❌ Please log in to download READMEs.');
      return;
    }

    try {
      const blob = new Blob([generatedReadme], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'README.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('⬇️ Download started!');
    } catch (downloadError) {
      console.error('Download Error:', downloadError);
      setError('❌ Failed to download README.');
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && generatedReadme) {
      navigator.clipboard
        .writeText(generatedReadme)
        .then(() => setMessage('📋 Copied to clipboard!'))
        .catch(() => setMessage('❌ Failed to copy.'));
    } else {
      setMessage('❌ Clipboard not supported.');
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
  const token = credentialResponse.credential;
  localStorage.setItem('access_token', token);
  setToken(token);
  setIsAuthenticated(true);

  // Save user in backend
  try {
    await apiCall('/store_user', 'POST', { token });
    console.log('✅ User stored successfully in backend');
  } catch (err) {
    console.error('❌ Failed to store user:', err.message);
  }
};


  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('access_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  const styles = {
    centerContainer: {
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
    },
    glassCard: {
      background: 'rgba(255, 255, 255, 0.7)',
      boxShadow: '0 8px 32px rgba(61,138,255,0.15)',
      borderRadius: '24px',
      padding: '40px 50px',
      backdropFilter: 'blur(18px)',
      width: '100%',
      maxWidth: '680px',
      textAlign: 'center',
    },
    title: {
      fontWeight: 700,
      fontSize: '2.25rem',
      color: '#1a5a99',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#5a82a8',
      fontSize: '1.1rem',
      marginBottom: '32px',
    },
    input: {
      flex: 1,
      padding: '14px 20px',
      borderRadius: '12px',
      border: '1.5px solid #c0d9ff',
      background: '#fff',
      fontSize: '1rem',
      fontWeight: 500,
    },
    button: {
      padding: '14px 28px',
      borderRadius: '12px',
      border: 'none',
      background: 'linear-gradient(95deg, #3d8aff, #2a7de8)',
      color: '#fff',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '1rem',
    },
    buttonLoading: {
      background: '#90bfff',
      cursor: 'not-allowed',
    },
    message: {
      marginBottom: '16px',
      fontSize: '0.95rem',
      color: '#1a5a99',
      padding: '10px 18px',
      borderRadius: '10px',
      background: 'rgba(112, 184, 255, 0.15)',
      border: '1px solid rgba(112, 184, 255, 0.2)',
    },
    errorMessage: {
      background: 'rgba(255, 225, 230, 0.8)',
      color: '#c93a69',
      border: '1px solid rgba(255, 150, 150, 0.3)',
    },
    actionContainer: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      marginTop: '20px',
    },
    actionButton: {
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: 600,
      fontSize: '0.95rem',
      border: 'none',
      cursor: 'pointer',
    },
    downloadButton: {
      background: 'linear-gradient(95deg, #1e88e5, #1565c0)',
      color: 'white',
    },
    copyButton: {
      background: 'rgba(230, 240, 255, 0.8)',
      color: '#1a5a99',
      border: '1px solid #c0d9ff',
    },
    footer: {
      textAlign: 'center',
      marginTop: '40px',
      color: '#5a82a8',
      fontSize: '0.9rem',
      opacity: 0.8,
    },
    readmePreview: {
      background: '#f9faff',
      border: '1px solid #e0eaf8',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '24px',
      textAlign: 'left',
      maxHeight: '300px',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      color: '#334155',
      lineHeight: 1.6,
    },
  };

  return (
    <>
      <div className="aurora-bg">
        <div className="aurora-layer"></div>
        <div className="aurora-layer-2"></div>
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
        {!isAuthenticated ? (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.log('Login Failed')}
          />
        ) : (
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        )}
      </div>

      <main style={styles.centerContainer}>
        <section style={styles.glassCard}>
          <h1 style={styles.title}>README Miner</h1>
          <p style={styles.subtitle}>Crafting the perfect READMEs, effortlessly.</p>

          <form
           onSubmit={handleSubmit}
           style={{
            display: 'flex',
           gap: '12px',
           marginBottom: '24px',
           flexDirection: window.innerWidth >= 600 ? 'row' : 'column'
          }} 
          >
            <input
              type="text"
              value={repoUrl}
              onChange={handleUrlChange}
              placeholder="Paste a public GitHub repository URL"
              style={styles.input}
              disabled={isLoading || !isAuthenticated}
              autoFocus
            />
            <button
              type="submit"
              style={{
                ...styles.button,
                ...(isLoading || !isAuthenticated ? styles.buttonLoading : {})
              }}
              disabled={isLoading || !isAuthenticated}
            >
              {isLoading ? 'Mining…' : 'Generate'}
            </button>
          </form>

          {message && (
            <p style={{ 
              ...styles.message, 
              ...(message.startsWith('❌') ? styles.errorMessage : {})
              }}>
              {message}
            </p>
          )}
          {error && (
            <p style={{ ...styles.message, ...styles.errorMessage }}>
              {error}
            </p>
          )}

          {isReady && generatedReadme && (
            <>
              <div ref={readmePreviewRef} style={styles.readmePreview}>
                <code>{generatedReadme}</code>
              </div>
              <div style={styles.actionContainer}>
                <button style={{...styles.actionButton, ...styles.downloadButton}} onClick={handleDownload}>
                  Download .md
                </button>
                <button style={{...styles.actionButton, ...styles.copyButton}} onClick={handleCopy}>
                  Copy Content
                </button>
              </div>
            </>
          )}
        </section>

        <footer style={styles.footer}>
          <a href="https://github.com" style={styles.link} target="_blank" rel="noopener noreferrer">
            Built with ❤️ and React
          </a>
        </footer>
      </main>
    </>
  );
}

export default GitHubRepoInput;
