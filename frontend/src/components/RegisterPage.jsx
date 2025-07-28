import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiCall } from '../services/api';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const data = await apiCall('/register', 'POST', { email, password });
    alert(data.message); // show success message
    navigate('/login');  // Redirect to login page
  } catch (err) {
    setError(err.message);
  }
};


  return (
    <div className="auth-container"> {/* Class for styling */}
      <h2>Register</h2>
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
        <button type="submit" className="btn-primary">Register</button> {/* Class for styling */}
        {error && <p className="error-message">{error}</p>} {/* Class for styling */}
      </form>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
}

export default RegisterPage;