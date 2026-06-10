# Prostate Cancer Awareness Game Recreation

This is a cleaned-up recreation of the public client-side page at:

`https://derrik1-dev.github.io/ludolite/doit.html`

## What Was Recreated

- The visible Snakes & Ladders board, player avatars, dice faces, and audio assets were downloaded from the public site.
- The original inline HTML, CSS, and JavaScript were split into maintainable files:
  - `index.html`
  - `css/styles.css`
  - `js/game.js`
  - `assets/images/*`
  - `assets/audio/*`
- The game behavior preserves the public page mechanics: players must roll 6 to start, dice rolls animate, snakes and ladders trigger true/false questions, names can be entered before play, and the winner gets a modal.
- New enhancement: before a player has entered the board, they answer a health question before rolling. A correct answer gives that entry roll a 65% chance of becoming a 6.

## Assumptions

- The referenced `styles.css` and `placeholder-board.png` URLs on the public site returned 404, so the inline CSS and available board image are treated as the source of truth.
- No server-side APIs were visible or required. Questions, turns, movement, audio, and win handling are all client-side.
- Browser audio autoplay restrictions may prevent sound from playing until the user starts the game or otherwise interacts with the page. The recreation catches those blocked-play errors without interrupting gameplay.
