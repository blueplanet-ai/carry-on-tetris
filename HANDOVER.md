# Project Handover: Carry-On Tetris (Gate Edition)

**Date:** 2026-10-22  
**Current Version:** v0.3  
**Status:** Playable, tested, zero-dependency client-side PWA  
**Stack:** Vanilla HTML5, CSS3, ES6 JavaScript, Web Audio API, Web Haptics, Service Worker (Cache-first/Network-first)  
**Location:** `/Users/chuhee/Documents/Antigravity/carry-on-tetris`

---

## 1. Executive Summary

Carry-On Tetris is an airport gate game suite designed for travelers waiting at boarding gates. It caters to **single-thumb mobile play**, **zero reflex/interruptible game loops**, and **spotty airport Wi-Fi**.

In this iteration (v0.3), the suite was upgraded from a 2-mode prototype (v0.2) to a complete 3-mode offline-ready PWA with balanced puzzle generation, economy progression, sound design, and bug fixes.

---

## 2. File Structure

| File | Purpose |
|---|---|
| [`index.html`](file:///Users/chuhee/Documents/Antigravity/carry-on-tetris/index.html) | Main single-file application containing CSS styling, SVG assets, HTML layout, and all game engine logic. |
| [`manifest.webmanifest`](file:///Users/chuhee/Documents/Antigravity/carry-on-tetris/manifest.webmanifest) | PWA Web App Manifest for mobile installation ("Add to Home Screen"). |
| [`sw.js`](file:///Users/chuhee/Documents/Antigravity/carry-on-tetris/sw.js) | Offline Service Worker caching `index.html`, `manifest.webmanifest`, and `icon.svg`. |
| [`icon.svg`](file:///Users/chuhee/Documents/Antigravity/carry-on-tetris/icon.svg) | High-res vector app icon (carry-on suitcase packed with tetromino blocks). |
| [`SPEC.md`](file:///Users/chuhee/Documents/Antigravity/carry-on-tetris/SPEC.md) | Initial technical design document. |
| [`antigravity_handover_spec.md`](file:///Users/chuhee/Documents/Antigravity/carry-on-tetris/antigravity_handover_spec.md) | Previous v0.2 handover document. |
| [`HANDOVER.md`](file:///Users/chuhee/Documents/Antigravity/carry-on-tetris/HANDOVER.md) | **(This file)** Complete status and continuation instructions for v0.3. |

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
- **Offline / PWA Ready:** Standalone manifest and service worker.

---

## 4. Save Data Schema (`localStorage`)

Key: `gate_suite_save_v3`

```json
{
  "miles": 1200,
  "lifetime": 1200,
  "muted": false,
  "skin": "classic",
  "ownedSkins": ["classic"],
  "bagStars": {
    "sfo-lax": 7,
    "daily-2026-10-22": 3
  },
  "tetrisLevel": 0,
  "triviaIdx": 0,
  "triviaSolved": {
    "sfo-yvr": true
  },
  "shuffleSolved": 1
}
```

---

## 5. How to Run & Verify

1. **Launch Local Server:**
   ```bash
   # From /Users/chuhee/Documents/Antigravity/carry-on-tetris
   npx serve .
   # or python3 -m http.server 8080
   ```
2. **Access in Browser:**
   - Navigate to `http://localhost:8080` (or active port).
   - Test responsive viewport (`375x667` or `430x932` mobile simulation).
3. **Test Checklist:**
   - [ ] Pack SFO ✈ LAX bag: rotate items, preview with mouse/touch, achieve 3 stars.
   - [ ] Test Undo (`↩️`) and Hint (`💡`).
   - [ ] Accept and leave Gate Agent Curveball item.
   - [ ] Switch to **🛫 Trivia**: test dynamic radar arc, 50/50 hint, clue reveal, and guess validation.
   - [ ] Switch to **🚶 Boarding**: slide passenger rows into the jet bridge gap, verify move counter & par payout.
   - [ ] Open **🛍️ Shop**: verify lifetime miles, tiers, and skin purchases.
   - [ ] Toggle sound (`🔊`) and verify Web Audio beeps.

---

## 6. Next Steps / Potential Future Backlog

When you return with fresh quota, here are recommended enhancements:
1. **Procedural Mode 1 Bag Customizer / Level Editor:** Allow players to design and share custom flight bags via URL hash query parameters.
2. **Online Leaderboard for Daily Bag:** Light backend (Firebase/Cloudflare Worker) to compare daily move count & bag balance across travelers.
3. **Flight Route Connections:** Deepen the multi-leg itinerary system (e.g. completing a 3-star pack automatically unlocks the onward flight leg in Trivia and Shuffle).
4. **Git Commit:** Review unstaged files (`git status`) and commit:
   ```bash
   git add index.html icon.svg manifest.webmanifest sw.js HANDOVER.md
   git commit -m "feat: release v0.3 airport gate game suite"
   ```
