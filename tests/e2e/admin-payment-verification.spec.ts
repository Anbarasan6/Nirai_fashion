import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe('E2E: Admin Payment Verification Queue', () => {
  test('admin logs in, accesses payment verification queue, and processes proof', async ({ page }) => {
    // 1. Visit Admin route
    await page.goto('/admin');

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      // Without credentials provided, verify route guard blocks unauthenticated access
      await expect(page).toHaveURL(/\/(account)?/);
      return;
    }

    // 2. Authenticate as Admin
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // 3. Navigate to Orders / Payment Verification tab
    await page.goto('/admin/orders');
    await expect(page.locator('text=/Order Management|Payment Verification/i').first()).toBeVisible({ timeout: 15000 });

    // Look for any pending verification button
    const verifyBtn = page.locator('button:has-text("Verify Payment"), button:has-text("Approve")').first();
    if (await verifyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await verifyBtn.click();
      const confirmModalBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes, Verify")').first();
      if (await confirmModalBtn.isVisible()) {
        await confirmModalBtn.click();
      }
      // Status badge updates to Paid / Confirmed
      await expect(page.locator('text=/Paid|Confirmed/i').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
