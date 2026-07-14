# Menstrual-health-game

Educational board game (menstrual health trivia), vanilla HTML/CSS/JS. Static site — no build step, no framework. Same pattern as the Bible-quiz project.

## Structure
- `index.html`, `css/`, `js/` — the game itself
- `assets/` — images/media
- `questions.md`, `Menstrual_Health questions.md` — question content
- `plans/` — `plan.md` and `implementation_status.md` track ongoing feature work; `plans/DOCUMENTATION.md` is the consolidated project doc (see `package.json` description)
- `scripts/` — helper scripts (e.g. image optimization)
- `tests/` — Playwright end-to-end tests

## Commands
- `npm test` — runs Playwright tests (`playwright.config.ts`)
- No dev server script — open `index.html` directly, or use the `run` skill

## Notes
- GitHub: dfourmarvel/Menstrual-health-game
- Check `plans/implementation_status.md` before starting new work to see what's already in progress.
