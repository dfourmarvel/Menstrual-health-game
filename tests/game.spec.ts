import { test, expect } from '@playwright/test';

test('loads game and shows roll dice button', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/index.html');
  const rollBtn = page.locator('#roll-dice');
  await expect(rollBtn).toBeVisible();
});
