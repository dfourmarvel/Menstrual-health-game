import { test } from '@playwright/test';

test('debug questions directly', async ({ page }) => {
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  await page.locator('#skip-rules').click();
  await page.locator('#start-game').click();

  // Print info from direct variables
  const info = await page.evaluate(() => {
    // Access global variables directly
    // @ts-ignore
    const qList = questions || [];
    // @ts-ignore
    const gState = gameState || {};
    
    const types = qList.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});
    
    const difficulties = qList.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {});
    
    // Evaluate the filter in getNextQuestion:
    const START_DIFFICULTY = "medium";
    const difficultyOrder = ['easy','medium','hard'];
    const minIndex = difficultyOrder.indexOf(START_DIFFICULTY);
    const allowed = difficultyOrder.slice(minIndex);
    
    const filteredQuestions = qList.filter(q => {
      const matchType = q.type === 'true-false' || q.type === 'mcq';
      const matchDiff = allowed.includes(q.difficulty);
      return matchType && matchDiff;
    });

    return {
      total: qList.length,
      types,
      difficulties,
      allowedDifficulties: allowed,
      filteredCount: filteredQuestions.length,
      gameStatePoolLength: gState.questionPool ? gState.questionPool.length : null,
      sampleQuestion: qList.slice(0, 3),
    };
  });

  console.log('--- DEBUG INFO ---');
  console.log(JSON.stringify(info, null, 2));
});
