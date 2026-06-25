import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
});

async function answerQuestionIfShown(page) {
  const questionModal = page.locator('#question-modal');
  const shown = await questionModal
    .waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true)
    .catch(() => false);

  if (shown) {
    await page.locator('#true-btn').click();
  }
}

test('roll dice button triggers a 3D dice roll after game start', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#skip-rules').click();
  await page.locator('#start-game').click();

  const rollButton = page.locator('#roll-dice');
  const dice = page.locator('#dice-cube');
  await expect(rollButton).toBeEnabled();
  await expect(dice).toBeVisible();
  await expect(dice.locator('.dice-face-panel')).toHaveCount(6);

  await rollButton.click();
  await answerQuestionIfShown(page);

  const rolledNumber = page.locator('.rolled-number');
  await expect(rolledNumber).toHaveText(/[1-6]/, { timeout: 3000 });
  await expect(dice).toHaveClass(/dice-face-[1-6]/);
  await expect(rollButton).toBeEnabled({ timeout: 4000 });

  await rollButton.click();
  await answerQuestionIfShown(page);
  await expect(rolledNumber).toHaveText(/[1-6]/, { timeout: 3000 });
  await expect(rollButton).toBeEnabled({ timeout: 4000 });
  await expect(consoleErrors).toEqual([]);
});
