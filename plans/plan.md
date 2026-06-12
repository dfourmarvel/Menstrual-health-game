# Menstrual Health Game Product Roadmap

## Summary

Expand the current menstrual health board game into a replayable, classroom-friendly, and eventually cloud-backed health education product.

The current repo is a vanilla web app built around `index.html`, `css/styles.css`, `js/game.js`, runtime parsing from `questions.md`, and local browser persistence. The immediate recommendation is to improve this existing foundation first, then migrate to a larger platform stack only after gameplay, content structure, profiles, and rewards are stable.

The active planning target is this file: `plans/plan.md`. A root-level `plan.md` does not currently exist in the repository.

## Current State

- The game is implemented with plain HTML, CSS, and JavaScript.
- `questions.md` is already the primary content source and is parsed at runtime by `js/game.js`.
- The current UI supports a board, dice, player tokens, player setup, audio/theme controls, read-aloud support, modal questions, and a winner flow.
- Local browser persistence is already present through localStorage and IndexedDB-style helper logic.
- The current player model is still centered on two visible players, so 1-4 player support and full AI integration should be treated as planned expansion work.

## Product Goals

1. Make the game more replayable by using unique question sessions, richer question metadata, adaptive difficulty, and e-rewards.
2. Support solo, family, peer, and classroom play through 1-4 players, optional AI opponents, and clearer setup controls.
3. Preserve the educational behavior model: positive reinforcement, peer/family support, operant conditioning, vicarious learning, and menstrual health literacy.
4. Keep the first implementation practical by improving the existing vanilla app before introducing a framework or backend.
5. Prepare a future path toward cloud accounts, dashboards, teacher/classroom tools, leaderboards, and analytics.

## Priority Matrix

| Tier | Features | Why It Matters | Suggested Timing |
| --- | --- | --- | --- |
| Tier 1 - Core Gameplay | 1-4 players, AI opponent, 3D dice, local profiles, e-rewards, session-unique questions | Improves replay value, supports solo play, and makes the current game feel complete | First implementation cycle |
| Tier 2 - Learning & Retention | i18n, dashboard, adaptive learning, settings panel, richer question metadata | Improves accessibility, personalization, and evidence of learning progress | After core gameplay is stable |
| Tier 3 - Platform Growth | Supabase accounts, cloud persistence, teacher mode, PWA/offline install, social sharing | Enables cross-device use, classroom adoption, and long-term product growth | After local data model is proven |
| Tier 4 - Architecture & Polish | React migration, TypeScript, advanced accessibility audit, design system | Improves maintainability and quality once the product direction is validated | Later modernization phase |

## Recommended Solutions

### Core Gameplay Expansion

- Support 1-4 players through a dynamic `players` array instead of hard-coded Player 1 and Player 2 UI/state assumptions.
- Add setup controls for player count, player names, avatar/token selection, and AI toggles.
- Add AI opponents that can roll, answer auto-gradable questions, and advance turns without blocking the human player.
- Upgrade the dice display to a 3D-style visual or animated component while preserving the existing roll logic.
- Consider a larger board, such as 12x12 or another balanced size, only after confirming the desired match length and question frequency.

### Question System

- Continue using `questions.md` as the source of truth for the current app.
- Strengthen parsing so each question can expose text, answer, type, section, difficulty, explanation, tags, and source section where available.
- Use session-unique question pools so the same question is not repeated in a match.
- Persist a recent-question history locally so new sessions avoid repeating the same set too soon.
- Use board position or match stage to move from easy questions early, to medium questions mid-game, to harder questions near the finish.
- Keep True/False and other auto-gradable questions available for automated gameplay; keep open-ended questions available for facilitator-reviewed or classroom modes.

### Profiles, Persistence, And Rewards

- Start with local profiles stored in localStorage or IndexedDB so the app remains simple and offline-friendly.
- Track player name, avatar, games played, wins, score, accuracy, streaks, achievements, reward inventory, and recent question history.
- Add e-reward tiers such as medals, crowns, pendants, belts, skins, badges, or token cosmetics.
- Award rewards for correct streaks, finishing a match, winning, reaching milestone tiles, improving accuracy, and answering harder questions correctly.
- Show earned rewards in a profile or post-game summary screen.

### Product Growth Features

- Add multilingual support with an i18n structure before translating large amounts of content.
- Add a progress dashboard showing games played, accuracy, streaks, topics practiced, question difficulty, and reward progress.
- Add game variants later by allowing different topic packs, such as menstrual health, puberty, reproductive health, STI awareness, or other health literacy modules.
- Add PWA support so the game can be installed and used offline in low-connectivity school or clinic settings.

### Future Cloud And Classroom Platform

- Use Supabase rather than Firebase for the future backend because Supabase provides Postgres, Auth, row-level security, relational reporting, and a strong fit for educator dashboards.
- Add cloud accounts only after the local profile and reward data model is stable.
- Add teacher/classroom mode with educator accounts, class codes, student progress, assignment history, exportable reports, and role-based access.
- Treat remote multiplayer, public leaderboards, and social sharing as later features that require backend sync, moderation, and privacy decisions.

## Recommended Tech Stacks

### V1: Current App Stack

Use this stack for the next implementation cycle:

- HTML: continue using `index.html`.
- Styling: continue using `css/styles.css`.
- Logic: continue using `js/game.js`.
- Content: continue using `questions.md`.
- Persistence: localStorage for simple settings, IndexedDB for larger profile/history data if needed.
- Charts: avoid chart dependencies until the dashboard phase.
- Build tooling: no build step required unless the codebase becomes hard to maintain.

This is the recommended near-term stack because it keeps the app easy to run, avoids migration risk, and focuses effort on gameplay and learning value.

### V2: Modern Product Stack

Use this stack when the game needs cloud accounts, dashboards, stronger testing, and maintainable scaling:

- Frontend: Vite, React, and TypeScript.
- State/data fetching: TanStack Query for server state and lightweight local state for UI.
- Backend: Supabase Auth, Postgres, Storage, and row-level security.
- Charts: Recharts or Chart.js for progress dashboards.
- i18n: i18next or FormatJS.
- PWA: web app manifest, service worker, offline cache strategy, and background sync where useful.
- Testing: Vitest for unit tests and Playwright for browser flows.

### Optional Education Stack

Use this only when the project moves toward schools, NGOs, clinics, or formal classroom adoption:

- Supabase role-based access for students, teachers, and admins.
- Class codes for joining groups.
- Teacher dashboard for student progress, assignments, and reward summaries.
- CSV/PDF export for reports.
- Privacy-aware analytics with only the data needed for learning progress and classroom reporting.

## Phased Delivery Plan

### Phase 1: Stabilize And Add Quick Wins

- Keep the existing vanilla app architecture.
- Clean up the plan for board size, player count, dice behavior, and session length.
- Add a polished 3D-style dice visual.
- Expand player setup toward 1-4 players.
- Add basic AI opponent support for solo play.
- Ensure turns, player tokens, player cards, winner state, and saved state work with dynamic players.
- Improve the question pool so each session avoids repeated questions.

### Phase 2: Replayability And Personalization

- Add local player profiles.
- Track match history, scores, accuracy, streaks, and rewards.
- Add an e-reward inventory and achievement rules.
- Add richer question metadata and explanations.
- Add difficulty progression by board position or game stage.
- Add a settings panel for difficulty, read-aloud, reduced motion, audio, theme, and optional timer behavior.

### Phase 3: Learning Analytics And Product Growth

- Add a local dashboard with progress charts and learning summaries.
- Add multilingual structure and begin with the highest-priority languages for the intended audience.
- Add topic/game variant architecture while keeping menstrual health as the first complete module.
- Add PWA install/offline behavior.
- Prepare a backend-ready data model without forcing cloud accounts yet.

### Phase 4: Cloud, Classroom, And Scalable Architecture

- Introduce Supabase Auth and Postgres for cloud profiles and cross-device progress.
- Add teacher/classroom mode with class codes, student lists, assignments, and reports.
- Add leaderboards only after privacy and moderation rules are defined.
- Migrate to Vite + React + TypeScript when the app needs component reuse, stronger testing, and multi-screen product complexity.
- Add advanced accessibility testing against WCAG 2.1 AA expectations.

## Agent Execution Checklist

Use this section when assigning implementation work to an AI agent that does not have persistent memory. Each step is intentionally self-contained and should be completed one at a time.

Before starting any step, the agent must read `plans/plan.md`, `index.html`, `css/styles.css`, `js/game.js`, and the relevant current code for that step. After completing a step, the agent must stop, summarize what changed, list verification performed, and wait for the next instruction. Do not combine steps unless the user explicitly asks for a combined implementation.

### Step 1: Fix Roll Dice Button And Build A True 3D Cubic Dice

- Goal: make the Roll Dice button reliably work and replace the current flat/fake-depth dice with a real cubic 3D dice UI.
- Files to inspect/edit: `index.html`, `css/styles.css`, `js/game.js`.
- Required behavior:
  - Diagnose why `#roll-dice` does not roll when clicked.
  - Confirm `elements.rollDiceBtn.addEventListener('click', handleTurn)` runs after `cacheElements()`.
  - Confirm the button is not left disabled after setup, saved-game restore, question flow, game start, restart, or game-over reset.
  - Preserve existing game rules: opening roll, question prompt, movement, snakes/ladders, and extra turn on 6.
  - Replace the current single-face dice visual with a true cube structure containing six faces.
  - Use CSS 3D transforms with `transform-style: preserve-3d`, `perspective`, and face rotations.
  - Show the correct final dice face after each roll.
  - Animate the cube during rolling, then settle on the rolled value.
  - Respect `prefers-reduced-motion`.
  - Keep the hidden live dice value for screen readers.
- Acceptance criteria:
  - Clicking Roll Dice after starting a game triggers a roll every valid turn.
  - The button disables only while a roll/question is active, then re-enables.
  - The dice visibly appears as a cube, not a flat rounded square.
  - Values 1-6 render with correct pips.
  - No console errors occur during game start, roll, question, movement, or restart.
- Stop after this step. Do not implement multiplayer, AI, profiles, rewards, dashboards, i18n, PWA, or cloud features in the same pass.

### Step 2: Refactor Player State For 1-4 Players

- Goal: remove hard-coded two-player assumptions.
- Files to inspect/edit: `index.html`, `css/styles.css`, `js/game.js`.
- Required behavior:
  - Use one dynamic `players` array for all player state.
  - Support 1, 2, 3, or 4 players from setup.
  - Render player cards and board tokens from player data.
  - Preserve existing two-player behavior.
  - Keep current board movement, questions, snakes/ladders, winner flow, audio, theme, and read-aloud behavior working.
- Acceptance criteria:
  - A new game works with 1, 2, 3, and 4 human players.
  - Turns advance correctly through all active players.
  - Restart and saved-state restore do not break player order.
  - Player names, avatars, current-turn display, and board tokens match the active players.
- Stop after this step. Do not implement AI, profiles, rewards, dashboards, i18n, PWA, or cloud features in the same pass.

### Step 3: Add AI Opponent Support

- Goal: allow solo play with AI players.
- Files to inspect/edit: `index.html`, `css/styles.css`, `js/game.js`.
- Required behavior:
  - Add setup controls to mark players as human or AI.
  - AI players automatically roll and answer auto-gradable questions.
  - Human turns remain manual.
  - AI turns must wait for active animations, questions, and movement to finish before advancing.
  - Do not use open-ended facilitator-reviewed questions for fully automated AI answers unless a clear auto-grading path exists.
- Acceptance criteria:
  - One human can play against at least one AI.
  - AI turns do not require button clicks.
  - AI does not trigger overlapping rolls/questions.
  - Human turns still require the Roll Dice button.
- Stop after this step. Do not implement profiles, rewards, dashboards, i18n, PWA, or cloud features in the same pass.

### Step 4: Strengthen Session-Unique Question Pools

- Goal: prevent repeated questions within a match and reduce repetition across sessions.
- Files to inspect/edit: `js/game.js`; inspect `questions.md` only if metadata cleanup is needed.
- Required behavior:
  - Build session pools from parsed `questions.md`.
  - Track used questions during the current match.
  - Store recent question IDs locally.
  - Prefer unused and recently unseen questions when enough questions exist.
  - Keep True/False and other auto-gradable questions available for solo/AI play.
  - Keep open-ended questions reserved for facilitator-reviewed flows unless auto-grading is explicitly added.
- Acceptance criteria:
  - A question does not repeat in the same match.
  - New matches avoid recently used questions when enough questions exist.
  - The game still falls back gracefully if parsing fails or a difficulty bucket is empty.
- Stop after this step. Do not implement profiles, rewards, dashboards, i18n, PWA, or cloud features in the same pass.

### Step 5: Add Local Profiles And E-Rewards

- Goal: add local progress tracking without cloud accounts.
- Files to inspect/edit: `index.html`, `css/styles.css`, `js/game.js`.
- Required behavior:
  - Store local profiles, match history, wins, accuracy, streaks, and reward inventory.
  - Award e-rewards for milestones and correct-answer streaks.
  - Show rewards in a profile view or post-game summary.
  - Keep all data local in browser storage.
  - Do not add Supabase, Firebase, or any network backend in this step.
- Acceptance criteria:
  - Profile progress persists after page refresh.
  - Rewards are visible and tied to clear achievements.
  - Restarting a game does not erase profile history unless the user explicitly clears it.
- Stop after this step. Do not implement dashboards, i18n, PWA, cloud accounts, teacher mode, or leaderboards in the same pass.

### Step 6: Add Settings, Accessibility, And Polish

- Goal: improve replay controls and inclusive UX.
- Files to inspect/edit: `index.html`, `css/styles.css`, `js/game.js`.
- Required behavior:
  - Add or refine settings for difficulty, audio, read-aloud, theme, reduced motion, and optional timer behavior.
  - Persist settings locally.
  - Keep keyboard and screen-reader flows usable.
  - Maintain modal focus management for setup, question, rules, and winner flows.
  - Ensure UI text fits on mobile and desktop.
- Acceptance criteria:
  - Settings persist after refresh.
  - Modals manage focus correctly.
  - The game remains playable with keyboard controls.
  - Reduced-motion users do not receive unnecessary dice or board animations.
- Stop after this step. Do not implement cloud accounts, teacher mode, leaderboards, or a framework migration in the same pass.

## Implementation Notes By File

- `index.html`: add dynamic player setup, profile/reward areas, dashboard entry points, settings controls, and future i18n hooks.
- `css/styles.css`: add responsive layouts for 1-4 players, 3D dice styling, reward visuals, dashboard styles, high-contrast mode, and reduced-motion handling.
- `js/game.js`: refactor hard-coded player logic, improve question parsing, create session pools, add AI turns, track rewards, save profiles, and prepare data structures for future cloud sync.
- `questions.md`: remain the current content source; later add clearer metadata for difficulty, categories, explanations, and topic tags.

## Verification And Acceptance Criteria

1. The roadmap is easy to scan and separates immediate gameplay work from future platform work.
2. The plan clearly recommends keeping vanilla JS for v1 and delaying React migration until the product needs it.
3. The plan recommends Supabase over Firebase for future cloud persistence, educator dashboards, and relational analytics.
4. The plan distinguishes local profiles and rewards from future cloud accounts.
5. The plan does not over-promise remote multiplayer, teacher mode, or cloud features as part of the immediate vanilla milestone.
6. Another engineer can use this document to choose the next implementation phase without needing to redesign the architecture.

## Risks And Mitigations

- Risk: Refactoring from 2 players to 1-4 players can break turn flow.
  - Mitigation: first centralize player state, then update UI rendering and saved-state restore.
- Risk: Cloud accounts too early could slow progress.
  - Mitigation: prove the profile and reward model locally before adding Supabase.
- Risk: A React migration could become a rewrite before the product is ready.
  - Mitigation: delay framework migration until the app has enough screens and shared components to justify it.
- Risk: Larger boards can make sessions too long.
  - Mitigation: choose board size based on target session length, age group, and classroom timing.
- Risk: Health education content needs careful wording and review.
  - Mitigation: keep explanations traceable to `questions.md` sections and allow facilitator-reviewed questions where needed.

## Open Decisions

1. Confirm the ideal board size and session length for the target setting.
2. Confirm the first languages for i18n based on the intended audience.
3. Confirm whether rewards should be purely cosmetic, score-based, or tied to learning milestones.
4. Confirm whether classroom mode is a near-term requirement or a later product track.
5. Confirm whether open-ended questions should be included in solo play or reserved for facilitator/classroom play.
