const API_BASE = 'https://attendance-crm-server.onrender.com/api';

async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = 'Something went wrong';
    try {
      const data = await response.json();
      message = data.message || message;
    } catch (error) {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

export function get(path, token) {
  return request(path, { method: 'GET', token });
}

export function post(path, body, token) {
  return request(path, { method: 'POST', body, token });
}

export function put(path, body, token) {
  return request(path, { method: 'PUT', body, token });
}

export function del(path, token) {
  return request(path, { method: 'DELETE', token });
}
