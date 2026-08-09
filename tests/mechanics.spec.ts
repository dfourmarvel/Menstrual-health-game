import { test, expect, type Page } from '@playwright/test';

// Globals defined by js/game.js, referenced inside page.evaluate() callbacks.
declare const gameState: any;
declare function getBoardJump(position: number): unknown;
declare function finalizeTurn(position: number): void;
declare function persistCurrentGame(state: unknown): Promise<void>;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
});

/* Skip the rules carousel and start a default 2-player game. */
async function startGame(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#skip-rules').click();
  await page.locator('#start-game').click();
  await expect(page.locator('#roll-dice')).toBeEnabled();
}

test('board maps slide players down snakes and up ladders', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const jumps = await page.evaluate(() => ({
    snake: getBoardJump(11),
    ladder: getBoardJump(1),
    none: getBoardJump(3),
  }));

  expect(jumps.snake).toEqual({ type: 'snake', newPosition: 10 });
  expect(jumps.ladder).toEqual({ type: 'ladder', newPosition: 20 });
  expect(jumps.none).toBeNull();
});

test('winning shows a final scoreboard sorted by score', async ({ page }) => {
  await startGame(page);

  await page.evaluate(() => {
    gameState.players[0].score = 30;
    gameState.players[1].score = 50;
    gameState.currentPlayer = 0;
    finalizeTurn(100);
  });

  await expect(page.locator('#winner-modal')).toBeVisible();
  await expect(page.locator('#winner-scores')).toContainText('Final Scores');

  // Highest score is listed first.
  const rows = page.locator('.scoreboard-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('50 pts');
  await expect(rows.last()).toContainText('30 pts');
});

test('running out of time counts as an incorrect answer', async ({ page }) => {
  await startGame(page);

  // Shorten the countdown so the test does not wait long.
  await page.evaluate(() => {
    gameState.timerSeconds = 1;
  });

  // The entry question appears before the opening roll.
  await page.locator('#roll-dice').click();
  await expect(page.locator('#question-modal')).toBeVisible();
  await expect(page.locator('#question-timer')).toBeVisible();

  // After the timer expires, incorrect feedback appears automatically.
  await expect(page.locator('#question-feedback')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#feedback-message')).toContainText("Time's up");
});

test('a saved game offers a resume prompt on reload', async ({ page }) => {
  await startGame(page);

  // Persist an in-progress game (survives reload via IndexedDB).
  await page.evaluate(async () => {
    await persistCurrentGame({
      players: [
        { name: 'Ada', position: 25, avatar: 'assets/images/player11.png', score: 40, streak: 0, achievements: [], isAI: false },
        { name: 'Bo', position: 10, avatar: 'assets/images/player22.png', score: 20, streak: 0, achievements: [], isAI: false },
      ],
      currentPlayer: 0,
      difficulty: 'all',
      timerSeconds: 0,
      questionPool: [],
    });
  });

  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.locator('#resume-modal')).toBeVisible();
  await expect(page.locator('#resume-summary')).toContainText('Ada');

  await page.locator('#resume-continue-btn').click();
  await expect(page.locator('#resume-modal')).toBeHidden();
  await expect(page.locator('#current-player-name')).toHaveText('Ada');
});

test('focus returns to the trigger after a modal closes', async ({ page }) => {
  await startGame(page);

  await page.locator('#history-btn').click();
  await expect(page.locator('#history-modal')).toBeVisible();

  await page.locator('#history-close-btn').click();
  await expect(page.locator('#history-modal')).toBeHidden();

  const focusedId = await page.evaluate(() => document.activeElement?.id);
  expect(focusedId).toBe('history-btn');
});

test('hostile player names are rendered inert in the scoreboard', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#skip-rules').click();
  await page.locator('#player1-name').fill('<b>pwn</b>');
  await page.locator('#start-game').click();
  await expect(page.locator('#roll-dice')).toBeEnabled();

  await page.evaluate(() => {
    gameState.currentPlayer = 0;
    finalizeTurn(100);
  });

  await expect(page.locator('#winner-scores')).toBeVisible();

  // The injected markup must appear as text, not as a live <b> element.
  const boldCount = await page.locator('#winner-scores b').count();
  expect(boldCount).toBe(0);
  await expect(page.locator('.scoreboard-name').first()).toContainText('<b>pwn</b>');
});
