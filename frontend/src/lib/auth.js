// In-memory token store — tokens are never written to localStorage/sessionStorage,
// which reduces XSS exposure. For production, prefer httpOnly cookies set by the server.
let _token = null;

export const auth = {
  setToken(token) { _token = token; },
  getToken() { return _token; },
  clear() { _token = null; },
  isAuthenticated() { return _token !== null; },
};
