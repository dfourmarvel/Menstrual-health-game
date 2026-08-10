# Feature Comparison: Menstrual Health Game vs. Bible Quiz

> Both games share the same origin (the Bible Quiz was adapted from this
> Menstrual Health template), so the engine, board mechanics, dice, audio,
> avatars, and modal system are nearly identical. Since then the **Bible Quiz**
> received two rounds of feature work and an audit. This document lists the
> **differences** in both directions.
>
> _**Status (2026-07-13):** Parity items 1–7 have now been **implemented** in this
> game. Item 8 ("Learn more" links) is intentionally skipped — the question bank
> has no source URLs. The ✅/❌ marks in the "This game" column below have been
> updated to reflect the current code._

---

## 1. Features the Bible Quiz HAS that this game DOESN'T

These are the candidates to port over to reach parity.

### Gameplay

| Feature | Bible Quiz | This game | Notes |
|---|---|---|---|
| **Difficulty selector** (All / Easy / Medium / Hard) | ✅ setup dropdown, filters the question pool | ✅ setup dropdown, filters the pool by difficulty | `#difficulty-select` |
| **Question timer** (Off / 10 / 20 / 30s) | ✅ countdown chip; timeout = wrong answer | ✅ countdown chip in the question header; timeout = wrong answer | `#timer-select`, `#question-timer` |
| **Score tracking** (+10 per correct) | ✅ live per-player score | ✅ live per-player score shown on the player cards | `POINTS_PER_CORRECT` |
| **Streak bonus** (+5 from 3 in a row, 🔥 badge) | ✅ | ✅ 🔥 streak badge on the player card | `STREAK_BONUS`, `STREAK_THRESHOLD`, `player.streak` |
| **Final scoreboard** in the winner modal | ✅ sorted by score | ✅ sorted by score, winner highlighted | `#winner-scores`, `renderFinalScoreboard()` |
| **Difficulty-scaled AI accuracy** (easy 80% / med 60% / hard 45%) | ✅ | ✅ scales with the selected difficulty (all = 60%) | `AI_ACCURACY` |

### Content in feedback

| Feature | Bible Quiz | This game |
|---|---|---|
| **Cross-reference links** shown after answering (open external source in a new tab) | ✅ parsed from the question bank, rendered as safe links | ❌ **skipped** — the menstrual question bank has no source/URL data to render (see caveats) |

### Persistence / navigation

| Feature | Bible Quiz | This game | Notes |
|---|---|---|---|
| **Resume-game prompt** | ✅ "Welcome back… Resume / New Game" modal on reload | ✅ "Welcome back" modal with Resume / New Game on reload | `#resume-modal`, `promptResume()` |
| **Game history screen** | ✅ navbar button → modal listing past games (winner, date, scores) | ✅ navbar button → modal listing past games (winner 🏆, date, per-player scores) | `#history-modal`, `#history-btn`, `renderHistoryList()` |

### Installability / offline / sharing

| Feature | Bible Quiz | This game |
|---|---|---|
| **PWA install** (manifest + icons) | ✅ | ✅ `manifest.webmanifest` + generated `assets/icons/icon-192/512.png` |
| **Offline support** (service worker caches app shell + question bank) | ✅ | ✅ `sw.js` precaches the shell, question bank, images & audio |
| **Favicon** | ✅ | ✅ inline SVG favicon (already present) + apple-touch-icon |
| **Open Graph / Twitter social meta** (link previews) | ✅ | ✅ OG + Twitter tags in `<head>` |

### Accessibility & polish

| Feature | Bible Quiz | This game |
|---|---|---|
| **Modal focus trap + focus return** | ✅ | ✅ (already present, `focusTrapState` WeakMap impl) |
| **`:focus-visible` keyboard ring** | ✅ | ✅ (3 rules present) |
| **`prefers-reduced-motion` support** | ✅ | ✅ media query neutralizes animations/transitions |
| **`escapeHtml` XSS hardening** for names in modals | ✅ (verified: hostile names render inert) | ✅ `escapeHtml()` applied to names in the scoreboard & history (verified: `<b>pwn</b>` renders inert) |

### Tests

| Feature | Bible Quiz | This game |
|---|---|---|
| Base specs (audit / dice / game) | ✅ | ✅ |
| **`mechanics.spec.ts`** (snake slide-down, win+scoreboard, timer expiry, save/resume, focus-return, XSS) | ✅ 6 tests | ✅ 6 tests (all passing) |

---

## 2. Features this game HAS that the Bible Quiz DOESN'T

The gap is small — mostly infra and docs.

| Feature | This game | Bible Quiz | Notes |
|---|---|---|---|
| **Responsive multi-width board** (`srcset` with 600w PNG + 1200w WebP) | ✅ | ⚠️ simpler `<picture>` (WebP + single PNG fallback, no width `srcset`) | This game's board markup is actually a touch more responsive |
| **`AUDIT.md`** design/audit doc | ✅ | ❌ | |
| **`plans/`** folder (`plan.md`, `implementation_status.md`) | ✅ | ❌ | |
| **Working `optimize-board.js`** out of the box | ✅ (targets `menstrual-maze-board.png`, which exists) | ✅ now (was broken — pointed at a missing file — fixed during the Bible Quiz audit) | |

---

## 3. What both games already share

Same underlying template, so these are equivalent in both:

- 3D dice (Three.js, vendored locally — no CDN)
- Snakes & ladders board mechanics, roll-a-6-to-start, bounce-back from 100
- 1–4 players, avatars, AI toggle, entry-question boost (`preferredFace`)
- Rules carousel with "don't show again"
- Theme toggle (light/dark), background music + sound effects toggles
- Read-aloud / text-to-speech (`speechManager`)
- IndexedDB persistence with localStorage fallback (+ game archiving)
- Modal focus trapping and `:focus-visible`
- WebP board optimization

---

## 4. Caveats before porting

1. **Cross-reference links** depend on the question bank containing reference
   data. The Bible bank has `Cross-Reference Verses:` lines; the menstrual
   `Menstrual_Health questions.md` would need an equivalent field (e.g. a
   "Learn more" source/URL) for this feature to have anything to show.
2. **Difficulty filtering** assumes questions are tagged/inferred by difficulty.
   Confirm the menstrual bank's parser assigns difficulty the same way.
3. **AI accuracy tuning** (80/60/45%) is a design choice — adjust per the
   educational goals of this game.
4. **PWA/offline** requires listing this game's real asset filenames (board
   `.webp`/`.png`, audio, avatars, question bank) in the service worker cache.
5. The two games have **different content and theming** (Bible scripture vs.
   menstrual-health literacy) — that difference is intentional and not a "gap."

---

## 5. Implementation status

1. ✅ Score + streak tracking & display, and final scoreboard _(self-contained, high impact)_
2. ✅ Difficulty selector + question timer
3. ✅ Difficulty-scaled AI accuracy (80 / 60 / 45 %, all = 60 %)
4. ✅ Resume-game prompt + game history UI _(the DB layer already existed)_
5. ✅ PWA (manifest + service worker) + favicon + social meta
6. ✅ `prefers-reduced-motion` + `escapeHtml` hardening
7. ✅ `mechanics.spec.ts` regression tests _(6 tests, all passing)_
8. ⏭️ "Learn more" links in feedback — **skipped**: the question bank has no source data to link to
