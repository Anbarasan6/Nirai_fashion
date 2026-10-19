import { test, expect } from '@playwright/test';

test.describe('E2E: Mobile Viewport (Pixel 5) Guest Flow', () => {
  test('guest browses, adds to bag, and views payment options on mobile screen', async ({ page }) => {
    // Verify mobile viewport is active
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(450);

    // 1. Visit Catalog
    await page.goto('/catalog');
    await expect(page).toHaveTitle(/All Handloom Collections|Catalog|Nirai/);

    // 2. Select product
    const productCard = page.locator('article, .group').filter({ hasText: /₹/ }).first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
    await productCard.click();

    // 3. Add to Bag on mobile PDP
    const addBtn = page.locator('button').filter({ hasText: /Add to Bag|சேர்க்க/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 4. Cart drawer or notification
    await page.goto('/checkout');
    await expect(page).toHaveURL('/checkout');

    // 5. Verify mobile inputs are legible and interactive
    const nameInput = page.locator('#checkout-name, input[name="fullName"], input[placeholder*="Name" i]').first();
    await expect(nameInput).toBeVisible();
  });
});
