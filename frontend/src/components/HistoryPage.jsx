import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiCall } from '../services/api';

function HistoryPage() {
  const [readmes, setReadmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchReadmes = async () => {
      if (!token) {
        setError("Please log in to view history.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await apiCall('/history', 'GET', null, token);
        setReadmes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReadmes();
  }, [token]);

  if (loading) return <p>Loading history...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (readmes.length === 0) return <p>No READMEs generated yet.</p>;

  return (
    <div className="history-container"> {/* Class for styling */}
      <h2>Your Generated READMEs</h2>
      <ul>
        {readmes.map((readme) => (
          <li key={readme.id}>
            <Link to={`/history/${readme.id}`}>
              <strong>{readme.repo_url}</strong>
            </Link>
            <span>Generated on: {new Date(readme.generated_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HistoryPage;