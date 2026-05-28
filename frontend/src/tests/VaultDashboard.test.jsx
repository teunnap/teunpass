import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { NotificationProvider } from '../hooks/useNotification';
import * as api from '../lib/api';

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn()
}));

const renderWithProviders = (ui) => {
  return render(
    <NotificationProvider>
      {ui}
    </NotificationProvider>
  );
};

describe('VaultDashboard (TC-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('filters vault items based on search query', async () => {
    // Mock authenticated state
    sessionStorage.setItem('token', 'fake-token');

    // Mock API response with 3 items, one is Netflix
    api.apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { vaultitem_id: '1', e_title: 'Netflix', e_username: 'user@netflix.com' },
        { vaultitem_id: '2', e_title: 'Google', e_username: 'user@gmail.com' },
        { vaultitem_id: '3', e_title: 'Github', e_username: 'dev@github.com' }
      ]
    });

    const user = userEvent.setup();
    render(<App />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Github')).toBeInTheDocument();
    });

    // Type "net" in search
    const searchInput = screen.getByPlaceholderText(/Search your logins/i);
    await user.type(searchInput, 'net');

    // Netflix should still be there, Google and Github should be gone
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
    expect(screen.queryByText('Github')).not.toBeInTheDocument();
  });

  it('securely handles XSS payload in search without rendering HTML', async () => {
    sessionStorage.setItem('token', 'fake-token');
    
    api.apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { vaultitem_id: '1', e_title: 'Safe Item', e_username: 'user' }
      ]
    });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Safe Item')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search your logins/i);
    // Paste XSS payload
    const xssPayload = "<script>alert('xss')</script>";
    await user.type(searchInput, xssPayload);

    // It should just filter out 'Safe Item' and show "No items match your search."
    expect(screen.queryByText('Safe Item')).not.toBeInTheDocument();
    expect(screen.getByText(/No items match your search/i)).toBeInTheDocument();
  });
});
