# Project Handover & Technical Specification: Airport Gate Game Suite

**Project Name:** Airport Gate Game Suite (Mode 1: *Carry-On Tetris* & Mode 2: *Where Are We Flying?*)  
**Current Version:** v0.2 (Playable Single-File Suite for Mode 1 & Mode 2)  
**Target Environment:** Antigravity / AI-Assisted Web IDE (Live Preview + Iterative Development)  
**Architecture:** Mobile-First, Zero-Dependency Vanilla HTML5 / CSS3 / ES6 JavaScript  

---

## 1. Executive Summary & Product Vision

Travelers waiting at airport gates operate under unique physical and cognitive constraints:
1. **Single-Handed / Single-Thumb Operation:** Players are typically holding a coffee, phone, or carry-on handle with one hand.
2. **High Interruption Frequency:** Players must glance up at boarding screens or listen to gate announcements at a moment's notice. Zero timers or reflex penalties are permitted.
3. **Spotty Connectivity:** The application must load fast and run 100% client-side with zero external runtime dependencies.
4. **Short Session Loops:** Rounds should last 2 to 5 minutes, matching boarding group wait times.

### Selected Game Modes
* **Mode 1 (Built in v0.1, Enhanced in v0.2): *Carry-On Tetris* (Spatial Inventory Puzzler)**
  * A cozy, tactile grid-packing puzzle where players fit awkward travel items into a carry-on suitcase while obeying TSA screening and physical packing constraints.
* **Mode 2 (Built in v0.2): *Where Are We Flying?* (Geo-Deduction Trivia)**
  * A digital boarding-pass deduction game where players act as a Gate Agent routing flights based on flight duration, destination weather, and passenger manifest clues.

---

## 2. Architecture & Implementation State (v0.2)

### Core UX Decision: Tap-to-Select + Tap-to-Place
Standard HTML5 drag-and-drop on mobile screens suffers from "fat-finger occlusion" (the player's thumb covers the exact grid cells they are trying to target). Instead, the game uses a deterministic two-step interaction:
1. **Tap an item card** in the bottom tray to select it (or tap the **Rotate Item** button to transpose its 2D matrix $90^\circ$ clockwise).
2. **Tap a cell in the suitcase grid** to anchor and place the item. Tapping an already-packed item inside the suitcase immediately unpacks and re-selects it for effortless rearranging.

### Validation Rules Engine (`validatePlacement`)
1. **Boundary & Collision Check:** All `1` bits in `item.shape` must land within `[0..rows-1, 0..cols-1]` and on `null` cells.
2. **Anchor Offset Calculation:** Automatically shifts the horizontal placement anchor (`firstColOffset`) to the first non-zero column in the item's top row.
3. **`TOP_ROW` Rule (TSA Quick-Access):** Liquids (`🧴`) and laptops (`💻`) must have at least one occupied cell in Row `0` (top zipper row).
4. **`BOTTOM_HEAVY` Rule:** Heavy boots (`🥾`, `🎿`) must have at least one occupied cell in Row `rows - 1` (bottom row).
5. **`FRAGILE` vs. `HEAVY` Adjacency Check:** Orthogonal neighbor scan (`[-1,0], [1,0], [0,-1], [0,1]`) ensures items marked `FRAGILE` never share an edge with `HEAVY` or `BOTTOM_HEAVY` items.

### v0.2 Additions
* **Ghost Placement Preview:** Hovering or touch-sliding over grid cells highlights valid (`preview-valid`) or invalid (`preview-invalid`) footprints before committing placement.
* **Weight Balance Meter:** Horizontal center-of-gravity bar below the suitcase that calculates left-vs-right torque (`(col - 2.5) * itemMass`) and awards `+200 Bonus Miles` when balanced.
* **Gate Agent Curveballs:** Mid-level announcement when 1 item remains unpacked, offering an extra bonus item (*Neck Pillow*, *Duty-Free Tin*, *Hand Warmers*) for `+500 Bonus Miles`.
* **Boarding Pass Header Tab Switcher (`[ 🧳 Pack Carry-On | 🛫 Gate Trivia ]`):** Seamless single-thumb mode switcher inside the boarding pass header with shared Frequent Flyer Miles (`localStorage`).
