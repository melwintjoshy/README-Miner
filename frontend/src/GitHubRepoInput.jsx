import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { apiCall } from './services/api'; 

function GitHubRepoInput() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isReady, setIsReady] = useState(false); // Indicates if README is ready for download/copy
  const [isLoading, setIsLoading] = useState(false); // Indicates if generation is in progress
  const [message, setMessage] = useState(''); // Status messages (success, info)
  const [error, setError] = useState(''); // Error messages
  const [generatedReadme, setGeneratedReadme] = useState(''); // Stores the generated README content
  const readmePreviewRef = useRef(null); // Ref for scrolling to README preview

  // Get authentication context (token and isAuthenticated status)
  const { token, isAuthenticated } = useContext(AuthContext);

  const backendBaseUrl = 'http://localhost:8000'; //  backend URL

  // Handlers
  const handleUrlChange = (event) => {
    setRepoUrl(event.target.value);
    // Reset states when URL changes
    setIsReady(false);
    setMessage('');
    setError('');
    setGeneratedReadme('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Check if user is authenticated before proceeding
    if (!isAuthenticated) {
      setMessage(' Please log in to generate and save READMEs.');
      return;
    }

    // Input validation
    if (!repoUrl.trim()) {
      setMessage('❌ Please enter a GitHub repository URL.');
      return;
    }

    // Reset states and show loading indicator
    setIsLoading(true);
    setMessage('');
    setError('');
    setGeneratedReadme('');
    setIsReady(false);

    try {
      // Step 1: Request README generation from backend
      // Use apiCall and pass the authentication token
      await apiCall('/get_readme', 'POST', { repo_url: repoUrl }, token);
      setMessage("README generation initiated successfully! Fetching content...");

      // Step 2: Fetch the generated README content (this requires a separate call as /get_readme returns immediately)
      // We use a direct fetch here because apiCall is designed for JSON responses,
      // but /download_readme returns a text/markdown blob.
      const readmeResponse = await fetch(`${backendBaseUrl}/download_readme`, {
        headers: {
          'Authorization': `Bearer ${token}`, //Include the token for authorization
        },
      });

      if (readmeResponse.ok) {
        const readmeText = await readmeResponse.text();
        setGeneratedReadme(readmeText);
        setMessage('✅ README generated successfully!');
        setIsReady(true);
        //  Scroll to the README preview after generation
        readmePreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const errorData = await readmeResponse.json();
        setError(`❌ Failed to download README from server: ${errorData.detail || 'Unknown error'}`);
        setIsReady(false);
      }
    } catch (apiError) {
      console.error("API Error:", apiError);
      setError(`❌ An error occurred: ${apiError.message}. Please try again.`);
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedReadme) {
      setMessage('No README to download. Generate one first!');
      return;
    }
    // Check authentication for direct download (though it's user-generated)
    if (!isAuthenticated) {
      setMessage('❌ Please log in to download READMEs.');
      return;
    }

    try {
      // Create a Blob from the README content
      const blob = new Blob([generatedReadme], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob); // Create a URL for the Blob
      const a = document.createElement('a'); // Create a temporary anchor element
      a.href = url;
      a.download = 'README.md'; // Set the download filename
      document.body.appendChild(a); // Append to body (required for Firefox)
      a.click(); // Programmatically click the link to trigger download
      document.body.removeChild(a); // Clean up the temporary link
      URL.revokeObjectURL(url); // Release the object URL
      setMessage('⬇️ Download started!');
    } catch (downloadError) {
      console.error("Download Error:", downloadError);
      setError('❌ Failed to initiate download.');
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && generatedReadme) {
      navigator.clipboard.writeText(generatedReadme)
        .then(() => setMessage('📋 Copied to clipboard!'))
        .catch(() => setMessage('❌ Failed to copy.'));
    } else {
      setMessage('❌ Clipboard API not supported or no content.');
    }
  };

  const styles = {
    centerContainer: {
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      boxSizing: 'border-box',
    },
    glassCard: {
      background: 'rgba(255, 255, 255, 0.7)',
      boxShadow: '0 8px 32px 0 rgba(61, 138, 255, 0.15)',
      borderRadius: '24px',
      padding: '40px 50px',
      backdropFilter: 'blur(18px)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      width: '100%',
      maxWidth: '680px',
      textAlign: 'center',
      animation: 'fadeIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards',
      transition: 'all 0.3s ease',
    },
    title: {
      fontWeight: 700,
      fontSize: '2.25rem',
      color: '#1a5a99',
      marginBottom: '8px',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      color: '#5a82a8',
      fontSize: '1.1rem',
      marginBottom: '32px',
      fontWeight: 400,
    },
    form: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexDirection: 'column',
      '@media (min-width: 600px)': {
        flexDirection: 'row',
      }
    },
    input: {
      flex: '1 1 auto',
      fontSize: '1rem',
      padding: '14px 20px',
      borderRadius: '12px',
      outline: 'none',
      border: '1.5px solid #c0d9ff',
      background: '#ffffff',
      color: '#1a5a99',
      boxShadow: '0 2px 8px rgba(61, 138, 255, 0.05)',
      transition: 'all 0.2s ease-in-out',
      fontWeight: 500,
    },
    button: {
      flexShrink: 0,
      padding: '14px 28px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: 600,
      fontFamily: 'inherit',
      background: 'linear-gradient(95deg, #3d8aff, #2a7de8)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'all 0.2s ease-in-out',
      boxShadow: '0 4px 12px rgba(61, 138, 255, 0.2)',
    },
    buttonLoading: {
      background: '#90bfff',
      cursor: 'not-allowed',
      boxShadow: 'none',
      transform: 'translateY(0)',
    },
    message: {
      margin: '0 auto 16px auto',
      fontSize: '0.95rem',
      color: '#1a5a99',
      padding: '10px 18px',
      borderRadius: '10px',
      background: 'rgba(112, 184, 255, 0.15)',
      fontWeight: 500,
      display: 'inline-block',
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
      animation: 'fadeIn 0.5s ease forwards',
    },
    actionButton: {
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: 600,
      fontSize: '0.95rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    downloadButton: {
      background: 'linear-gradient(95deg, #1e88e5, #1565c0)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
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
    link: {
      color: '#3d8aff',
      textDecoration: 'none',
      fontWeight: 500,
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
    }
  };

  return (
    <>
      {/* Aurora background elements (these are handled by global CSS injected in App.js) */}
      <div className="aurora-bg">
        <div className="aurora-layer"></div>
        <div className="aurora-layer-2"></div>
      </div>

      {/* Main content container */}
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
              disabled={isLoading || !isAuthenticated} // Disable if loading or not authenticated
              autoFocus
            />
            <button
              type="submit"
              style={{
                ...styles.button,
                // Apply loading or disabled style if loading or not authenticated
                ...(isLoading || !isAuthenticated ? styles.buttonLoading : {})
              }}
              disabled={isLoading || !isAuthenticated} // Disable if loading or not authenticated
            >
              {isLoading ? 'Mining…' : 'Generate'}
            </button>
          </form>

          {/* Display general status messages */}
          {message && (
            <p style={{
              ...styles.message,
              // Apply error specific styling if message starts with '❌'
              ...(message.startsWith('❌') ? styles.errorMessage : {})
            }}>
              {message}
            </p>
          )}
          {/* Display specific error messages */}
          {error && (
            <p style={{ ...styles.message, ...styles.errorMessage }}>
              {error}
            </p>
          )}

          {/* Conditional rendering for generated README preview and actions */}
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
