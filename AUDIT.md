# Project Audit — Menstrual Health Awareness Game

> **Audited:** 2026-07-13
> **Scope:** Full project — `js/game.js`, `index.html`, `css/styles.css`, question banks, tests, tooling, and content accuracy.
> **Audience:** Architects and developers. Work through the phases top to bottom.

---

## How to use this document

- Issues are grouped into **phases by priority**. Do **Phase 0 first** — the game is currently unplayable for human players until it's done.
- Every issue has: a **severity**, the **location** (`file:line`), the **symptom** (what you observe), the **root cause** (why), and **fix steps** as checkboxes.
- Check the box `[x]` as each step is completed. This file doubles as a living work tracker.
- Locations reference line numbers as of the audit date; they may drift as you edit — search by symbol name if a line looks off.

### Severity legend

| Severity | Meaning |
|---|---|
| 🔴 Critical | Game is broken / unusable. Fix immediately. |
| 🟠 High | Core feature wrong or misleading (incl. wrong educational content). |
| 🟡 Medium | Noticeable defect, workaround exists. |
| 🟢 Low | Polish, cleanup, or nice-to-have. |

### Issue summary

| Phase | Focus | Issues |
|---|---|---|
| 0 | Restore playability | 1 critical |
| 1 | Question-parsing pipeline | 2 high, 1 medium |
| 2 | Content accuracy (needs expert) | 1 high |
| 3 | Tests & tooling | 1 high, 2 low |
| 4 | UX, accessibility & polish | 1 medium, several low |

---

## Phase 0 — Restore playability (do this first)

### 0.1 🔴 Game crashes on the first human roll (empty question pool)

- **Location:** `js/game.js:29` (`START_DIFFICULTY`), `initializeQuestionPool()` ~`js/game.js:1740`, crash surfaces in `showQuestion()` `js/game.js:1830`.
- **Symptom:** A human clicks **Roll Dice** and *nothing happens* — no question, no dice, no move. Console shows `TypeError: Cannot read properties of undefined (reading 'type')`. An all-AI game appears to work because AI players skip the question UI.
- **Root cause:** Two bugs combine to produce a pool of **zero** questions:
  1. `START_DIFFICULTY = "medium"` makes the pool accept only `medium`/`hard` questions.
  2. The parser tags **every** question as `easy` (see 1.2), so the filter removes all 200 of them.
  Then `getNextQuestion()` returns `undefined` and `showQuestion` dereferences `.type` on it.
- **Fix steps:** ✅ DONE (2026-07-13)
  - [x] Set `START_DIFFICULTY = "easy"` so the pool includes every difficulty (the bank is now tagged easy/medium/hard, see 1.2).
  - [x] Crash-proofed the pool: new `getEligibleQuestions()` falls back to all playable questions if the difficulty filter empties it; `getNextQuestion()` never returns `undefined` (returns `null` at worst).
  - [x] Guarded `showQuestion()`: if no question is available it rebuilds from fallbacks, and as a last resort resolves the turn with a neutral result instead of dereferencing `.type`.
- **Verify:** ✅ Confirmed via headless playthrough — 2-human game rolls, the question modal appears, both TF and MCQ answer correctly, turns advance, no console errors.

---

## Phase 1 — Question-parsing pipeline

The parser in `js/game.js` reads `Menstrual_Health questions.md` at runtime. It currently mis-reads most of the bank.

### 1.1 🟠 All 100 MCQs are corrupted into malformed True/False questions

- **Location:** `buildStructuredMcqQuestion()` `js/game.js:245`, `parseStructuredQuestionBlock()` `js/game.js:184`, `buildQuestionRecord()` `js/game.js:509`.
- **Symptom:** Every multiple-choice question comes out with `type: "true-false"`, the A/B/C/D option text jammed into the question string, `options: []`, and a boolean `answer` copied from the neighbouring True/False question. On screen an MCQ would render as a nonsensical True/False prompt.
- **Root cause:** Each `### TF-n` block in the markdown contains **two** answer lines — one for the TF statement (`**Answer:** ✅ True`) and one for the MCQ (`**Answer:** C`). `buildStructuredMcqQuestion` uses `blockLines.find(...)` which returns the **first** answer line, so the MCQ inherits the TF answer. The option letters then fail to re-parse in `buildQuestionRecord` because the `- A)` bullet prefixes break the option regex's lookahead, so it's classified as True/False.
- **Fix steps:** ✅ DONE (2026-07-13) — the old structured/bullet parser (~450 lines) was replaced with a clean, block-based `parseQuestionsMarkdown` + helpers (`buildRecordsFromBlock`, `extractTrueFalseRecord`, `extractMcqRecord`, `getBlockExplanation`).
  - [x] Blocks are split on `---` rules; each block yields its own TF and/or MCQ record with independent answers.
  - [x] **MCQ answer is derived from the `✅` marker on the option** (the reliable signal), falling back to the `**Answer:**` letter — no more inheriting the TF answer.
  - [x] Option extraction tolerates `- A)` (S1/S3) and `- **A.**` (S4) and strips `✅`/`❌`; duplicate correct-answer lines (S4) are de-duped.
  - [x] Verified: MCQs are `type: "mcq"` with populated options and letter answers; **0** option texts contain `✅`/`❌`.
- **Verify:** ✅ Parser harness → **411 questions** (248 TF + 163 MCQ); 0 answer leaks, 0 malformed MCQs, 0 empty questions, 0 duplicate ids.

### 1.2 🟠 Every question is tagged `easy`; Sections 2 and 3 are dropped entirely

- **Location:** `inferDifficultyFromSection()` `js/game.js:329`, `parseStructuredQuestionBlock()` `js/game.js:184`, section headings in `Menstrual_Health questions.md`.
- **Symptom:** Only **200 of ~600+** questions were parsed, all from "Section 1," all difficulty `easy`. The difficulty system was dead, which is what emptied the pool in 0.1.
- **Root cause:** The old structured parser only recognised `### TF-` headings, and `inferDifficultyFromSection` matched strings like `"questions 1-50"` that never appear in the real section titles.
- **Fix steps:** ✅ DONE (2026-07-13) — the new parser handles **all four** section formats:
  - [x] **S1** (`### TF-N`): TF + MCQ. **S2** (`**N.**`): TF statements only. **S3** (`### QN`): TF + MCQ. **S4** (`### Question N`): 5-option clinical MCQ (bold-scenario prompt, `- **A.**` options).
  - [x] Difficulty assigned by section: S1/S2 → `easy`, S3 → `medium`, S4 → `hard`. `START_DIFFICULTY = "easy"` includes all.
  - [x] Result: **411 usable questions** spanning all sections (easy 298 / medium 100 / hard 13).
- **Content gaps — RESOLVED via source cleanup (2026-07-13, at author's direction):**
  - [x] **Section 4:** on inspection, only **7** of the "blank" questions (Q13–Q19) had a real prompt + options; those were **answered** (Q13→B, Q14→B, Q15→A, Q16→B, Q17→B, Q18→A, Q19→B). The other **243 were completely empty placeholder shells** (`### Question N` + `****` + blank `**Answer:**`) — **deleted**. Section 4 now holds 20 fully-answered clinical MCQs (heading updated to "1–20").
  - [x] **Section 2 filler MCQs (199)** — **deleted** from the source; the clean True/False statements are kept. (`**Explanation:** True` filler lines removed too.)
  - [x] **Section 3 generic MCQs Q11–Q50 (40)** — **deleted** from the source; True/False stems and bespoke MCQs Q1–Q10 kept.
- **Verify:** ✅ Post-cleanup parser → **378 questions** (0 empty, 0 leaks, 0 malformed); TF counts intact (S1 100 / S2 99 / S3 50); S4 = 20 answered; game playthrough clean.

### 1.3 🟡 Orphaned duplicate question bank

- **Location:** repo root — `questions.md` (~174 KB) vs. `Menstrual_Health questions.md` (the one actually loaded, `js/game.js:26`).
- **Symptom:** Two large question files; `questions.md` is referenced only in code comments and never loaded.
- **Root cause:** Leftover file from an earlier format.
- **Fix steps:**
  - [x] Decide which file is canonical → `Menstrual_Health questions.md`.
  - [x] Delete the unused one → `questions.md` DELETED (2026-07-13).
  - [x] Stale `js/game.js` comments that said "questions.md" updated to "the question bank" (2026-07-13).

---

## Phase 2 — Content accuracy (requires domain expert)

### 2.1 🟠 Incorrect answers in the question bank — the game would teach wrong facts

- **Location:** `Menstrual_Health questions.md` (source content).
- **Symptom:** Several True/False answers were marked incorrectly. For a health-education tool this is the most serious *content* issue — players would learn wrong information.
- **Method used:** In every affected block the **Explanation and MCQ already stated the correct fact**; only the True/False marker disagreed. Corrections were made by flipping the T/F marker to agree with the block's own explanation — no explanation text was reworded, and MCQ answer lines were left untouched. This uses the document's own embedded ground truth rather than external assertion.

**✅ DONE — 12 Section-1 True/False answers corrected (2026-07-13):**

| ID | Statement | Was | Now |
|---|---|---|---|
| TF-2 | A 28-day cycle is standard for **all** women | ✅ True | ❌ False |
| TF-6 | A typical period lasts 3–7 days | ❌ False | ✅ True |
| TF-7 | PMS is the **same as** menstruation | ✅ True | ❌ False |
| TF-8 | Menarche usually occurs around age 13 | ❌ False | ✅ True |
| TF-11 | Stress can cause menstrual irregularities | ❌ False | ✅ True |
| TF-12 | Heavy periods (menorrhagia) are a **sign of good health** | ✅ True | ❌ False |
| TF-13 | Oligomenorrhea can be caused by stress/weight/hormones | ❌ False | ✅ True |
| TF-14 | Dysmenorrhea is a common experience during menstruation | ❌ False | ✅ True |
| TF-15 | Menstrual cramps are **only** caused by physical factors | ✅ True | ❌ False |
| TF-16 | A missed period is **always** an indication of pregnancy | ✅ True | ❌ False |
| TF-27 | Wearing the same pad/tampon for an entire day is unhealthy | ❌ False | ✅ True |
| TF-29 | Menstrual cups are **only** for women who have given birth | ✅ True | ❌ False |

- **Remaining / open (need decisions or expert input):**
  - [x] **TF-5** ("Progesterone peaks just before menstruation," marked False) — RESOLVED (2026-07-13): T/F kept as False; **MCQ-5 correct option reworded** from "Just before menstruation begins" to "During the mid-luteal phase," so the T/F, MCQ, and explanation now all agree.
  - [ ] **Sections 2 & 3** (~412 `### Q`-style questions on Family/Education/Community and WASH/Period Poverty): not yet reviewed for accuracy — **deferred by request.** These aren't loaded by the game yet (see 1.2).
  - [x] **Orphaned `questions.md`** — DELETED (2026-07-13). Was an older prose format never loaded by the game. See 1.3.
  - [ ] (Optional, dev) Build a validation script that flags any T/F answer contradicting its own explanation, plus duplicate statements with conflicting answers — see feature backlog.

### 2.2 Sections 2, 3 & 4 accuracy review — DONE (2026-07-13)

Reviewed every reviewable answer in the remaining sections (same method: cross-check against the block's explanation where present, otherwise judge the statement directly).

- **Section 2 (99 True/False):** ✅ **No errors.** All statements are positive "good-practice" claims correctly marked True. (Its odd-numbered open Q&A items and auto-generated MCQs are not used by the game.)
- **Section 3 (50 True/False):** ⚠️ **13 wrong answers fixed.** From Q21 on the answers were auto-generated and unreliable. Corrected: **Q18, Q21, Q26, Q29, Q34, Q40, Q44** (were False → now True) and **Q23, Q28, Q31, Q36, Q42, Q46** (were True → now False). Q18's explanation (a copy of Q19's) was also replaced with a correct one.
  - Section 3's generic **"Which statement about X is correct?" MCQs (Q11–Q50)** were low quality *and* carried some of those wrong answers, so the parser now **excludes** them (same treatment as Section 2's MCQs). Section 3's bespoke MCQs (Q1–Q10) are kept.
- **Section 4 (13 answered MCQs):** ✅ **No errors** — all 13 answered clinical questions are correct. The remaining ~250 have blank answers in the source (content gap, see 1.2), so they are excluded until the author fills them in.

Net effect on the pool: **371 questions** (was 411; the drop is the excluded generic Section-3 MCQs). All verified via parser harness and a headless playthrough — 0 answer leaks, 0 malformed questions.

---

## Phase 3 — Tests & tooling

### 3.1 🟠 Two Playwright tests fail

- **Location:** `tests/dice.spec.ts`, `tests/game.spec.ts`.
- **Symptom:** `npm test` → 3 pass, 2 fail.
- **Root cause:**
  - `dice.spec.ts` asserts on `#dice-cube`, `.dice-face-panel`, `.dice-face-[1-6]` — DOM that was **removed** when the dice became a Three.js `<canvas>`. It can never pass in its current form.
  - `game.spec.ts` fails as a **downstream symptom of issue 0.1** (the crash), plus it expects the old fallback text "Menstruation…" which no longer appears once real markdown questions load.
- **Fix steps:** ✅ DONE (2026-07-13)
  - [x] Rewrote `dice.spec.ts` to assert on the current dice: `#dice-canvas-container` visible, `.rolled-number` updating to `[1-6]`, and roll button re-enabling. Removed selectors (`#dice-cube`, `.dice-face-panel`, `dice-face-[1-6]`) dropped. Added a question-modal helper that answers TF **or** MCQ.
  - [x] Made `game.spec.ts` assertion-agnostic about question content: it now checks `#question-text` is non-empty and answers whichever type appears, instead of matching the old "Menstruation" fallback text.
  - [x] Re-ran `npm test` → **5 passed** (audit + dice + 3 game).

### 3.2 🟢 Broken references in `package.json`

- **Location:** `package.json`.
- **Symptom:** `main: "index.js"` points to a non-existent file; `description` links to `plans/DOCUMENTATION.md`, which doesn't exist.
- **Fix steps:** ✅ DONE (2026-07-13)
  - [x] Removed `main: "index.js"` — no JS entry point for a static site.
  - [x] Replaced `description` with a real one-line description (dropped the dead `DOCUMENTATION.md` link).

### 3.3 🟢 Dead CSS from the old dice

- **Location:** `css/styles.css:1406` (`.dice-cube` rule inside a media query).
- **Symptom:** Rule targets an element that no longer exists.
- **Fix steps:** ✅ DONE (2026-07-13)
  - [x] Removed the `.dice-cube` block (in the `@media` query at `css/styles.css:1406`). Grep confirms **0** remaining `.dice-cube` / `.dice-face-*` rules.

---

## Phase 4 — UX, accessibility & polish

### 4.1 🟡 Escape key soft-locks the game

- **Location:** keydown handler `js/game.js:2326`, `hideQuestionModal()` `js/game.js:1671`.
- **Symptom:** Pressing **Escape** during a question hides the modal but the turn never resolves — the game freezes, and it also lets a player dodge questions.
- **Root cause:** The Escape handler hides the modal but doesn't reset `isQuestionActive` or invoke the pending answer callback, so `handleTurn` waits forever and the roll button stays disabled.
- **Fix steps:** ✅ DONE (2026-07-13)
  - [x] Chose **ignore Escape while a question is active** — safest option; also stops players skipping questions. The keydown handler now returns early when `gameState.isQuestionActive`, so the modal is never hidden out from under an unresolved turn. (Handler at `js/game.js` end-of-file.)
- **Verify:** ✅ Browser preview — rolled to open a question, pressed Escape: modal stays visible, turn stays live, no freeze; answering then Continue closes it cleanly with 0 console errors.

### 4.2 🟢 "1 player" option does nothing

- **Location:** `index.html:242` (dropdown), `createInitialGameState()` `js/game.js:655` (min-2 enforcement).
- **Symptom:** Selecting **1** player still spawns 2.
- **Fix steps:** ✅ DONE (2026-07-13)
  - [x] Removed the `1` option from the dropdown (the game already supports AI opponents via per-player toggles; a true 1-total-player game can't form). Dropdown now offers 2/3/4. Verified in preview.

### 4.3 🟢 Three.js loaded from CDN (offline = no 3D dice)

- **Location:** `index.html:8` (CDN `r128`).
- **Symptom:** The "open `index.html` and play offline" promise breaks the 3D dice when offline (a 1.2s blank fallback kicks in).
- **Fix steps:** ✅ DONE (2026-07-13)
  - [x] Vendored Three.js locally at `assets/vendor/three.min.js` and referenced it relatively in `index.html`; the CDN `<script>` is gone. Verified in preview: `window.THREE` loads from `/assets/vendor/three.min.js`, dice roll works, 0 console errors.
  - [x] Kept **r128** deliberately — the dice code (`getEulerForFace`, mesh setup) targets that API; a version bump is a separate, riskier change left for later.

### 4.4 🟢 Assorted polish

- [x] **Back button** — DONE (2026-07-13): hidden on load when `window.history.length <= 1` (nothing to go back to); still wired to `history.back()` when there is history. Verified hidden in preview.
- [x] **Restart button** — DONE (2026-07-13): now `hidden` by default in `index.html`; shown in `startGame()`, on a restored in-progress game, and kept visible through `resetGame()` (stale `hidden = true` there fixed). Verified: hidden before start, visible after.
- [x] **Modal focus management** — DONE (2026-07-13): added a reusable focus trap (`activateFocusTrap`/`deactivateFocusTrap`) wired into the setup, question, and winner modals — Tab cycles within the open modal and focus returns to the trigger on close. Verified in preview (focus trapped inside the question modal).
- [x] **Favicon** — DONE (2026-07-13): inline SVG (🩸) data-URI favicon added to `<head>`. Verified present.
- [x] **Persistence gap** — FIXED (2026-07-13): saved question pool now restored via an id→question map across **all** types (was True/False only, dropping MCQs on reload).

### 4.5 🟠 IndexedDB save was completely broken (boolean key) — FIXED

- **Location:** `js/game.js` persistence helpers (`deleteCurrentRecord`, `persistCurrentGame`, `archiveFinishedGame`, `loadCurrentGame`).
- **Symptom:** Surfaced once the crash (0.1) was fixed and the game ran far enough to save: `Failed to execute 'only' on 'IDBKeyRange': The parameter is not a valid key` thrown on **every turn**. Game state was never saved and "resume game" never worked.
- **Root cause:** Records used `isCurrent: true/false` and queried `IDBKeyRange.only(true)`. **IndexedDB does not accept booleans as keys**, so the query threw.
- **Fix:** ✅ DONE (2026-07-13) — switched the `isCurrent` flag to numeric `1`/`0` and query `IDBKeyRange.only(1)`. Verified: full playthrough now saves with **zero** page/console errors.

### 4.6 🟢 Stray asterisk in Section 4 prompts — FIXED

- **Symptom:** S4 MCQ prompts rendered as `*Which Sustainable Development Goal…` with a leading `*`.
- **Root cause:** `cleanMarkdownText` stripped one leading `*` as a bullet, breaking the `**bold**` pair and leaving a stray asterisk.
- **Fix:** ✅ DONE (2026-07-13) — strip `**` markers before `cleanMarkdownText` in the S4 prompt path. Verified: 0 questions begin with a stray marker.

---

## Note on tests (Phase 3 — DONE 2026-07-13)

The Phase 0/1 fixes are verified by a **standalone parser harness** and a **headless browser playthrough**, both green. The committed Playwright suite is now also green: `dice.spec.ts` was rewritten against the current dice DOM and `game.spec.ts` made content-agnostic, so **`npm test` → 5 passed** (audit + dice + 3 game).

---

## Appendix A — What's working well (don't break these)

- Clean, no-build static architecture — genuinely "open and play."
- IndexedDB persistence with a localStorage fallback (`js/game.js:1062`+).
- Three.js dice with a graceful non-WebGL fallback path (`rollDice`, `js/game.js:1442`).
- Persisted theme / music / sound / read-aloud preferences.
- Strong semantic HTML and ARIA labelling throughout `index.html`.
- Responsive CSS and AI-player support.
- Playwright harness with its own static file server.

---

## Appendix B — Feature backlog (post-fix)

Scaffolding that already exists but is unused — cheap wins:

- [ ] **End-of-game knowledge report** — "missed 3 hygiene questions, 1 anatomy." Turns the game into a learning loop.
- [ ] **Scoring + achievements + history screen** — `player.score`, `player.achievements`, and `fetchGameHistory()` are already persisted but never surfaced in the UI.
- [ ] **Difficulty selection in setup** — once difficulty tagging (1.2) is fixed.
- [ ] **Localization** for Ghanaian languages (Twi, Ewe, Ga) — directly serves the mission.
- [ ] **PWA / offline install** — manifest + service worker + local Three.js, for low-connectivity use.
- [ ] **Per-question timer** and a **"learn mode"** that always shows explanations.
- [ ] **Question-bank linter** — validates every question has an answer, flags duplicates/contradictions (see 2.1), catches malformed blocks before they ship.

---

## Appendix C — Reproducing the parser audit

To re-check parsing after edits, run the parser standalone in Node (no browser needed): load `js/game.js` in a minimal sandbox that stubs `window`/`document`/`fetch`, read `Menstrual_Health questions.md`, call `parseQuestionsMarkdown(md)`, and inspect counts by `type`, `section`, and `difficulty`. Expected healthy output after Phase 1: all three sections represented, MCQs typed as `mcq` with populated options, and a spread of difficulties.
