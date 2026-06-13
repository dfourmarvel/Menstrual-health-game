import { test, expect } from '@playwright/test';

test.describe('Menstrual Health Game Audit', () => {
  test('Audit critical flows, console errors, and basic accessibility', async ({ page }) => {
    const consoleLogs: { type: string, text: string }[] = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });
    const pageErrors: Error[] = [];
    page.on('pageerror', err => {
      pageErrors.push(err);
    });

    // 1. Load the page
    const fileUrl = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    // 2. Check for missing assets by checking if any img failed to load
    const brokenImages = await page.evaluate(() => {
      return Array.from(document.images)
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });

    // 3. Test setup flow
    const startGameBtn = page.locator('#start-game');
    await startGameBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await startGameBtn.isVisible()) {
      await startGameBtn.click();
    }

    // 4. Check if we can roll the dice
    const rollBtn = page.locator('#roll-dice');
    const isRollBtnVisible = await rollBtn.isVisible();

    // 5. Output findings
    console.log('--- AUDIT RESULTS ---');
    console.log('Console Errors:', consoleLogs.filter(l => l.type === 'error' || l.type === 'warning'));
    console.log('Page Exceptions:', pageErrors);
    console.log('Broken Images:', brokenImages);
    console.log('Roll Button Visible:', isRollBtnVisible);
    console.log('---------------------');
  });
});
