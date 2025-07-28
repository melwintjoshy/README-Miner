import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiCall } from '../services/api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      const data = await apiCall('/login', 'POST', { email, password });
      login(data.access_token);
      navigate('/history'); // Redirect to history or dashboard after successful login
    } catch (err) {
      setError(err.message); // Display error from API call
    }
  };

  return (
    <div className="auth-container"> {/* Class for styling */}
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group"> {/* Class for styling */}
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">Login</button> {/* Class for styling */}
        {error && <p className="error-message">{error}</p>} {/* Class for styling */}
      </form>
      <p>Don't have an account? <a href="/register">Sign Up</a></p>
    </div>
  );
}

export default LoginPage;