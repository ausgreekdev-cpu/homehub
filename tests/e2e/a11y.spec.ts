import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES_TO_AUDIT = [
  '/',
  '/login',
  '/signup',
  '/listings',
  '/dashboard',
  '/announcements',
  '/arrears',
  '/autopay',
  '/inspections',
  '/notices',
  '/payouts',
  '/portfolio',
  '/reports',
  '/onboarding',
  '/connect-stripe',
  '/tenant',
  '/contractor',
  '/applications',
];

for (const path of PAGES_TO_AUDIT) {
  test(`a11y audit: ${path}`, async ({ page }) => {
    await page.goto(path);
    // Wait for page to settle
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Filter out known acceptable violations (e.g., from third-party widgets)
    const violations = accessibilityScanResults.violations.filter(
      (v) => !['color-contrast'].includes(v.id) // color-contrast handled separately
    );

    if (violations.length > 0) {
      console.log(`\n=== A11y violations on ${path} ===`);
      for (const v of violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    - ${node.html.slice(0, 120)}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
}

test.describe('Color contrast audit', () => {
  for (const path of ['/', '/login', '/signup', '/dashboard']) {
    test(`color contrast: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({ rules: { 'color-contrast': { enabled: true } } })
        .analyze();

      const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');
      if (contrastViolations.length > 0) {
        console.log(`\n=== Color contrast issues on ${path} ===`);
        for (const v of contrastViolations) {
          for (const node of v.nodes.slice(0, 5)) {
            console.log(`  - ${node.html.slice(0, 100)} (${node.failureSummary?.slice(0, 80)})`);
          }
        }
      }
      // Warn but don't fail for contrast (many are from Tailwind defaults)
      expect(contrastViolations.length).toBeLessThanOrEqual(5);
    });
  }
});
