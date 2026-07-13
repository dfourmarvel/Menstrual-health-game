import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
});

// Answers whichever question modal is showing (True/False or MCQ), then continues.
// A no-op if no question modal appears within the timeout.
async function answerQuestionIfShown(page: Page) {
  const questionModal = page.locator('#question-modal');
  const shown = await questionModal
    .waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true)
    .catch(() => false);

  if (!shown) return;

  const mcqOptions = page.locator('#mcq-options');
  if (await mcqOptions.isVisible()) {
    await mcqOptions.locator('.btn-mcq-option').first().click();
  } else {
    await page.locator('#true-btn').click();
  }

  await page.locator('#continue-btn').waitFor({ state: 'visible', timeout: 2000 });
  await page.locator('#continue-btn').click();
}

test('roll dice button triggers a dice roll after game start', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#skip-rules').click();
  await page.locator('#start-game').click();

  const rollButton = page.locator('#roll-dice');
  const diceContainer = page.locator('#dice-canvas-container');
  const rolledNumber = page.locator('.rolled-number');

  await expect(rollButton).toBeEnabled();
  await expect(diceContainer).toBeVisible();

  await rollButton.click();
  await answerQuestionIfShown(page);

  await expect(rolledNumber).toHaveText(/[1-6]/, { timeout: 3000 });
  await expect(rollButton).toBeEnabled({ timeout: 4000 });

  await rollButton.click();
  await answerQuestionIfShown(page);

  await expect(rolledNumber).toHaveText(/[1-6]/, { timeout: 3000 });
  await expect(rollButton).toBeEnabled({ timeout: 4000 });
  await expect(consoleErrors).toEqual([]);
});
