import { test, expect } from '@playwright/test';

test.describe('Z-Chat E2E', () => {
  test('auth portal renders and accepts username', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Z-CHAT/i })).toBeVisible();

    const input = page.getByLabel(/identity/i);
    await input.fill('TestUser');
    await expect(input).toHaveValue('TestUser');

    await page.getByRole('button', { name: /enter the void/i }).click();
    await page.waitForURL(/\/inbox/);
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('inbox shows chat list and navigates to chat', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/identity/i).fill('TestUser');
    await page.getByRole('button', { name: /enter the void/i }).click();
    await page.waitForURL(/\/inbox/);

    await page.locator('.cursor-pointer').first().click();
    await page.waitForURL(/\/chat\//);
    await expect(page.locator('[contenteditable]')).toBeVisible();
  });

  test('settings page accessible from inbox', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/identity/i).fill('TestUser');
    await page.getByRole('button', { name: /enter the void/i }).click();
    await page.waitForURL(/\/inbox/);

    await page.getByText('[settings]').click();
    await page.waitForURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /encryption fingerprint/i })).toBeVisible();
  });

  test('contacts page accessible', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/identity/i).fill('TestUser');
    await page.getByRole('button', { name: /enter the void/i }).click();
    await page.waitForURL(/\/inbox/);

    await page.getByRole('button', { name: /new chat/i }).click();
    await page.waitForURL(/\/contacts/);
    await expect(page.getByPlaceholder(/search contacts/i)).toBeVisible();
  });

  test('can type and send an encrypted message in a chat', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/identity/i).fill('TestUser');
    await page.getByRole('button', { name: /enter the void/i }).click();
    await page.waitForURL(/\/inbox/);

    await page.locator('.cursor-pointer').first().click();
    await page.waitForURL(/\/chat\//);

    const editor = page.locator('[contenteditable]');
    await expect(editor).toBeVisible();
    await editor.pressSequentially('Phantom handshake established');

    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText('Phantom handshake established')).toBeVisible();
    await expect(page.getByText('Phantom handshake established')).toBeVisible();
  });
});
