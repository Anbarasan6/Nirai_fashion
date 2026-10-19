import { test, expect } from '@playwright/test';

test.describe('E2E: 404 Route & Error Boundary Rendering', () => {
  test('non-existent path renders branded 404 page with navigation buttons', async ({ page }) => {
    await page.goto('/unknown-route-never-exists-9988');

    await expect(page).toHaveTitle(/Page Not Found|404|Nirai/);
    await expect(page.locator('text=Page Not Found')).toBeVisible();
    await expect(page.locator('text=/moved or does not exist/i')).toBeVisible();

    // Verify Return Home button works
    const homeBtn = page.locator('button:has-text("Return Home")').first();
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();
    await expect(page).toHaveURL('/');
  });

  test('/500 route renders graceful system error page with error reference', async ({ page }) => {
    await page.goto('/500');

    await expect(page).toHaveTitle(/System Error|500|Nirai/);
    await expect(page.locator('text=/Something Went Wrong|500/i').first()).toBeVisible();
    await expect(page.locator('text=/Error Ref:/i')).toBeVisible();

    const reloadBtn = page.locator('button:has-text("Reload Page")').first();
    await expect(reloadBtn).toBeVisible();
  });
});
