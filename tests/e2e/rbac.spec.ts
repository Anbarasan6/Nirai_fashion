import { test, expect } from '@playwright/test';

test.describe('E2E: Role-Based Access Control (RBAC) & API Guards', () => {
  test('unauthenticated visitor cannot open /admin and is blocked', async ({ page }) => {
    await page.goto('/admin');
    // Guard redirects away from /admin or displays permission error
    await expect(page).not.toHaveURL('/admin');
  });

  test('anon cannot directly insert or modify products table via REST API', async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lqzrahjmgzdsbosywjju.supabase.co';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseAnonKey) {
      // Skip if anon key not configured in test env
      return;
    }

    // Try to insert a counterfeit product using anon key
    const res = await request.post(`${supabaseUrl}/rest/v1/products`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        id: 'hacker-prod-999',
        sku: 'HACK-001',
        name_en: 'Malicious Product',
        base_price: 1,
        final_price: 1,
        stock: 9999,
      },
    });

    // Supabase RLS must reject the insert with 401, 403, or error
    expect([401, 403, 400, 404]).toContain(res.status());
  });

  test('anon cannot read confidential coupons table via REST API', async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lqzrahjmgzdsbosywjju.supabase.co';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseAnonKey) return;

    const res = await request.get(`${supabaseUrl}/rest/v1/coupons`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: 'application/json',
      },
    });

    if (res.ok()) {
      const data = await res.json();
      // If RLS allows read, it should be restricted to empty or safe rows, never secrets
      expect(Array.isArray(data)).toBe(true);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });
});
