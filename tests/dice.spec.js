// Dice roll verification using Playwright
const { test, expect } = require('@playwright/test');

test('dice rolls and displays number', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://localhost:3001/');
  const dice = page.locator('.dice-cube');
  await expect(dice).toBeVisible({ timeout: 5000 });

  await dice.click();
  const badge = page.locator('.rolled-number');
  await expect(badge).toBeVisible({ timeout: 5000 });
  const text = await badge.textContent();
  const rolled = parseInt(text.trim(), 10);
  expect(rolled).toBeGreaterThanOrEqual(1);
  expect(rolled).toBeLessThanOrEqual(6);

  expect(consoleErrors).toEqual([]);
});
