# Current Project State

## Summary

The project is a static menstrual health board game. The cleanup pass is complete: generated folders are ignored and untracked, duplicate scratch tests and stale docs were removed, gameplay fixes are in place, and the Playwright suite passes.

## Fixed In Current Cleanup Pass

- Added `.gitignore`.
- Added `.prettierignore`.
- Added `.kiloignore`.
- Reworked the dice markup and styles so it renders as a 3D cube with pips.
- Fixed the rules carousel so the final slide can continue to setup.
- Fixed the navbar rules button so it always opens the rules screen.
- Wired the player-count dropdown so Player 3 and Player 4 setup fields appear when selected.
- Added board-token offsets for four players so shared tiles are readable.
- Fixed IndexedDB request handling so saves, loads, history, and current-game cleanup use proper promise wrappers.
- Standardized Playwright tests on `tests/*.spec.ts` with a local static server.
- Set Playwright to one worker for reliable local Chromium runs.
- Removed duplicate root tests, scratch Playwright scripts, stale docs, tracked `node_modules/`, and tracked test output.

## Remaining Work

- Optional future pass: optimize large image assets.
