import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Login from '../components/Login';
import { NotificationProvider } from '../hooks/useNotification';

// render without provider

describe('Registration Form (TC-01)', () => {
  it('shows error if zero-knowledge checkbox is not checked', async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Switch to Register mode
    const switchButton = screen.getByText(/Register now/i);
    await user.click(switchButton);

    // Fill in email and valid password
    const emailInput = screen.getByLabelText(/^Email Address$/i);
    const passInput = screen.getByLabelText(/^Master Password$/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passInput, 'ValidPassw0rd!');

    // Click Create Vault without checking the box
    const createButton = screen.getByRole('button', { name: /Create Vault/i });
    await user.click(createButton);

    // Assert notification error appears
    const notification = await screen.findByText(/Please confirm that you understand there is no password recovery/i);
    expect(notification).toBeInTheDocument();
  });

  it('shows validation error for weak password', async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Switch to Register mode
    const switchButton = screen.getByText(/Register now/i);
    await user.click(switchButton);

    // Fill in email and WEAK password
    const emailInput = screen.getByLabelText(/^Email Address$/i);
    const passInput = screen.getByLabelText(/^Master Password$/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passInput, 'weak');

    // Check the recovery acknowledgment box
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Click Create Vault
    const createButton = screen.getByRole('button', { name: /Create Vault/i });
    await user.click(createButton);

    // Assert password error appears
    const notification = await screen.findByText(/Master password must be at least 12 characters long/i);
    expect(notification).toBeInTheDocument();
  });
});
