/**
 * Wrapper around the standard fetch API that automatically injects the Bearer token
 * and handles common boilerplate like throwing on API errors.
 */
export async function apiFetch(endpoint, options = {}) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = sessionStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  return response;
}
