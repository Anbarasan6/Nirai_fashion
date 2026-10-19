import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('A11y Accessibility Smoke Tests (@axe-core/playwright)', () => {
  test('Home page (/) has no critical or serious a11y violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const severeViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (severeViolations.length > 0) {
      console.warn('A11y violations on /:', JSON.stringify(severeViolations, null, 2));
    }

    expect(severeViolations).toEqual([]);
  });

  test('Catalog page (/catalog) has no critical or serious a11y violations', async ({ page }) => {
    await page.goto('/catalog');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const severeViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (severeViolations.length > 0) {
      console.warn('A11y violations on /catalog:', JSON.stringify(severeViolations, null, 2));
    }

    expect(severeViolations).toEqual([]);
  });

  test('Checkout page (/checkout) has no critical or serious a11y violations', async ({ page }) => {
    await page.goto('/checkout');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const severeViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (severeViolations.length > 0) {
      console.warn('A11y violations on /checkout:', JSON.stringify(severeViolations, null, 2));
    }

    expect(severeViolations).toEqual([]);
  });

  test('Policy page (/policies) has no critical or serious a11y violations', async ({ page }) => {
    await page.goto('/policies');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const severeViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (severeViolations.length > 0) {
      console.warn('A11y violations on /policies:', JSON.stringify(severeViolations, null, 2));
    }

    expect(severeViolations).toEqual([]);
  });
});
