import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AddVaultItemModal from '../components/AddVaultItemModal';

describe('VaultItem Form (TC-02)', () => {
  it('shows error if title is empty when saving', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(<AddVaultItemModal onClose={onClose} onSaved={onSaved} />);

    // Click save without filling anything
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);

    // Assert that the error for title is shown
    const titleError = screen.getByText(/Name is required./i);
    expect(titleError).toBeInTheDocument();

    // Assert onSaved was NOT called
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('validates URL correctly', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(<AddVaultItemModal onClose={onClose} onSaved={onSaved} />);

    // Fill title
    const titleInput = screen.getByRole('textbox', { name: /^Name$/i });
    await user.type(titleInput, 'Test Item');

    // Fill invalid URL
    const urlInput = screen.getByLabelText(/URL/i);
    await user.type(urlInput, 'invalid-url');

    // Click save
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);

    // Assert URL error
    const urlError = screen.getByText(/Enter a valid URL/i);
    expect(urlError).toBeInTheDocument();
  });
});
