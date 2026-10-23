# Project Handover & Technical Specification: Airport Gate Game Suite

**Project Name:** Airport Gate Game Suite (Mode 1: *Carry-On Tetris* & Mode 2: *Where Are We Flying?*)  
**Current Version:** v0.2 (Mode 1 with Balance Meter, Ghost Preview & Gate Agent Curveballs + Mode 2 Geo-Deduction Trivia)  
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
* **Mode 1: *Carry-On Tetris* (Spatial Inventory Puzzler)**
  * A cozy, tactile grid-packing puzzle where players fit awkward travel items into a carry-on suitcase while obeying TSA screening, weight balance, and physical packing constraints.
* **Mode 2: *Where Are We Flying?* (Geo-Deduction Trivia)**
  * A digital boarding-pass deduction game where players act as a Gate Agent routing flights based on flight duration, destination weather, and passenger manifest clues.
