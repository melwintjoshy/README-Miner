const getBase = () => {
  const envBase = process.env.REACT_APP_API_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  return window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://readme-miner-backend.onrender.com';
};

export const apiCall = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${getBase()}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  if (!response.ok) {
    let msg = 'API call failed';
    try { const j = await response.json(); msg = j.detail || msg; } catch {}
    throw new Error(msg);
  }
  const ct = response.headers.get('content-type') || '';
  return ct.includes('application/json') ? response.json() : response.text();
};
