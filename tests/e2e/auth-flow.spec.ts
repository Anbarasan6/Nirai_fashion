import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_CUSTOMER_EMAIL || `testuser_${Date.now()}@example.com`;
const TEST_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD || 'SecretP@ssw0rd2026!';

test.describe('E2E: Customer Authentication Flow', () => {
  test('register modal, forgot-password submission, login, and logout', async ({ page }) => {
    // 1. Visit Home
    await page.goto('/');

    // 2. Open Auth Modal
    const userBtn = page.locator('button[aria-label*="Account" i], button[aria-label*="Profile" i], button:has-text("Sign In"), button:has-text("Login")').first();
    if (await userBtn.isVisible()) {
      await userBtn.click();
    } else {
      await page.goto('/account');
    }

    // Modal or page should show Login/Register options
    await expect(page.locator('text=/Sign In|Login|Create Account|பதிவு/i').first()).toBeVisible({ timeout: 10000 });

    // 3. Forgot Password Page loads and submits
    await page.goto('/reset-password');
    await expect(page).toHaveTitle(/Reset Password|Nirai/);

    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill(TEST_EMAIL);

    const resetSubmitBtn = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Reset")').first();
    await resetSubmitBtn.click();

    // Confirmation message shown
    await expect(page.locator('text=/sent|instructions|link|சரிபார்க்க/i').first()).toBeVisible({ timeout: 10000 });

    // 4. Test Login & Logout if dedicated test credentials provided
    if (process.env.E2E_CUSTOMER_EMAIL && process.env.E2E_CUSTOMER_PASSWORD) {
      await page.goto('/');
      await page.goto('/account');

      await page.fill('input[type="email"]', process.env.E2E_CUSTOMER_EMAIL);
      await page.fill('input[type="password"]', process.env.E2E_CUSTOMER_PASSWORD);
      await page.click('button[type="submit"]');

      // Should land on Customer Account page
      await expect(page).toHaveURL('/account');
      await expect(page.locator('text=/My Account|Order History|என் கணக்கு/i').first()).toBeVisible();

      // Logout
      const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), button:has-text("வெளியேறு")').first();
      await logoutBtn.click();
      await expect(page).toHaveURL('/');
    }
  });
});
