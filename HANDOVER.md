# Project Handover: Carry-On Tetris (Gate Edition)

**Date:** 2026-10-23  
**Current Version:** v0.4.1  
**Status:** Playable, tested, zero-dependency client-side PWA  
**Stack:** Vanilla HTML5, CSS3, ES6 JavaScript, Web Audio API, Web Haptics, Service Worker (network-first, offline fallback)  

---

## 1. Executive Summary

Carry-On Tetris is an airport gate game suite designed for travelers waiting at boarding gates. It caters to **single-thumb mobile play**, **zero reflex/interruptible game loops**, and **spotty airport Wi-Fi**.

In v0.3 & v0.4, the suite was upgraded from a 2-mode prototype (v0.2) to a complete 3-mode offline-ready PWA with balanced puzzle generation, economy progression, sound design, multi-leg flight route connections, a daily flight leaderboard, and a shareable procedural bag customizer / level editor.

---

## 2. File Structure

| File | Purpose |
|---|---|
| [`index.html`](index.html) | Main single-file application containing CSS styling, SVG assets, HTML layout, and all game engine logic. |
| [`manifest.webmanifest`](manifest.webmanifest) | PWA Web App Manifest for mobile installation ("Add to Home Screen"). |
| [`sw.js`](sw.js) | Offline Service Worker caching `index.html`, `manifest.webmanifest`, and `icon.svg`. |
| [`icon.svg`](icon.svg) | High-res vector app icon (carry-on suitcase packed with tetromino blocks). |
| [`docs/archive/SPEC.md`](docs/archive/SPEC.md) | Initial technical design document (v0.2, archived). |
| [`docs/archive/antigravity_handover_spec.md`](docs/archive/antigravity_handover_spec.md) | Previous v0.2 handover document (archived). |
| [`HANDOVER.md`](HANDOVER.md) | **(This file)** Complete status and continuation instructions for v0.4.1. |

*Note: The redundant clone `carry_on_tetris.html` was removed from git.*

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
- **Mode 1: Carry-On Tetris:** 6 progressive destinations (SFO, LAX, JFK, LHR, CTS, SYD) + Daily Flight. Merged visual block borders + single-centroid emoji styling.
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

---

## 4. Save Data Schema (`localStorage`)

Key: `gate_suite_save_v3`

```json
{
  "version": 1,
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

1. **Launch Local Server:**
   ```bash
   # From the repository root
   npx serve .
   # or python3 -m http.server 8080
   ```
2. **Access in Browser:**
   - Navigate to `http://localhost:8080` (or active port).
   - Test responsive viewport (`375x667` or `430x932` mobile simulation).
3. **Test Checklist:**
   - [x] Pack SFO ✈ LAX bag: rotate items, preview with mouse/touch, achieve 3 stars.
   - [x] Test Undo (`↩️`) and Hint (`💡`).
   - [x] Accept and leave Gate Agent Curveball item.
   - [x] Follow Connected Itinerary (`1. Pack ➔ 2. Route ➔ 3. Board`) for +300 MI bonus and `🎫` chip badge.
   - [x] Open **🛠️ Custom Bag & Daily Board**: design a custom bag, toggle blocked cells, play & share via URL hash, and check the Daily Leaderboard.
   - [x] Open **🛍️ Shop**: verify lifetime miles, tiers, and skin purchases.
   - [x] Toggle sound (`🔊`) and verify Web Audio beeps.
