# Menstrual Health Awareness Game

A static, browser-based Snakes and Ladders style game for learning menstrual health concepts through questions, dice rolls, snakes, ladders, audio, and read-aloud support.

## Run the Game

Open `index.html` in a browser.

For local testing, install dependencies and run Playwright:

```bash
npm install
npm test
```

The app is intentionally static. There is no build step and no framework runtime.

## Project Structure

```text
index.html                 Main game screen and modals
css/styles.css             Layout, themes, dice, board, and responsive UI
js/game.js                 Game state, rules, dice, questions, audio, and storage
questions.md               Question bank loaded at runtime
assets/images/             Board, tokens, avatars, and dice images
assets/audio/              Music and sound effects
tests/                     Playwright TypeScript tests
plans/plan.md              Cleanup and implementation plan
plans/implementation_status.md  Current project state
```

## Gameplay

Players configure names, avatars, player count, and optional AI players before starting. A player must answer an entry question and roll a 6 to enter the board. After entering, each roll moves the token across the board. Landing on ladders or snakes triggers a menstrual health question that controls whether the move helps or hurts the player. The first player to land exactly on square 100 wins.

## Current Focus

The repo is being cleaned so source files, tests, docs, and assets are easy to reason about. Generated dependencies and test output should stay out of git. See `plans/plan.md` and `plans/implementation_status.md` for the active cleanup state.
