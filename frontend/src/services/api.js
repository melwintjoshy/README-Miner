const API_BASE_URL = 'http://localhost:8000'; // Replace with your deployed backend later

export const apiCall = async (endpoint, method = 'GET', data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // 🔐 Token expired or invalid
      localStorage.removeItem('access_token');
      window.location.href = '/login'; // Force redirect
      return;
    }

    const errorData = await response.json();
    throw new Error(errorData.detail || 'Something went wrong');
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    return response.text().then(text => text || 'Success');
  }
};
