# Implementation Status

## Features from `plan.md` that are **already implemented**

| Feature | Location in codebase | Notes |
|---|---|---|
| Basic vanilla stack (HTML, CSS, JS) | `index.html`, `css/styles.css`, `js/game.js` | Uses plain files, no build step. |
| Game board with snakes & ladders | `js/game.js` (snakes & ladders objects) | Logic present for movement. |
| Dice UI with 3‑D cube visual | `index.html` → `<div id="dice-cube" class="dice-cube dice-face-1">` and CSS classes for faces | Cube exists and animates via JS. |
| Roll Dice button functionality | `js/game.js` – element `roll-dice` wired via `elements.rollDiceBtn.addEventListener('click', handleTurn)` | Button triggers roll, disables during turn. |
| Two‑player token rendering | `index.html` tokens `#player1` and `#player2` plus player cards in HTML | Hard‑coded two players are functional. |
| Local persistence (localStorage/IndexedDB stub) | `js/game.js` – `saveGameState`, `loadGameState` helpers | Saves basic game state across refreshes. |
| Audio controls (music & SFX) | `js/game.js` – audio toggle elements `music-btn`, `sound-btn` | Toggles persisted. |
| Theme toggle (light/dark) | `js/game.js` – `theme-btn` handling with `data-theme` attribute | Persists theme. |
| Rules carousel modal | `index.html` modal markup + JS generation of slides | User can step through rules. |
| Read‑aloud toggle | `js/game.js` – `read-aloud-btn` handling | Accessible speech output. |
| Question parsing from `questions.md` | `js/game.js` – `loadQuestionsFromMarkdown`, `parseQuestionsMarkdown` | Dynamic loading at runtime. |
| Basic player turn flow, extra turn on a 6 | `js/game.js` – turn handling logic | Works for two players. |
| Restart button | `index.html` → `#restart` with JS handler | Resets game state. |
| Winner flow and modal | `js/game.js` – winner detection and UI updates | Displays winner message. |

## Features **planned but not yet present**
- Support for 1‑4 dynamic players (dynamic `players` array).
- AI opponent implementation.
- Session‑unique question pools with history tracking.
- Local profiles and e‑reward inventory persistence.
- Settings panel with full accessibility options (difficulty, reduced motion, timer).
- Multilingual (i18n) scaffolding.
- Dashboard with progress charts.
- PWA install/offline support.
- Cloud backend (Supabase) and teacher mode.
- React/TypeScript migration (V2 stack).

*This status file lives in `/plans/implementation_status.md` for easy hand‑off to the next engineer.*