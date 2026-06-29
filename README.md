# Menstrual Health Awareness Game

> Snakes & Ladders reimagined as a menstrual health education game — breaking stigma one board square at a time. Play, learn, break stigma.

## Why This Exists

Menstrual health remains one of the most stigmatized and misunderstood topics across communities in Ghana and beyond. Misinformation, lack of resources, and cultural silence continue to affect the health and quality of life of millions.

This game was built to change that — one square at a time.

By wrapping menstrual health education in the familiar, engaging format of Snakes & Ladders, this project turns a sensitive topic into an accessible, enjoyable learning experience. It is designed to increase awareness, improve health literacy, and promote informed decision-making among Ghanaians and a global audience — aligned with the United Nations Sustainable Development Goals (SDGs), particularly SDG 3 (Good Health & Well-being) and SDG 5 (Gender Equality).

## Gameplay

- Players configure names, avatars, and player count before starting
- A player must answer an entry question and roll a 6 to enter the board
- Each roll moves the token across the board toward square 100
- Landing on **ladders** or **snakes** triggers a menstrual health question
- Correct answers help you advance — wrong ones set you back
- The first player to land exactly on square 100 wins

## Features

- Classic Snakes & Ladders board with menstrual health question triggers
- Rich question bank covering menstrual health concepts, myths, and facts
- Optional AI players for solo play
- Audio support with background music and sound effects
- Read-aloud support for accessibility
- Fully responsive — works on mobile and desktop
- Static, no-build — open index.html and play instantly

## Tech Stack

- **HTML5** — semantic, accessible markup
- **CSS3** — responsive layout, animations, and theming
- **Vanilla JavaScript (ES6+)** — zero frameworks, pure game logic
- **Playwright** — automated testing

## How to Run

Open `index.html` directly in any modern browser — no build step required.

For local testing with Playwright:

```bash
npm install
npm test
```

## Project Structure

```
index.html              # Main game screen and modals
css/styles.css          # Layout, themes, dice, board, and responsive UI
js/game.js              # Game state, rules, dice, questions, audio, and storage
questions.md            # Question bank loaded at runtime
assets/images/          # Board, tokens, avatars, and dice images
assets/audio/           # Music and sound effects
tests/                  # Playwright TypeScript tests
plans/                  # Implementation plan and project status
```

## Credits

**Main Contributor:** Dr. Frank — whose expertise and guidance shaped the menstrual health question bank and the educational direction of this project.

---

*Built with purpose. Designed for awareness. Made in Ghana.*
