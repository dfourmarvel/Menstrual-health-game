import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
});

test('shows rules first and continues to player setup', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const setupModal = page.locator('#setup-modal');
  await expect(setupModal).toHaveClass(/modal-active/);
  await expect(page.locator('#rules-carousel')).toBeVisible();
  await expect(page.getByText('How to Play')).toBeVisible();

  for (let i = 0; i < 8; i += 1) {
    await page.locator('#carousel-next').click();
  }

  await expect(page.locator('#player-setup')).toBeVisible();
  await expect(page.locator('#start-game')).toBeVisible();
});

test('supports selecting four players during setup', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#skip-rules').click();
  await page.locator('#player-count').selectOption('4');

  await expect(page.locator('#player3-input-group')).toBeVisible();
  await expect(page.locator('#player4-input-group')).toBeVisible();

  await page.locator('#player3-name').fill('Player Three');
  await page.locator('#player4-name').fill('Player Four');
  await page.locator('#start-game').click();

  await expect(page.locator('.player-card-3')).toBeVisible();
  await expect(page.locator('.player-card-4')).toBeVisible();
  await expect(page.locator('#player3')).toBeVisible();
  await expect(page.locator('#player4')).toBeVisible();
  await expect(page.locator('#roll-dice')).toBeEnabled();
});

test('loads questions from the markdown bank and shows explanations', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#skip-rules').click();
  await page.locator('#start-game').click();

  await page.locator('#roll-dice').click();

  // A real question from the markdown bank should appear (TF or MCQ) with non-empty text.
  await expect(page.locator('#question-modal')).toBeVisible();
  await expect(page.locator('#question-text')).not.toHaveText('');

  // Answer whichever question type is shown.
  const mcqOptions = page.locator('#mcq-options');
  if (await mcqOptions.isVisible()) {
    await mcqOptions.locator('.btn-mcq-option').first().click();
  } else {
    await page.locator('#true-btn').click();
  }

  await expect(page.locator('#question-feedback')).toBeVisible();
  await expect(page.locator('#feedback-explanation')).not.toHaveText('');
});
