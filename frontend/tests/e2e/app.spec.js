import { test, expect } from '@playwright/test';

test.describe('Teunpass E2E', () => {
  test('has title and can switch between login and register', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Teunpass/i);
    await expect(page.getByRole('heading', { name: 'Teunpass' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock Vault' })).toBeVisible();

    await page.getByRole('button', { name: 'Register now' }).click();
    await expect(page.getByRole('button', { name: 'Create Vault' })).toBeVisible();
    await expect(page.getByText(/I understand there is no password recovery/i)).toBeVisible();
  });

  test('can register, login and see empty vault dashboard', async ({ page }) => {
    // Mock API requests to simulate backend success
    await page.route('**/auth/register', async route => {
      await route.fulfill({ json: { detail: "User created" } });
    });
    await page.route('**/auth/salt', async route => {
      await route.fulfill({ json: { auth_salt: "fakesalt123" } });
    });
    await page.route('**/auth/login', async route => {
      await route.fulfill({ json: { access_token: "fake-jwt-token", token_type: "bearer" } });
    });
    await page.route('**/vaultitems/', async route => {
      await route.fulfill({ json: [] }); // Empty vault
    });

    await page.goto('/');

    // 1. Go to Register
    await page.getByRole('button', { name: 'Register now' }).click();
    
    // Fill Registration Form
    await page.getByLabel('Email Address', { exact: true }).fill('test@example.com');
    await page.getByLabel('Master Password', { exact: true }).fill('StrongPassw0rd!');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Create Vault' }).click();

    // Verify successful registration notification
    await expect(page.getByText('Registration successful! You can now log in.')).toBeVisible();

    // 2. Login
    // The form automatically switches back to login after registration
    await expect(page.getByRole('button', { name: 'Unlock Vault' })).toBeVisible();
    await page.getByLabel('Master Password', { exact: true }).fill('StrongPassw0rd!');
    await page.getByRole('button', { name: 'Unlock Vault' }).click();

    // 3. Vault Dashboard
    // Verify dashboard elements (Login component unmounts instantly so notification isn't visible)
    await expect(page.getByRole('heading', { name: 'Vault Overview' })).toBeVisible();
    await expect(page.getByText('Personal Vault')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add New Item' })).toBeVisible();
  });

  test('can create a new vault item', async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
      sessionStorage.setItem('token', 'fake-token');
    });

    let vaultItems = [];
    await page.route('**/vaultitems/', async route => {
      await route.fulfill({ json: vaultItems });
    });

    await page.route('**/vaultitems/create', async route => {
      const newItem = { vaultitem_id: '123', e_title: 'Netflix', e_username: 'user@netflix.com', e_password: 'enc' };
      vaultItems.push(newItem);
      await route.fulfill({ json: newItem });
    });

    await page.goto('/');

    // Verify dashboard loaded
    await expect(page.getByRole('heading', { name: 'Vault Overview' })).toBeVisible();

    // Wait for the vault items API to resolve before interacting with the DOM
    await page.waitForResponse('**/vaultitems/');

    // Click Add New Item
    await page.getByRole('button', { name: 'Add New Item' }).first().click();

    // Fill form
    await expect(page.getByRole('heading', { name: 'Create New Item' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Netflix');
    await page.getByRole('textbox', { name: 'URL' }).fill('https://netflix.com');
    await page.getByRole('textbox', { name: 'Username / Email' }).fill('user@netflix.com');
    await page.getByPlaceholder('Enter password').fill('mypassword123');

    // Save
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify Success notification and item appearing in grid
    await expect(page.getByText('Item added to vault!')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Netflix' })).toBeVisible();
  });
});
