const BASE_URL = '';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (email, masterPasswordHash) =>
    request('POST', '/auth/register', { email, master_password_hash: masterPasswordHash }),

  login: (email, masterPasswordHash) =>
    request('POST', '/auth/login', { email, master_password_hash: masterPasswordHash }),

  listItems: (token) => request('GET', '/vault/', null, token),

  createItem: (item, token) => request('POST', '/vault/', item, token),

  updateItem: (id, item, token) => request('PUT', `/vault/${id}`, item, token),

  deleteItem: (id, token) => request('DELETE', `/vault/${id}`, null, token),
};
