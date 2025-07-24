import React, { useState, useEffect, useRef } from 'react';

// --- Global Styles (same as before) ---
const injectGlobalStyles = () => {
  const styleId = 'github-readme-global-styles';
  if (document.getElementById(styleId)) return;

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
      overflow-x: hidden;
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

function GitHubRepoInput() {
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  const [repoUrl, setRepoUrl] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedReadme, setGeneratedReadme] = useState('');
  const readmePreviewRef = useRef(null);

  const backendBaseUrl = 'http://localhost:8000';

  const handleUrlChange = (event) => {
    setRepoUrl(event.target.value);
    setIsReady(false);
    setMessage('');
    setGeneratedReadme('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!repoUrl.trim()) {
      setMessage('❌ Please enter a GitHub repository URL.');
      return;
    }
    setIsLoading(true);
    setMessage('');
    setGeneratedReadme('');
    setIsReady(false);

    try {
      const response = await fetch(`${backendBaseUrl}/get_readme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (response.ok) {
        // Wait a moment for backend to finish processing (if async)
        // Then fetch the generated README
        const readmeResponse = await fetch(`${backendBaseUrl}/download_readme`);
        if (readmeResponse.ok) {
          const readmeText = await readmeResponse.text();
          setGeneratedReadme(readmeText);
          setMessage('✅ README generated successfully!');
          setIsReady(true);
        } else {
          setMessage('❌ Failed to download README from server.');
          setIsReady(false);
        }
      } else {
        const errorData = await response.json();
        setMessage(`❌ ${errorData.detail || 'Failed to generate README.'}`);
        setIsReady(false);
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessage('❌ An error occurred. Please try again.');
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
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
  };

  const handleCopy = () => {
    if (navigator.clipboard && generatedReadme) {
      navigator.clipboard.writeText(generatedReadme)
        .then(() => setMessage('📋 Copied to clipboard!'))
        .catch(() => setMessage('❌ Failed to copy.'));
    }
  };

  const styles = {
    centerContainer: {
      minHeight: '100vh',
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
      maxHeight: '200px',
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
      <div className="aurora-bg">
        <div className="aurora-layer"></div>
        <div className="aurora-layer-2"></div>
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
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonLoading : {})
              }}
              disabled={isLoading}
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
