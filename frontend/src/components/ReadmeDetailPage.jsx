import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiCall } from '../services/api';
import ReactMarkdown from 'react-markdown';

function ReadmeDetailPage() {
  const { readmeId } = useParams(); // Get the ID from the URL
  const [readmeContent, setReadmeContent] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchReadme = async () => {
      if (!token) {
        setError("Please log in to view this README.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await apiCall(`/history/${readmeId}`, 'GET', null, token);
        setReadmeContent(data.readme_content);
        setRepoUrl(data.repo_url);
        setGeneratedAt(new Date(data.generated_at).toLocaleString());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReadme();
  }, [readmeId, token]); // Re-fetch if readmeId or token changes

  if (loading) return <p>Loading README...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="readme-detail-container"> {/* Class for styling */}
      <h2>README for {repoUrl}</h2>
      <p className="generated-info">Generated on: {generatedAt}</p> {/* Class for styling */}
      <div className="markdown-content"> {/* Class for styling the markdown output */}
        <ReactMarkdown>{readmeContent}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ReadmeDetailPage;