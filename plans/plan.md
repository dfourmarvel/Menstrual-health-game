# Project Cleanup and Fix Plan

## Goals

- Keep the game as a static HTML/CSS/JavaScript app.
- Complete the existing 1-4 player support instead of reducing the game to 2 players.
- Keep exactly three docs when cleanup is approved:
  - `README.md`
  - `plans/plan.md`
  - `plans/implementation_status.md`
- Fold audit findings into a practical current-state document.
- Standardize tests on Playwright TypeScript.
- Add ignore files so dependencies, reports, logs, caches, and local settings stay out of git.

## Cleanup Plan

1. Add ignore files. Done.
   - `.gitignore` covers dependencies, Playwright output, logs, coverage, local env files, editor files, OS files, and temporary build output.
   - `.prettierignore` keeps generated, binary, and dependency-heavy folders out of formatting passes.
   - `.kiloignore` keeps generated output, dependencies, logs, local env files, editor files, and agent workspace files out of Kilo context.

2. Remove generated and duplicate files. Done.
   - Untrack `node_modules/`.
   - Untrack `test-results/`.
   - Remove duplicate root-level dice tests.
   - Remove the Python Playwright scratch script.
   - Remove stale extra docs.

3. Fix gameplay bugs. Done.
   - Rules carousel must show on startup and from the navbar rules button.
   - The last rules slide must allow Continue.
   - Player count must reveal Player 3 and Player 4 setup fields immediately.
   - Roll Dice must become enabled after setup starts the game.
   - The dice should render and animate as a real 3D cube.

4. Complete 4-player support. Done.
   - Keep Player 3 and Player 4 tokens, setup inputs, avatar selectors, and cards.
   - Offset tokens so multiple players on one tile remain visible.
   - Preserve AI toggles for all players.

5. Standardize tests. Done.
   - Use only `tests/*.spec.ts`.
   - Test static file loading.
   - Cover rules modal, setup flow, 4-player setup visibility, dice rolling, and basic asset health.

6. Verify. Done.
   - Run `node --check js/game.js`.
   - Run `npm test`.
   - Review `git status --short` so only intentional changes remain.

## Remaining

Optional future pass: optimize large image assets.
