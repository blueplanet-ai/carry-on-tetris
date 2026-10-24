# Project Handover: Gate Games

**Date:** 2026-10-23  
**Current Version:** v0.7  
**Status:** Playable, tested, zero-dependency client-side PWA  
**Stack:** Vanilla HTML5, CSS3, ES modules (no build step), Web Audio API, Web Haptics, Service Worker (network-first, offline fallback)  

---

## 1. Executive Summary

Gate Games (formerly Carry-On Tetris) is an airport gate game suite designed for travelers waiting at boarding gates. It caters to **single-thumb mobile play**, **zero reflex/interruptible game loops**, and **spotty airport Wi-Fi**.

In v0.3 & v0.4, the suite was upgraded from a 2-mode prototype (v0.2) to a complete 3-mode offline-ready PWA with balanced puzzle generation, economy progression, sound design, multi-leg flight route connections, a daily flight leaderboard, and a shareable procedural bag customizer / level editor.

---

## 2. File Structure

Since v0.5 the game is split into ES modules (no bundler). The game logic that doesn't touch the page is in pure modules that run under Node, so it can be unit-tested. See [`README.md`](README.md) for the full table.

| Path | Purpose |
|---|---|
| [`index.html`](index.html) | Page markup only. Buttons declare `data-action` / `data-arg`; `js/main.js` maps them to functions. |
| [`css/styles.css`](css/styles.css) | All styling. |
| [`js/main.js`](js/main.js) | Entry point: action map, keyboard shortcuts, share-link listener, boot. |
| [`js/modes/`](js/modes) | `pack.js` (Pack Your Carry-On), `trivia.js` (Where Are We Flying?), `boarding.js` (Boarding Group Shuffle). Each exports a `…Header()` used by `js/shell.js`. |
| [`js/generator.js`](js/generator.js), [`js/packing.js`](js/packing.js), [`js/boarding-logic.js`](js/boarding-logic.js), [`js/custom-bag.js`](js/custom-bag.js) | Pure logic: bag generator and content, placement rules and balance, sliding-puzzle solver, share links. |
| [`js/save.js`](js/save.js) | Versioned save data (`migrateSave`). |
| [`js/state.js`](js/state.js) | The only cross-mode state: active mode, connected itinerary, custom bag. |
| [`sw.js`](sw.js) | Offline service worker; its `ASSETS` list must include every module (enforced by `tests/unit/sw-assets.test.js`). |
| [`tests/`](tests) | `unit/` (Node test runner) and `e2e/` (Playwright, clicks through the real UI). |
| [`docs/archive/`](docs/archive) | v0.2 design documents. |

---

## 3. What Was Implemented in v0.3

### 🐛 Bug Fixes & Exploits Closed
1. **Infinite Miles Exploit:** Miles are now awarded strictly via a bitmask (`save.bagStars`) on first-time achievements (1 = Packed, 2 = Balanced, 4 = 100% Full). Re-packing won't pay duplicate miles.
2. **Trivia Guessing Exploit:** Pool can reach `0 MI`. Guessing buttons are disabled upon click to prevent double-penalty or brute-forcing free miles. Solved flights switch to practice mode (0 MI).
3. **Mobile Touch Ghost Previews:** Added touch support with two-tap confirmation: tap to preview footprint / slide across the suitcase to test placement, and tap again on the target cell to commit.
4. **Curveball Dead-End:** Added a **"🚪 Leave at gate"** option to drop the bonus item if the player cannot fit it into the bag.
5. **Placement Anchoring:** Replaced rigid top-left column matching with **centroid-based anchoring**, so shapes land where intuitively tapped.
6. **Randomized Trivia Answers:** Choices are now shuffled on every flight round (previously always option 2).

### 🧩 Gameplay & Puzzle Improvements
1. **Solvable 100% Bag Generator:** Algorithmic partition-based solver guarantees that each bag has a mathematically valid 100% full solution.
2. **3-Star Rating System:**
   - ⭐ **Star 1:** All required items packed adhering to TSA/packing rules.
   - ⭐ **Star 2:** Left-right torque balanced & heavy items sitting low.
   - ⭐ **Star 3:** Suitcase zipped 100% full (no empty slots).
3. **Daily Flight Bag:** Generates a date-seeded bag (`daily-YYYY-MM-DD`) that is identical for all players every day.
4. **Undo & Hints:**
   - Full state snapshot undo stack (`↩️ Undo`, keyboard `Z`).
   - Packing hints (`💡 Hint`, keyboard `H`): Reveals the exact solution footprint for the selected item in exchange for 150 Miles.
5. **Keyboard Shortcuts:** `R` (rotate), `Z` (undo), `H` (hint), `Esc` (close shop modal).

### 🎮 Modes & Features
- **Mode 1: Pack Your Carry-On:** 6 progressive destinations (SFO, LAX, JFK, LHR, CTS, SYD) + Daily Flight. Merged visual block borders + single-centroid emoji styling.
- **Mode 2: Where Are We Flying? (Geo-Trivia):** Expanded from 3 to 12 international routes with dynamic SVG radar heading arcs, animated flying plane, and a 50/50 hint tool (`✂️ 50/50` for 100 MI).
- **Mode 3: Boarding Group Shuffle:** Brand new 3x3 sliding-tile minigame. Players slide passengers (Groups 1–8) into sequential order towards the open jet bridge door. Includes par scoring.
- **Frequent Flyer Shop & Tiers:**
   - Status tiers: Economy ➔ Premium Economy ➔ Business ➔ First Class.
   - 5 Suitcase themes: Classic Slate, Sunset Coral, Aviator Leather, Neon Jetset, First Class Gold.
- **Audio & Haptics:** Custom synthesizer built on Web Audio API (sine/triangle oscillators) with haptic feedback (`navigator.vibrate`) and global mute toggle (`🔊`/`🔇`).
- **Offline / PWA Ready:** Standalone manifest and service worker (`carry-on-v4`).

### 🚀 What Was Added in v0.4
1. **Procedural Mode 1 Bag Customizer / Level Editor (`🛠️`):**
   - Interactive modal allowing players to customize Origin/Destination IATA codes, Suitcase dimensions (`4x5` up to `6x7`), Destination theme, TSA/Heavy rule strictness, Puzzle seed, and tap-to-toggle blocked wheel/frame cells.
   - Generates a guaranteed-solvable 100%-full bag and encodes/decodes the entire custom level via URL hash parameters (`#custom=1&o=SFO&d=NRT...`) for one-click sharing (`🔗 Share URL`).
2. **Daily Flight Bag Leaderboard & Scorecard Sharing:**
   - Tracks daily packing move count (`packMoves`), center-of-gravity balance percentage (`balancePct`), and stars earned (`save.dailyStats`).
   - Displays a date-seeded Gate Leaderboard in the `🛠️` modal comparing the player's daily run against gate travelers, plus a one-click **📋 Copy Daily Score Card** button.
3. **Connected Multi-Leg Flight Itinerary System (`1. Pack ➔ 2. Route ➔ 3. Board`):**
   - Packing a destination bag unlocks a connected onward itinerary banner (`#itineraryBar`).
   - Players transition from **1. Pack** (`🛫 Connect at <DEST> ➔`) to **2. Route** (Trivia leg departing that destination) and then **3. Board** (`🚶 Board <ORIGIN> ✈ <DEST>` in Boarding Group Shuffle), earning a **+300 MI Itinerary Completion Bonus** and a `🎫` badge on the level chip.

### 🔧 What Was Fixed in v0.4.1
1. **Unpackable custom bags:** layouts that can't be split into pieces (e.g. a free cell walled in by blocked cells) are rejected in the builder, and a bad shared link falls back to a regular bag instead of crashing the app. Shared links are capped at the builder's blocked-cell limit.
2. **3 stars always reachable:** the generator keeps the most balanced solution and searches up to 400 attempts, so every daily and custom bag has a balanced 100%-full pack.
3. **Boarding miles farm closed:** Boarding Group Shuffle pays miles only for the first line-up each day (`save.shuffleRewardDay`); the +300 MI itinerary bonus is unchanged.
4. **Boarding par is real:** each line-up is scrambled with an 80-step walk and par is the BFS-shortest solution + 6 moves.
5. **Keyboard:** Ctrl/Alt/⌘ shortcuts are left to the browser (Ctrl/⌘+Z still undoes). The suitcase grid is playable with arrow keys + Enter/Space, and item cards are reachable with Tab.
6. **Smaller fixes:** daily score is saved under the bag's own date (no midnight mix-up); undo counts as a daily move and no longer replays the win fanfare; paid hints are remembered per item for the whole bag; the level strip no longer scrolls the page; touch devices see touch instructions from the start; the service worker only caches successful same-origin responses (`carry-on-v5`).
7. **Honesty:** the Daily leaderboard is labelled as sample scores — the other travelers are generated, not real players.
8. **Save versioning:** saves carry `version` and are upgraded through `migrateSave()`.

### 🧱 What Changed in v0.5
1. **Modules:** the single 3,400-line `index.html` is split into `css/styles.css` and ES modules under `js/` (no build step). Inline `onclick` handlers became `data-action` attributes handled by one click listener.
2. **Tests:** 29 unit tests (generator solvability for every level and a year of daily bags, placement rules, the sliding-puzzle solver, share links, save migration, offline asset list) and 11 Playwright end-to-end tests (3-star pack, keyboard, touch, trivia, connected trip, Boarding miles cap, shared links, offline).
3. **Tooling:** `package.json` with `npm start`, `npm test`, `npm run test:e2e` and `npm run lint` (ESLint); CI on every pull request.
4. **Hardening:** share-link airport codes are letters only.


### 🛫 What Was Added in v0.6
1. **Wide-body boarding:** connected trips from the 4th bag on (LHR ✈ RAK onward) board a 4×4 cabin with Groups 1–15, paying 600 / 300 MI (under / over par) instead of 400 / 200. Free play stays 3×3. 4×4 lines use a 30-move scramble so the exact solver (`solve()` in `js/boarding-logic.js`, now returning the move list) finishes in milliseconds; it has a work budget, and if that runs out par falls back to the scramble length, which is always a valid solution.
2. **Trivia flights unlock as you pack:** each flight has an `unlockBag` in `js/data/trivia-rounds.js`. Two flights are open from the start and each hand-made bag opens two more, including the flight leaving that bag's destination (for connected trips). Flights already routed stay open. A flight strip in Trivia shows routed ✓, open and 🔒 flights; tapping a locked one says which bag opens it.
3. **Perfect and skipped bags:** a 3-star bag gets 🏆 on its chip and header badge, and replaying it says the stars are banked. A stuck player can skip a hand-made bag (second tap confirms) to open the next one. Skipping earns nothing, marks the chip ⏭, and doesn't unlock that bag's trivia flights. Rules live in the pure `js/progress.js`.
4. **Save v2:** adds `skippedBags`.
5. **Header fix:** on narrow phones the header controls now wrap below a long route title instead of overlapping it.

### 🎨 What Changed in v0.7 (redesign)
The game now uses the look of [blueplanet-ai.github.io](https://blueplanet-ai.github.io/): ink on a Sage paper ground, Newsreader / Saira / IBM Plex Mono, teal for what you're holding and one burnt-orange action per screen. The colour tokens are the site's (see its `DESIGN.md`), in `:root` at the top of `css/styles.css`, with dark mode defined twice (system setting, and `data-theme="dark"`).
1. **Boarding-pass header:** a dark teal ticket (a calmer `#0A3D45` in dark mode) with city names over flat bold Arial codes, a dashed tear line with notches on both edges, and a stub for the bag/flight number, miles and the buttons. `#routeTitle` keeps its plain `SFO ✈ LAX` text; `js/shell.js` splits it into styled codes. City names come from `js/data/airports.js` (trivia answers use their option labels).
2. **Drawn objects instead of emoji:** `js/art.js` holds flat line drawings for every packing item (mapped by name; a unit test checks none are missing), small rule badges, and the 15 boarding passengers with what each group carries. UI icons are an SVG sprite at the top of `index.html` (`<use href="#i-…">`).
3. **Pack:** a hard-shell suitcase with a telescoping handle, corner guards, a zipper track and wheels; items keep their merged-cell shapes in muted rule colours (sand = TSA top row, slate = heavy, mist = fragile). Weight balance is a scale whose beam tips toward the heavier wheel; `computeBalance()` now also returns `left` / `right`. Tray cards show each item's drawing and footprint.
4. **Trivia:** a flat flight plot, clue cards with icons, and answers as luggage tags. **Boarding:** drawn passengers and an orange jet-bridge door.
5. **Light / dark toggle** in the header (`js/theme.js`), saved under `bp-theme` like the site; with no choice the system setting applies.
6. **Shop shells:** the five suitcase skins are now shell colours (`--shell`); their ids are unchanged, so saves keep the equipped skin.
7. Fonts load from Google Fonts; offline (or blocked) the game falls back to Georgia / system sans / monospace. The pass codes use Arial, which is always available.

### 🧾 What Changed in v0.7.1 (records)
1. **Daily leaderboard removed:** the game has no accounts or server, so the "gate travelers" it ranked you against were generated names and scores.
2. **Records window (trophy button in the header):** personal bests on this device, with Pack, Trivia and Boarding tabs; it opens on the game you're playing. Logic is the pure `js/records.js` (unit-tested), the window is `js/records-view.js`.
   - **Pack:** your daily bag (today plus the last 7 days, with **Copy daily score card** and **Play daily bag**, moved here from the builder) and the best run per hand-made bag: more stars, then fewer moves, then better balance. Custom bags keep no record. Bags packed before v0.7.1 show their banked stars until replayed.
   - **Trivia:** best score per flight (what the reward pool would pay, out of 500: clues and wrong guesses lower it), then fewest wrong guesses. Practice replays count, so a routed flight can still be improved.
   - **Boarding:** per cabin size (3×3 and 4×4), the best result against par (line-ups are scrambled differently each time, so raw moves don't compare), line-ups solved and how many finished at or under par.
3. **New best:** beating an earlier record says so in that game's win banner. A first result is recorded quietly.
4. The 🛠️ window is now just the custom bag builder.
5. **Save v3** adds `bagRecords`, `triviaRecords` and `boardingRecords`.
6. **New app icon** in the v0.7 look (`icon.svg`): a light hard-shell suitcase on boarding-pass teal, packed with pieces in the rule colours and one orange accent. `apple-touch-icon.png` (180×180) is a render of it for iOS, which ignores SVG touch icons; re-render it if the SVG changes. The manifest's old navy colours now match the page's Sage ground. Service worker cache is `gate-games-v12`.

---

## 4. Save Data Schema (`localStorage`)

Key: `gate_suite_save_v3`

```json
{
  "version": 3,
  "miles": 1200,
  "lifetime": 1200,
  "muted": false,
  "skin": "classic",
  "ownedSkins": ["classic"],
  "bagStars": {
    "sfo-lax": 7,
    "daily-2026-10-22": 3
  },
  "dailyStats": {
    "2026-10-22": { "moves": 8, "balancePct": 94, "stars": 3, "mask": 7 }
  },
  "bagRecords": {
    "sfo-lax": { "stars": 3, "moves": 9, "balancePct": 95 }
  },
  "triviaRecords": {
    "sfo-yvr": { "score": 350, "wrong": 1 }
  },
  "boardingRecords": {
    "3": { "solved": 5, "atPar": 4, "vsPar": -3, "moves": 19, "par": 22 }
  },
  "skippedBags": {
    "jfk-lhr": true
  },
  "itineraries": {
    "sfo-lax": true
  },
  "tetrisLevel": 0,
  "triviaIdx": 0,
  "triviaSolved": {
    "sfo-yvr": true
  },
  "shuffleSolved": 1,
  "shuffleRewardDay": "2026-10-22"
}
```

---

## 5. How to Run & Verify

```bash
npm start              # serve at http://localhost:8080 (ES modules need http, not file://)
npm install            # dev tools: ESLint + Playwright
npm run lint && npm test
npx playwright install chromium && npm run test:e2e
```

The end-to-end suite covers the old manual checklist (packing to 3 stars, undo/hints/keyboard, curveball, connected itinerary, custom bags, offline). Still worth a manual pass on a real phone: haptics, sound, and Add to Home Screen.
