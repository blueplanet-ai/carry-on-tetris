// Mode 1: Carry-On Tetris — pack every item into the suitcase under TSA and weight rules.
import { $, starString, popcount, rotateMatrix, toast, todayKey } from "../util.js";
import { save, persist } from "../save.js";
import { fx } from "../audio.js";
import { addMiles, spendMiles } from "../economy.js";
import { app } from "../state.js";
import { syncBoardingHeader, switchMode } from "../shell.js";
import { RULE_META, LEVELS, dailyConfig, generateBag } from "../generator.js";
import { computeBalance, placementBase, validatePlacement } from "../packing.js";
import { TRIVIA_ROUNDS } from "../data/trivia-rounds.js";
import { loadTriviaRound } from "./trivia.js";

const HINT_COST = 150;
const STAR_REWARDS = { 1: 300, 2: 200, 4: 500 };

let currentLevelIdx = 0;
let levelCfg = null;
let generated = null;
let gridState = [];
let itemsState = [];
let selectedItemId = null;
let curveballPrompted = false;
let curveballAccepted = false;
let curveballDeclined = false;
let levelWon = false;
let undoStack = [];
let hintedIds = new Set(); // items whose hint was already paid for on this bag
let lastPlacedId = null;
let packMoves = 0;

// Input state (touch: tap-to-preview, tap-again-to-place)
let lastPointerType = window.matchMedia && matchMedia("(pointer: coarse)").matches ? "touch" : "mouse";
let pendingTap = null;
let touchMoved = false;
let touchStartKey = null;
let lastHover = null;
let kbCursor = { r: 0, c: 0 }; // keyboard cursor on the suitcase grid (roving tabindex)
const isTouchInput = () => lastPointerType === "touch" || lastPointerType === "pen";

const getItem = (id) => itemsState.find(i => i.id === id);
const cloneItem = (it) => ({ ...it, shape: it.shape.map(r => [...r]), solCells: it.solCells.map(c => [...c]), packed: false });
export const isLevelUnlocked = (i) => i === 0 || ((save.bagStars[LEVELS[i - 1].id] || 0) & 1) === 1;

export function loadLevel(idx) {
  const daily = idx === "daily";
  const custom = idx === "custom";
  if (daily) {
    levelCfg = dailyConfig();
    app.itinerary = null;
  } else if (custom && app.customBagCfg) {
    levelCfg = app.customBagCfg;
    app.itinerary = null;
  } else {
    const nIdx = typeof idx === "number" ? idx : 0;
    levelCfg = LEVELS[nIdx];
    currentLevelIdx = nIdx;
    save.tetrisLevel = nIdx;
    persist();
    if (app.itinerary && app.itinerary.levelIdx !== nIdx) app.itinerary = null;
  }
  generated = generateBag(levelCfg);

  curveballPrompted = false;
  curveballAccepted = false;
  curveballDeclined = false;
  levelWon = false;
  undoStack = [];
  hintedIds = new Set();
  lastPlacedId = null;
  packMoves = 0;

  gridState = Array.from({ length: levelCfg.rows }, () => Array(levelCfg.cols).fill(null));
  levelCfg.blocked.forEach(([r, c]) => { gridState[r][c] = "BLOCKED"; });
  itemsState = generated.items.map(cloneItem);
  selectedItemId = itemsState[0].id;

  $("winBanner").classList.remove("show");
  $("suitcaseBody").classList.remove("zipped");
  updateCurveballBanner();
  syncBoardingHeader();
  renderLevelStrip();

  const first = itemsState[0];
  const intro = levelCfg.isDaily ? "📅 Daily Bag! " : levelCfg.isCustom ? "🛠️ Custom Bag! " : "";
  setStatus(`${intro}Fill every slot for ⭐⭐⭐. Selected ${first.emoji} ${first.name}: ${first.desc}`, "normal");
  renderAll();
}

function snapshot() {
  undoStack.push({
    grid: gridState.map(r => [...r]),
    items: itemsState.map(i => ({ ...i, shape: i.shape.map(r => [...r]) })),
    selectedItemId, curveballPrompted, curveballAccepted, curveballDeclined
  });
  if (undoStack.length > 80) undoStack.shift();
}

export function undo() {
  const s = undoStack.pop();
  if (!s) { setStatus("Nothing to undo yet.", "error"); fx.error(); return; }
  gridState = s.grid;
  itemsState = s.items;
  selectedItemId = s.selectedItemId;
  curveballPrompted = s.curveballPrompted;
  curveballAccepted = s.curveballAccepted;
  curveballDeclined = s.curveballDeclined;
  levelWon = false;
  packMoves++; // undos count toward the daily move score
  $("winBanner").classList.remove("show");
  $("suitcaseBody").classList.remove("zipped");
  updateCurveballBanner();
  setStatus("↩️ Undid last move.", "normal");
  fx.tap();
  renderAll();
  checkWin(true); // re-show the win banner if the bag is still complete, without replaying the fanfare
}

function unpackFromGrid(id) {
  for (let r = 0; r < gridState.length; r++) {
    for (let c = 0; c < gridState[0].length; c++) {
      if (gridState[r][c] === id) gridState[r][c] = null;
    }
  }
  const item = getItem(id);
  if (item) item.packed = false;
  if (levelWon) {
    levelWon = false;
    $("winBanner").classList.remove("show");
    $("suitcaseBody").classList.remove("zipped");
  }
}

export function rotateSelected() {
  const item = getItem(selectedItemId);
  if (!item || item.packed) {
    setStatus("Tap an unpacked item first to rotate it!", "error");
    fx.error();
    return;
  }
  snapshot();
  item.shape = rotateMatrix(item.shape);
  fx.tap();
  renderAll();
  if (lastPointerType === "mouse" && lastHover) showGhostPreview(lastHover.r, lastHover.c);
}

function currentBalance() {
  const cells = [];
  for (let r = 0; r < levelCfg.rows; r++) {
    for (let c = 0; c < levelCfg.cols; c++) {
      const v = gridState[r][c];
      if (v && v !== "BLOCKED") cells.push({ r, c, rule: getItem(v).rule });
    }
  }
  return computeBalance(levelCfg.rows, levelCfg.cols, cells);
}

function countEmpty() {
  let n = 0;
  gridState.forEach(row => row.forEach(v => { if (v === null) n++; }));
  return n;
}

function renderBalance() {
  const bal = currentBalance();
  const markerEl = $("balanceMarker");
  const statusEl = $("balanceStatusText");
  const bodyEl = $("suitcaseBody");
  const vertEl = $("balanceVertical");

  $("bagWeightText").textContent = `${bal.total.toFixed(1)} lbs`;
  markerEl.style.left = `${50 + bal.shift}%`;
  statusEl.className = "balance-status";

  if (bal.abs <= 20) {
    statusEl.classList.add("good");
    statusEl.textContent = "Balanced ✅";
    markerEl.style.backgroundColor = "var(--valid)";
    bodyEl.style.transform = "rotate(0deg)";
  } else if (bal.abs <= 34) {
    statusEl.classList.add("warn");
    statusEl.textContent = bal.shift < 0 ? "Left-Heavy ⚠️" : "Right-Heavy ⚠️";
    markerEl.style.backgroundColor = "var(--accent)";
    bodyEl.style.transform = `rotate(${(bal.shift * 0.04).toFixed(2)}deg)`;
  } else {
    statusEl.classList.add("bad");
    statusEl.textContent = "Tipping Hazard! 🚨";
    markerEl.style.backgroundColor = "var(--invalid)";
    bodyEl.style.transform = `rotate(${(bal.shift * 0.07).toFixed(2)}deg)`;
  }

  vertEl.className = "balance-vertical";
  if (!bal.heavyCount) {
    vertEl.textContent = "⬇ No heavy items packed yet";
  } else if (bal.topHeavy) {
    vertEl.classList.add("warn");
    vertEl.textContent = "⬆ Top-heavy! Heavy items should ride low ⚠️";
  } else {
    vertEl.classList.add("good");
    vertEl.textContent = "⬇ Heavy items riding low ✅";
  }
  return bal;
}

/* Ghost preview */
function clearGhostPreview() {
  document.querySelectorAll("#suitcaseGrid .cell").forEach(cell => cell.classList.remove("preview-valid", "preview-invalid"));
}

function showGhostPreview(r, c) {
  clearGhostPreview();
  const item = getItem(selectedItemId);
  if (!item || item.packed) return null;
  if (gridState[r][c] !== null) return null;
  const [br, bc] = placementBase(item, r, c);
  const check = validatePlacement(item, br, bc, { grid: gridState, getItem });
  const cls = check.valid ? "preview-valid" : "preview-invalid";
  (check.previewCells || []).forEach(([pr, pc]) => {
    const el = document.querySelector(`#suitcaseGrid .cell[data-r="${pr}"][data-c="${pc}"]`);
    if (el) el.classList.add(cls);
  });
  return check;
}

/* Curveball */
function updateCurveballBanner() {
  const show = curveballPrompted && !curveballAccepted && !curveballDeclined && generated && generated.bonus;
  $("curveballBanner").classList.toggle("show", !!show);
}

function checkCurveballTrigger() {
  const unpacked = itemsState.filter(i => !i.packed).length;
  if (unpacked <= 1 && !curveballPrompted && !curveballAccepted && generated.bonus) {
    curveballPrompted = true;
    const cb = generated.bonus;
    $("curveballEmoji").textContent = cb.emoji;
    $("curveballTitle").textContent = `📢 Gate Agent Curveball: ${cb.name}!`;
    $("curveballDesc").textContent = `Overhead bins are full! Squeeze in this ${cb.name} (${cb.emoji}) to zip the bag 100% full for +500 Bonus Miles?`;
    updateCurveballBanner();
  }
}

export function acceptCurveball() {
  if (!generated.bonus || curveballAccepted) return;
  snapshot();
  curveballAccepted = true;
  const bonusItem = cloneItem(generated.bonus);
  itemsState.push(bonusItem);
  selectedItemId = bonusItem.id;
  levelWon = false;
  $("winBanner").classList.remove("show");
  $("suitcaseBody").classList.remove("zipped");
  updateCurveballBanner();
  setStatus(`Curveball accepted! Pack ${bonusItem.emoji} ${bonusItem.name} into the gaps — or "Leave at gate" if it won't fit.`, "normal");
  fx.tap();
  renderAll();
}

export function declineCurveball() {
  curveballDeclined = true;
  updateCurveballBanner();
  fx.tap();
  if (levelWon) checkWin(true);
}

function leaveBonus() {
  const bonus = getItem("bonus");
  if (!bonus) return;
  snapshot();
  unpackFromGrid("bonus");
  itemsState = itemsState.filter(i => i.id !== "bonus");
  curveballAccepted = false;
  curveballDeclined = true;
  const next = itemsState.find(i => !i.packed);
  selectedItemId = next ? next.id : null;
  setStatus(`🚪 Left the ${bonus.name} at the gate.`, "normal");
  fx.tap();
  renderAll();
  checkWin();
}

/* Input handling */
function handleCellClick(r, c) {
  const val = gridState[r][c];

  if (val === "BLOCKED") {
    setStatus("🚫 That's the suitcase frame — nothing fits there.", "error");
    fx.error();
    return;
  }

  if (val) {
    snapshot();
    const item = getItem(val);
    unpackFromGrid(val);
    selectedItemId = item.id;
    setStatus(`Unpacked ${item.emoji} ${item.name}. Tap to place elsewhere.`, "normal");
    fx.tap();
    renderAll();
    return;
  }

  const item = getItem(selectedItemId);
  if (!item || item.packed) {
    setStatus("Everything's packed! Tap an item in the bag to rearrange.", "normal");
    return;
  }

  const [br, bc] = placementBase(item, r, c);
  const check = validatePlacement(item, br, bc, { grid: gridState, getItem });

  // Touch: first tap previews, second tap on the same cell confirms
  if (isTouchInput() && !(pendingTap && pendingTap.r === r && pendingTap.c === c)) {
    showGhostPreview(r, c);
    pendingTap = { r, c };
    if (check.valid) setStatus(`👆 Tap the same spot again to place ${item.emoji} ${item.name}.`, "normal");
    else setStatus(`⚠️ ${check.reason}`, "error");
    fx.tap();
    return;
  }
  pendingTap = null;

  if (!check.valid) {
    setStatus(`⚠️ ${check.reason}`, "error");
    showGhostPreview(r, c);
    fx.error();
    const body = $("suitcaseBody");
    body.classList.remove("shake");
    void body.offsetWidth;
    body.classList.add("shake");
    return;
  }

  snapshot();
  check.cells.forEach(([pr, pc]) => { gridState[pr][pc] = item.id; });
  item.packed = true;
  packMoves++;
  lastPlacedId = item.id;
  fx.place();

  checkCurveballTrigger();

  const next = itemsState.find(i => !i.packed);
  if (next) {
    selectedItemId = next.id;
    setStatus(`✅ Packed! Next: ${next.emoji} ${next.name} — ${next.desc}`, "success");
    renderAll();
  } else {
    selectedItemId = null;
    renderAll();
    checkWin();
  }
}

export function initGridInput() {
  const gridEl = $("suitcaseGrid");
  const cellAt = (target) => target && target.closest ? target.closest("#suitcaseGrid .cell") : null;

  gridEl.addEventListener("pointerdown", (e) => { lastPointerType = e.pointerType || "mouse"; });

  gridEl.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const cell = cellAt(e.target);
    if (!cell) return;
    lastHover = { r: +cell.dataset.r, c: +cell.dataset.c };
    showGhostPreview(lastHover.r, lastHover.c);
  });

  // pointerleave also fires when a finger lifts, which would wipe the touch preview — only clear for a real mouse
  gridEl.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    lastHover = null;
    clearGhostPreview();
  });

  gridEl.addEventListener("touchstart", (e) => {
    touchMoved = false;
    const cell = cellAt(e.target);
    touchStartKey = cell ? `${cell.dataset.r},${cell.dataset.c}` : null;
  }, { passive: true });

  // Slide a finger across the bag to preview; lift and tap to confirm
  gridEl.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    const cell = cellAt(document.elementFromPoint(t.clientX, t.clientY));
    e.preventDefault();
    if (!cell) return;
    const r = +cell.dataset.r, c = +cell.dataset.c;
    if (`${r},${c}` !== touchStartKey) touchMoved = true;
    if (gridState[r][c] === null && touchMoved) {
      const check = showGhostPreview(r, c);
      pendingTap = { r, c };
      if (check) {
        if (check.valid) setStatus("👆 Lift, then tap the green spot to place.", "normal");
        else setStatus(`⚠️ ${check.reason}`, "error");
      }
    }
  }, { passive: false });

  // Keyboard: arrows move the cursor (with a ghost preview), Enter/Space places or unpacks
  const KEY_STEPS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  gridEl.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (KEY_STEPS[e.key]) {
      e.preventDefault();
      lastPointerType = "keyboard";
      const [dr, dc] = KEY_STEPS[e.key];
      moveKbCursor(kbCursor.r + dr, kbCursor.c + dc);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      lastPointerType = "keyboard";
      handleCellClick(kbCursor.r, kbCursor.c);
    }
  });

  gridEl.addEventListener("focusin", (e) => {
    const cell = cellAt(e.target);
    if (!cell) return;
    kbCursor = { r: +cell.dataset.r, c: +cell.dataset.c };
    if (cell.matches(":focus-visible")) showGhostPreview(kbCursor.r, kbCursor.c);
  });

  gridEl.addEventListener("click", (e) => {
    const cell = cellAt(e.target);
    if (!cell) return;
    if (isTouchInput() && touchMoved) { touchMoved = false; return; }
    handleCellClick(+cell.dataset.r, +cell.dataset.c);
  });
}

function cellEl(r, c) {
  return document.querySelector(`#suitcaseGrid .cell[data-r="${r}"][data-c="${c}"]`);
}

function moveKbCursor(r, c) {
  r = Math.max(0, Math.min(levelCfg.rows - 1, r));
  c = Math.max(0, Math.min(levelCfg.cols - 1, c));
  const prev = cellEl(kbCursor.r, kbCursor.c);
  if (prev) prev.tabIndex = -1;
  kbCursor = { r, c };
  const el = cellEl(r, c);
  el.tabIndex = 0;
  el.focus();
  showGhostPreview(r, c);
}

function selectItem(id) {
  const item = getItem(id);
  if (!item) return;
  if (item.packed) {
    snapshot();
    unpackFromGrid(id);
  }
  selectedItemId = id;
  setStatus(`${item.emoji} ${item.name}: ${item.desc}`, "normal");
  fx.tap();
  renderAll();
}

export function useHint() {
  const item = getItem(selectedItemId);
  if (!item || item.packed) {
    setStatus("Select an unpacked item first, then tap Hint.", "error");
    fx.error();
    return;
  }
  if (!hintedIds.has(item.id)) {
    if (!spendMiles(HINT_COST)) {
      setStatus(`You need ${HINT_COST} MI for a hint. Earn more in Trivia or Boarding!`, "error");
      fx.error();
      return;
    }
    hintedIds.add(item.id);
    fx.coin();
  }
  const blocked = item.solCells.some(([r, c]) => gridState[r][c] !== null);
  setStatus(`💡 ${item.emoji} ${item.name} fits the glowing outline${blocked ? " — move what's in the way first" : ""}. Rotate to match!`, "normal");
  renderAll();
}

function setStatus(msg, type) {
  const banner = $("statusBanner");
  banner.className = "rule-banner";
  if (type === "error") banner.classList.add("error");
  if (type === "success") banner.classList.add("success");
  $("statusText").textContent = msg;
}

export function resetLevel() {
  if (!itemsState.some(i => i.packed)) { setStatus("The bag is already empty.", "normal"); return; }
  snapshot();
  itemsState.forEach(i => unpackFromGrid(i.id));
  if (curveballDeclined && !curveballAccepted) { curveballDeclined = false; curveballPrompted = false; }
  selectedItemId = itemsState[0].id;
  updateCurveballBanner();
  setStatus("🗑️ Unpacked everything (Undo to restore).", "normal");
  fx.tap();
  renderAll();
}

export function nextLevel() {
  if (levelCfg.isDaily || levelCfg.isCustom) { loadLevel(currentLevelIdx); return; }
  loadNextBagAfter(currentLevelIdx);
}

// The bag after level idx, or the daily bag once the last level is done
export function loadNextBagAfter(idx) {
  if (idx + 1 < LEVELS.length) loadLevel(idx + 1);
  else loadLevel("daily");
}

export const currentLevelIndex = () => currentLevelIdx;

export function packHeader() {
  if (!levelCfg) return null;
  return {
    title: levelCfg.route,
    subtitle: levelCfg.subtitle,
    badge: levelCfg.isDaily ? "📅 Daily" : levelCfg.isCustom ? "🛠️ Custom" : `Bag ${currentLevelIdx + 1}/${LEVELS.length}`
  };
}

function tripRoundIndex() {
  return levelCfg ? TRIVIA_ROUNDS.findIndex(r => r.origin === levelCfg.dest) : -1;
}

export function continueTrip() {
  const idx = tripRoundIndex();
  if (idx < 0) return;
  if (!levelCfg.isDaily && !levelCfg.isCustom) {
    const originCode = levelCfg.route.split(" ")[0];
    app.itinerary = {
      levelIdx: currentLevelIdx,
      bagId: levelCfg.id,
      origin: originCode,
      dest: levelCfg.dest,
      nextDest: TRIVIA_ROUNDS[idx].answer,
      step: 2
    };
  }
  switchMode("trivia");
  loadTriviaRound(idx);
  toast(`🛬 Landed in ${levelCfg.dest} — route your onward connection!`);
}

function checkWin(silent = false) {
  if (itemsState.some(i => !i.packed)) return;
  levelWon = true;

  const bal = renderBalance();
  const empty = countEmpty();
  let mask = 1;
  if (bal.isBalanced) mask |= 2;
  if (empty === 0) mask |= 4;

  const key = levelCfg.id;
  const prev = save.bagStars[key] || 0;
  const newBits = mask & ~prev;
  const earned = [1, 2, 4].reduce((sum, b) => sum + ((newBits & b) ? STAR_REWARDS[b] : 0), 0);
  save.bagStars[key] = prev | mask;

  if (levelCfg.isDaily) {
    const dKey = levelCfg.dateKey;
    const prevStat = save.dailyStats[dKey];
    const starsCount = popcount(mask);
    const balScore = Math.round(100 - bal.abs);
    if (
      !prevStat ||
      starsCount > prevStat.stars ||
      (starsCount === prevStat.stars && packMoves < prevStat.moves)
    ) {
      save.dailyStats[dKey] = { moves: packMoves, balancePct: balScore, stars: starsCount, mask };
    }
  }

  persist();
  if (earned) addMiles(earned);

  const curveballPending = curveballPrompted && !curveballAccepted && !curveballDeclined;
  $("winStars").innerHTML = [1, 2, 4].map(b => (mask & b) ? "★" : `<span class="dim">★</span>`).join("");
  $("winTitle").textContent = earned ? `✅ Carry-On Zipped! (+${earned} MI)` : "✅ Carry-On Zipped!";

  const crit = [`<li class="ok">⭐ Packed within TSA rules (${packMoves} moves)</li>`];
  crit.push(bal.isBalanced
    ? `<li class="ok">⭐ Balanced, heavy items riding low</li>`
    : `<li>☆ ${bal.topHeavy ? "Top-heavy — move heavy items down" : `Leaning ${bal.shift < 0 ? "left" : "right"} — rebalance`}</li>`);
  crit.push(empty === 0
    ? `<li class="ok">⭐ Zipped 100% full</li>`
    : `<li>☆ ${empty} empty slot${empty > 1 ? "s" : ""} — ${curveballPending ? "accept the curveball above!" : "Reset & take the curveball"}</li>`);
  if (!earned && prev) crit.push(`<li>Stars already banked — no repeat miles</li>`);
  $("winCriteria").innerHTML = crit.join("");

  const tripIdx = tripRoundIndex();
  const tripBtn = $("btnContinueTrip");
  tripBtn.style.display = tripIdx >= 0 ? "flex" : "none";
  if (tripIdx >= 0) tripBtn.textContent = `🛫 Connect at ${levelCfg.dest} ➔`;
  $("btnNextBag").textContent = levelCfg.isDaily || levelCfg.isCustom
    ? "Back to Bags ➔"
    : currentLevelIdx + 1 < LEVELS.length ? "Next Bag ➔" : "📅 Daily Bag ➔";

  $("winBanner").classList.add("show");
  const body = $("suitcaseBody");
  body.classList.remove("zipped");
  void body.offsetWidth;
  body.classList.add("zipped");

  setStatus(`🎉 ${starString(mask)} All items packed within TSA rules!`, "success");
  renderLevelStrip();
  updateCurveballBanner();
  syncBoardingHeader();
  if (!silent) fx.win();
}

/* Rendering */
export function renderLevelStrip() {
  const strip = $("levelStrip");
  strip.innerHTML = "";
  LEVELS.forEach((lv, i) => {
    const unlocked = isLevelUnlocked(i);
    const mask = save.bagStars[lv.id] || 0;
    const itinDone = save.itineraries && save.itineraries[lv.id];
    const chip = document.createElement("button");
    chip.id = `levelChip-${i}`;
    chip.className = "level-chip";
    if (!levelCfg.isDaily && !levelCfg.isCustom && i === currentLevelIdx) chip.classList.add("active");
    if (!unlocked) chip.classList.add("locked");
    chip.innerHTML = `<span>${unlocked ? (itinDone ? "🎫 " : "") : "🔒 "}${lv.dest}</span><span class="chip-stars">${starString(mask)}</span>`;
    chip.title = lv.route + (itinDone ? " • Full Itinerary Completed" : "");
    chip.onclick = () => {
      if (!unlocked) { setStatus(`🔒 Pack bag ${i} first to unlock ${lv.route}.`, "error"); fx.error(); return; }
      fx.tap();
      loadLevel(i);
    };
    strip.appendChild(chip);
  });

  const dailyMask = save.bagStars["daily-" + todayKey()] || 0;
  const daily = document.createElement("button");
  daily.id = "levelChip-daily";
  daily.className = "level-chip daily" + (levelCfg.isDaily ? " active" : "");
  daily.innerHTML = `<span>📅 Daily</span><span class="chip-stars">${starString(dailyMask)}</span>`;
  daily.onclick = () => { fx.tap(); loadLevel("daily"); };
  strip.appendChild(daily);

  if (app.customBagCfg) {
    const custMask = save.bagStars[app.customBagCfg.id] || 0;
    const cust = document.createElement("button");
    cust.id = "levelChip-custom";
    cust.className = "level-chip custom" + (levelCfg.isCustom ? " active" : "");
    cust.innerHTML = `<span>🛠️ ${app.customBagCfg.dest}</span><span class="chip-stars">${starString(custMask)}</span>`;
    cust.onclick = () => { fx.tap(); loadLevel("custom"); };
    strip.appendChild(cust);
  }

  const active = strip.querySelector(".active");
  if (active) strip.scrollTo({ left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
}

function renderAll() {
  const { rows, cols } = levelCfg;
  const gridEl = $("suitcaseGrid");
  pendingTap = null;
  const gridHadFocus = gridEl.contains(document.activeElement);
  kbCursor = { r: Math.min(kbCursor.r, rows - 1), c: Math.min(kbCursor.c, cols - 1) };
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridEl.style.aspectRatio = `${cols} / ${rows}`;
  gridEl.innerHTML = "";

  // One emoji per item, placed on the cell nearest its centroid
  const groups = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = gridState[r][c];
      if (v && v !== "BLOCKED") (groups[v] = groups[v] || []).push([r, c]);
    }
  }
  const anchors = new Set();
  Object.values(groups).forEach(cells => {
    const mr = cells.reduce((s, [r]) => s + r, 0) / cells.length;
    const mc = cells.reduce((s, [, c]) => s + c, 0) / cells.length;
    let best = cells[0], bestD = Infinity;
    cells.forEach(([r, c]) => { const d = (r - mr) ** 2 + (c - mc) ** 2; if (d < bestD) { bestD = d; best = [r, c]; } });
    anchors.add(best[0] + "," + best[1]);
  });

  const hintItem = hintedIds.has(selectedItemId) ? getItem(selectedItemId) : null;
  const hintSet = new Set(hintItem && !hintItem.packed ? hintItem.solCells.map(([r, c]) => r + "," + c) : []);
  const same = (r, c, v) => r >= 0 && r < rows && c >= 0 && c < cols && gridState[r][c] === v;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.setAttribute("role", "gridcell");
      cell.tabIndex = r === kbCursor.r && c === kbCursor.c ? 0 : -1;
      if (r === 0) cell.classList.add("top-row");

      const v = gridState[r][c];
      if (v === "BLOCKED") {
        cell.classList.add("blocked");
        cell.setAttribute("aria-label", "Blocked");
      } else if (v) {
        const item = getItem(v);
        cell.classList.add("filled");
        cell.style.backgroundColor = item.color;
        if (same(r, c + 1, v)) cell.classList.add("join-r");
        if (same(r + 1, c, v)) cell.classList.add("join-d");
        if (same(r, c - 1, v)) cell.classList.add("join-l");
        if (same(r - 1, c, v)) cell.classList.add("join-u");
        if (same(r, c + 1, v) && same(r + 1, c, v) && same(r + 1, c + 1, v)) cell.classList.add("join-rd");
        if (anchors.has(r + "," + c)) {
          const em = document.createElement("span");
          em.className = "cell-emoji";
          em.textContent = item.emoji;
          cell.appendChild(em);
          const tagText = item.isBonus ? "⭐" : RULE_META[item.rule].tag;
          if (tagText) {
            const tag = document.createElement("span");
            tag.className = "cell-tag";
            tag.textContent = tagText;
            cell.appendChild(tag);
          }
        }
        if (v === lastPlacedId) cell.classList.add("drop-in");
        cell.setAttribute("aria-label", item.name);
      } else {
        cell.setAttribute("aria-label", `Empty slot row ${r + 1} column ${c + 1}`);
      }
      if (hintSet.has(r + "," + c)) cell.classList.add("hint");
      gridEl.appendChild(cell);
    }
  }
  lastPlacedId = null;
  if (gridHadFocus) {
    cellEl(kbCursor.r, kbCursor.c).focus({ preventScroll: true });
    if (lastPointerType === "keyboard") showGhostPreview(kbCursor.r, kbCursor.c);
  }

  renderBalance();
  renderTray();

  const sel = getItem(selectedItemId);
  $("btnUndo").disabled = undoStack.length === 0;
  $("btnRotate").disabled = !sel || sel.packed;
  $("btnHint").disabled = !sel || sel.packed;
  $("btnHint").textContent = sel && hintedIds.has(sel.id) ? "💡 Shown" : `💡 ${HINT_COST}`;
  $("trayHint").textContent = isTouchInput() ? "Tap to preview • tap again to place" : "Tap packed item in bag to remove";
}

function renderTray() {
  const trayEl = $("itemTray");
  const focusedId = trayEl.contains(document.activeElement) ? document.activeElement.id : null;
  trayEl.innerHTML = "";
  const packedCount = itemsState.filter(i => i.packed).length;
  $("packedCount").textContent = `${packedCount}/${itemsState.length}`;

  itemsState.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.id = `itemCard-${item.id}`;
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    card.setAttribute("aria-label", `${item.name}, ${item.ruleLabel}${item.packed ? ", packed" : ""}`);
    if (item.id === selectedItemId) card.classList.add("selected");
    if (item.packed) card.classList.add("packed");
    if (item.isBonus) card.classList.add("bonus-card");

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = `${item.emoji} ${item.name}`;

    const miniGrid = document.createElement("div");
    miniGrid.className = "mini-grid";
    miniGrid.style.gridTemplateColumns = `repeat(${item.shape[0].length}, 10px)`;
    item.shape.forEach(row => row.forEach(v => {
      const mc = document.createElement("div");
      mc.className = "mini-cell";
      mc.style.backgroundColor = v ? item.color : "transparent";
      miniGrid.appendChild(mc);
    }));

    card.appendChild(title);
    card.appendChild(miniGrid);

    if (item.isBonus && !item.packed) {
      const leave = document.createElement("button");
      leave.className = "leave-btn";
      leave.id = "btnLeaveBonus";
      leave.textContent = "🚪 Leave at gate";
      leave.onclick = (e) => { e.stopPropagation(); leaveBonus(); };
      card.appendChild(leave);
    } else {
      const pill = document.createElement("div");
      pill.className = "rule-pill";
      pill.textContent = item.packed ? "✓ Packed" : item.ruleLabel;
      card.appendChild(pill);
    }

    card.addEventListener("click", () => selectItem(item.id));
    card.addEventListener("keydown", (e) => {
      if (e.target === card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectItem(item.id); }
    });
    trayEl.appendChild(card);
  });
  if (focusedId && $(focusedId)) $(focusedId).focus({ preventScroll: true });
}
