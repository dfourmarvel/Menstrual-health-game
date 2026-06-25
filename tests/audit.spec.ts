import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
});

test('loads without broken visible images', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const brokenImages = await page.evaluate(() => {
    return Array.from(document.images)
      .filter(img => Boolean(img.getAttribute('src')))
      .filter(img => img.checkVisibility())
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.getAttribute('src') || img.src);
  });

  expect(pageErrors).toEqual([]);
  expect(brokenImages).toEqual([]);
});
