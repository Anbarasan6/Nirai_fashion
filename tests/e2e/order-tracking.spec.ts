import { test, expect } from '@playwright/test';

test.describe('E2E: Order Tracking Security & Validation', () => {
  test('tracking requires valid order number AND matching phone number', async ({ page }) => {
    await page.goto('/tracking');
    await expect(page).toHaveTitle(/Track Order|Tracking|Nirai/);

    const orderInput = page.locator('input[placeholder*="ORD-" i], input[placeholder*="Order Number" i]').first();
    const phoneInput = page.locator('input[placeholder*="Phone" i], input[placeholder*="Mobile" i]').first();
    const trackBtn = page.locator('button').filter({ hasText: /Track|பின்தொடர்/i }).first();

    await expect(orderInput).toBeVisible();
    await expect(phoneInput).toBeVisible();

    // 1. Submit with non-matching phone number
    await orderInput.fill('ORD-20261018-0001');
    await phoneInput.fill('9999999999');
    await trackBtn.click();

    // Must show security error / mismatch error
    await expect(
      page.locator('text=/Order not found|phone number does not match|தவறான/i').first()
    ).toBeVisible({ timeout: 10000 });

    // 2. Form enforces 10-digit phone requirement
    await phoneInput.fill('123');
    await trackBtn.click();
    await expect(page.locator('text=/valid 10-digit|digits/i').first()).toBeVisible();
  });
});
