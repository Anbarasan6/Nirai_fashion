import { test, expect } from '@playwright/test';

test.describe('E2E: Guest Purchase & Payment Submission Flow', () => {
  test('guest buys product, lands on payment verification page with QR, submits UTR proof', async ({ page }) => {
    // 1. Visit Catalog
    await page.goto('/catalog');
    await expect(page).toHaveTitle(/All Handloom Collections|Catalog|Nirai/);

    // 2. Select first product
    const productCard = page.locator('article, .group').filter({ hasText: /₹/ }).first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
    await productCard.click();

    // 3. Add to Bag on PDP
    const addToBagButton = page.locator('button').filter({ hasText: /Add to Bag|சேர்க்க/i }).first();
    await expect(addToBagButton).toBeVisible();
    await addToBagButton.click();

    // 4. Navigate to Checkout
    await page.goto('/checkout');
    await expect(page).toHaveTitle(/Checkout|Nirai/);

    // 5. Fill Shipping Information
    const testPhone = '98765' + Math.floor(10000 + Math.random() * 90000);
    await page.fill('#checkout-name, input[name="fullName"], input[placeholder*="Name" i]', 'Anand Kumar');
    await page.fill('#checkout-phone, input[name="phone"], input[placeholder*="Phone" i]', testPhone);
    await page.fill('#checkout-email, input[name="email"], input[placeholder*="Email" i]', 'anand.test@example.com');
    await page.fill('#checkout-street, input[name="street"], input[placeholder*="Street" i], textarea[placeholder*="Address" i]', '14 North Mada Street, Mylapore');
    await page.fill('#checkout-city, input[name="city"], input[placeholder*="City" i]', 'Chennai');
    await page.fill('#checkout-state, input[name="state"], input[placeholder*="State" i]', 'Tamil Nadu');
    await page.fill('#checkout-pincode, input[name="pincode"], input[placeholder*="PIN" i]', '600004');

    // Select manual payment (UPI/QR)
    const placeOrderBtn = page.locator('button').filter({ hasText: /Place Order|Proceed to Pay|ஆர்டர் செய்க/i }).first();
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // 6. Arrive on Payment Page (/pay/:orderNumber)
    await expect(page).toHaveURL(/\/pay\/[A-Za-z0-9_-]+/, { timeout: 20000 });
    await expect(page.locator('text=Payment Verification')).toBeVisible();

    // 7. Verify dynamic QR Code is rendered
    const qrImage = page.locator('img[alt*="QR" i], canvas');
    await expect(qrImage.first()).toBeVisible({ timeout: 15000 });

    // 8. Submit UTR Proof (12 numeric digits)
    const randomUtr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const utrInput = page.locator('input[placeholder*="12-digit" i], input[placeholder*="UTR" i]').first();
    await utrInput.fill(randomUtr);

    const submitProofBtn = page.locator('button').filter({ hasText: /Submit Proof|Submit Payment|சரிபார்ப்புக்கு சமர்ப்பிக்க/i }).first();
    await submitProofBtn.click();

    // 9. Confirm "Verification Pending" banner is displayed
    await expect(page.locator('text=/Verification Pending|சரிபார்ப்பு நிலுவையில்/i')).toBeVisible({ timeout: 15000 });
  });
});
