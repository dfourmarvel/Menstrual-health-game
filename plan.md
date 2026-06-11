## Plan: Expand Menstrual Health Game With Persistent Multiplayer, Unique Question Sessions, and Rewards

TL;DR - Enhance the current board game into a persistent, replayable menstrual health education game that uses `questions.md` for unique session question selection, supports 3D dice presentation, allows 1–4 players with AI, stores player progress through login, and awards e-rewards for milestones.

**Steps**
1. Update board visuals and scaling
   - Replace the board asset in `index.html` with the new menstrual health board graphic.
   - Support scaling to a larger board, starting with a 20x20 (400 tile) prototype.
   - Keep the current 2D gameplay layout while planning a visual 3D dice experience.

2. Implement 3D-style dice
   - Replace the numeric dice image with a 3D-styled dice component or animated sprite.
   - Preserve the underlying roll logic while improving visual engagement and boredom reduction.

3. Load questions dynamically from `questions.md`
   - Parse `questions.md` at runtime to build the question bank.
   - Extract question text, answer, type, and section headings.
   - Categorize the question bank into difficulty buckets (easy, medium, hard) based on sections and question order.

4. Build session-unique question pools
   - Generate a unique question set for each game session.
   - Prevent repeated use of the same question within a match.
   - Ensure subsequent matches use a different set of questions from prior sessions.
   - If the bank is exhausted, implement a reset strategy that preserves recent questions to avoid repetition.

5. Distribute difficulty by game progress
   - Use easy questions early in the match, medium questions in the middle, and hard questions later.
   - Assign question difficulty based on board position, tile range, or match stage.
   - Make the learning curve feel progressive and avoid boredom.

6. Add multiplayer and AI opponents
   - Support 1–4 players in the same game.
   - Add an automated AI player mode for single-player games.
   - Keep turn-based gameplay while supporting more player tokens and player-specific state.

7. Implement login and persistent progress
   - Create a login/profile system for players.
   - Store player profiles, unique scores, achievements, and match history.
   - Recall progress whenever a returning player logs in.
   - Use local storage as the first persistence layer, with a design ready for server/database integration later.

8. Add e-reward achievement tracking
   - Define reward tiers: pendants, crowns, medals, belts, and skins.
   - Award rewards for achievements such as correct answer streaks, milestone tiles, match wins, and player progress.
   - Show earned e-rewards in the player profile or summary screen.

9. Preserve educational behavior models
   - Keep family/peer support, operant conditioning, positive/negative reinforcement, and vicarious learning integrated into the gameplay experience.
   - Use question-based rewards and board events to reinforce positive menstrual health literacy.

10. Maintain accessibility and user experience
   - Keep modal-based questions, turn flow, and winner screens accessible.
   - Ensure login, profile, and reward UI are keyboard navigable.
   - Preserve existing audio, theme, and read-aloud controls.

**Relevant files**
- `index.html` — new board asset, login/profile UI, player selection interface.
- `css/styles.css` — board scaling, 3D dice visuals, player profile and reward UI.
- `js/game.js` — dynamic question loading, session question pools, difficulty distribution, multiplayer flow, AI mode, login persistence, reward tracking.
- `questions.md` — source of the question bank and difficulty/categorization cues.

**Verification**
1. Confirm the new board image renders correctly on the game board.
2. Confirm the dice display is upgraded with a 3D-style roll.
3. Confirm each game session loads questions from `questions.md`.
4. Confirm each session uses a unique set of questions and no full session is repeated.
5. Confirm the difficulty progression moves from easy to medium to hard.
6. Confirm 1–4 players can play and AI can participate in single-player mode.
7. Confirm login profiles can be created and progress is saved and recalled.
8. Confirm earned e-rewards are recorded and visible to players.

**Decisions**
- Use local persistence initially, with a path to add a backend later.
- Prototype with a 20x20 board in the existing 2D view; reserve 40x40 for future scaling.
- Use `questions.md` as the sole question source; make True/False items auto-gradable and open-ended items optionally facilitator-verified.

**Further Considerations**
1. If remote multiplayer is desired later, a network backend and sync layer will be required.
2. If question metadata needs to be more precise, add explicit difficulty tags to `questions.md`.
3. If account-based progress tracking is required beyond local storage, plan a lightweight cloud or server-backed database.
