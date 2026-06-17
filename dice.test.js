// dice.test.js - Playwright verification of 3D dice roll
const { test, expect } = require('@playwright/test');

test('dice rolls and displays number', async ({ page }) => {
  // Capture console messages
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('http://localhost:3001/');
  // Ensure dice element is present
  const dice = page.locator('.dice-cube');
  await expect(dice).toBeVisible({ timeout: 5000 });

  // Click to trigger roll
  await dice.click();
  // Wait for animation (2s) and badge to appear
  const badge = page.locator('.rolled-number');
  await expect(badge).toBeVisible({ timeout: 5000 });
  const text = await badge.textContent();
  const rolled = parseInt(text.trim(), 10);
  // Validate rolled number is between 1 and 6
  expect(rolled).toBeGreaterThanOrEqual(1);
  expect(rolled).toBeLessThanOrEqual(6);

  // Fail test if any console errors occurred
  expect(consoleErrors).toEqual([]);
});
