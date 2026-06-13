# Multiplayer & AI Support Implementation Plan

## Goal
Add optional AI (computer) player so the game can be played solo, and fully support 2‑4 players (human or AI). Implement AI with a 60% chance of answering questions correctly, use a dedicated robot avatar for AI, and provide a total of six selectable avatars (3 male, 3 female, including 2 medical professionals).

## User Review Required
> [!NOTE]
> All specifications have been approved by the user:
> - AI uses a dedicated robot avatar.
> - Six avatars are available (3 male, 3 female, two of which are medical professionals).
> - AI avatar selectable per player via a checkbox.
> - AI answers questions with a 60% correctness rate.
> - UI extended for players 3 and 4.

## Open Questions (resolved)
- AI always occupies the last player slot unless the user toggles the AI checkbox for any player.
- Desired AI turn delay: 600 ms (smooth UX).
- No additional styling preferences beyond existing responsive layout.

## Proposed Changes
---
### HTML (`index.html`)
- Add a **Player Count** `<select id="player-count">` with options 1‑4.
- Duplicate the player‑setup block, avatar selection, and name input for Player 3 and Player 4 (mirroring existing markup).
- For each player slot, add a **Computer** checkbox `<input type="checkbox" class="ai-toggle" data-player="X">`.
- Ensure the setup modal hides unused player sections based on the selected count.

---
### CSS (`css/styles.css`)
- Extend `.player-cards-container` to accommodate up to four player cards using a responsive grid.
- Add token positioning offsets for four players to avoid overlap.
- Style the new AI avatar and extra avatars consistently with existing ones.

---
### JavaScript (`js/game.js`)
1. **DOM Caching** – Extend `cacheElements()` to include new elements:
```js
player3: document.getElementById('player3'),
player4: document.getElementById('player4'),
player3NameInput: document.getElementById('player3-name'),
player4NameInput: document.getElementById('player4-name'),
player3AvatarSelection: document.getElementById('player3-avatar-selection'),
player4AvatarSelection: document.getElementById('player4-avatar-selection'),
player3CardAvatar: document.getElementById('player3-card-avatar'),
player4CardAvatar: document.getElementById('player4-card-avatar'),
player3NameDisplay: document.getElementById('player3-name-display'),
player4NameDisplay: document.getElementById('player4-name-display'),
aiToggle3: document.querySelector('.ai-toggle[data-player="3"]'),
aiToggle4: document.querySelector('.ai-toggle[data-player="4"]'),
playerCountSelect: document.getElementById('player-count'),
```
2. **Game State Initialization** – Update `createInitialGameState(playersConfig)` to accept an array of `{ name, isAI, avatar }` for up to four players, defaulting to two human players.
3. **Setup Logic** – On **Start Game** click:
   - Read selected player count.
   - Collect each player’s name, avatar, and AI flag.
   - Hide unused player input sections.
   - Build the `playersConfig` array and pass it to `createInitialGameState`.
4. **Turn Handling** – After a human turn, if the next player `isAI` is true, call `handleAITurn(currentIndex)` after a 600 ms timeout.
5. **AI Turn (`handleAITurn`)**:
```js
async function handleAITurn(index) {
  const player = gameState.players[index];
  // Simulate thinking delay
  await new Promise(r => setTimeout(r, 600));
  // AI dice roll
  const dice = await rollDice();
  await movePlayer(dice);
  // Ask health question automatically with 60% chance of correct answer
  const aiCorrect = Math.random() < 0.6;
  // Use same logic as human answer handling
  const boardJump = getBoardJump(gameState.players[index].position);
  if (boardJump) {
    const shouldAdvance = (boardJump.type === 'ladder' && aiCorrect) ||
                         (boardJump.type === 'snake' && !aiCorrect);
    if (shouldAdvance) {
      await movePlayer(boardJump.newPosition);
    }
  }
  finalizeTurn(gameState.players[index].position);
}
```
6. **AI Avatar** – Use the generated robot avatar image (`avatar_ai_1781381406920.png`) for any player marked as AI. Default to this avatar if none selected.
7. **Asset Fallbacks** – Ensure all six avatar files exist (male‑1, male‑2, female‑1, female‑2, male‑prof.svg, female‑prof.svg) and the new robot avatar.

---
### Tests (`tests/audit.spec.ts`)
- Unit tests for `createInitialGameState` with 1‑4 players and AI flags.
- Playwright test selecting 1 player (AI enabled) and verifying the AI automatically takes its turn.
- UI tests ensuring player sections hide/show correctly for each player count.

## Verification Plan
---
### Automated Tests
- Run full test suite including new AI tests.
- Check console for uncaught exceptions.

### Manual Verification
- Open the game, select each player count (1‑4), toggle AI for any slot, and play a few rounds.
- Confirm AI takes its turn after a brief delay and respects the 60 % correctness rate.
- Verify all avatars appear correctly and can be selected.
- Test responsiveness on desktop and mobile viewports.

---
*Implementation can begin now.*
