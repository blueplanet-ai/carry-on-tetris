// Mode 3: Boarding Group Shuffle — line passengers up Groups 1–8 toward the jet bridge.
import { $, todayKey } from "../util.js";
import { save, persist } from "../save.js";
import { fx } from "../audio.js";
import { addMiles } from "../economy.js";
import { app } from "../state.js";
import { syncBoardingHeader, switchMode } from "../shell.js";
import { SHUFFLE_N, isSolved, scramble, slideLine, shortestSolution } from "../boarding-logic.js";
import { LEVELS } from "../generator.js";
import { loadNextBagAfter, currentLevelIndex, renderLevelStrip } from "./pack.js";

const SHUFFLE_SCRAMBLE = 80;   // random-walk length used to scramble the line
const SHUFFLE_PAR_SLACK = 6;   // par = shortest possible solution + this many moves
const PAX = [
  null,
  { e: "♿", c: "#38bdf8", l: "Pre-board" },
  { e: "👑", c: "#fbbf24", l: "First" },
  { e: "🥂", c: "#f472b6", l: "Business" },
  { e: "💳", c: "#a78bfa", l: "Elite" },
  { e: "👨‍👩‍👧", c: "#34d399", l: "Families" },
  { e: "🧳", c: "#fb923c", l: "Main" },
  { e: "🎒", c: "#60a5fa", l: "Main" },
  { e: "🏃", c: "#f87171", l: "Basic" }
];

let shuffleTiles = [];
let shufflePar = 0;
let shuffleMoves = 0;
let shuffleDone = false;

const shuffleRewardAvailable = () => save.shuffleRewardDay !== todayKey();

export function boardingHeader() {
  const itin = app.itinerary;
  const connecting = itin && itin.step >= 3;
  return {
    title: connecting ? `${itin.dest} ✈ ${itin.nextDest || "JET"}` : "GATE ➔ JET",
    subtitle: connecting ? "Connecting Gate Boarding • Complete leg for +300 MI Bonus!" : "Boarding Group Shuffle • Line up Groups 1–8",
    badge: `Line-Up #${save.shuffleSolved + 1}`
  };
}

function setShuffleStatus(msg, type) {
  const banner = $("shuffleStatusBanner");
  banner.className = "rule-banner" + (type ? ` ${type}` : "");
  $("shuffleStatusText").textContent = msg;
}

export function newShuffle() {
  shuffleTiles = scramble(SHUFFLE_SCRAMBLE);
  shufflePar = shortestSolution(shuffleTiles) + SHUFFLE_PAR_SLACK;
  shuffleMoves = 0;
  shuffleDone = false;
  $("shuffleWinBanner").classList.remove("show");
  setShuffleStatus("🚶 Tap a passenger next to the gap to step them forward. Line up Groups 1–8!");
  buildShuffleBoard();
  syncBoardingHeader();
}

function buildShuffleBoard() {
  const board = $("shuffleBoard");
  board.innerHTML = `<div class="jet-door"><span>🚪</span>JET BRIDGE</div>`;
  for (let v = 1; v < SHUFFLE_N * SHUFFLE_N; v++) {
    const b = document.createElement("button");
    b.className = "pax-tile";
    b.id = `pax-${v}`;
    b.style.setProperty("--pax", PAX[v].c);
    b.setAttribute("aria-label", `Group ${v} ${PAX[v].l}`);
    b.innerHTML = `<span class="pax-emoji">${PAX[v].e}</span><span class="pax-group">Group ${v}</span><span class="pax-label">${PAX[v].l}</span>`;
    b.onclick = () => tapPax(v);
    board.appendChild(b);
  }
  positionTiles();
}

function positionTiles() {
  shuffleTiles.forEach((v, idx) => {
    if (!v) return;
    const el = $(`pax-${v}`);
    const r = Math.floor(idx / SHUFFLE_N), c = idx % SHUFFLE_N;
    el.style.left = `calc(${c} * (100% / ${SHUFFLE_N}) + 3px)`;
    el.style.top = `calc(${r} * (100% / ${SHUFFLE_N}) + 3px)`;
    el.classList.toggle("in-place", v === idx + 1);
  });
  $("shuffleMovesText").textContent = `MOVES: ${shuffleMoves}`;
  $("shuffleParText").textContent = !shuffleRewardAvailable()
    ? `PAR: ${shufflePar} • PRACTICE`
    : shuffleMoves <= shufflePar ? `PAR: ${shufflePar} → +400 MI` : `OVER PAR → +200 MI`;
}

function tapPax(v) {
  if (shuffleDone) return;
  const slid = slideLine(shuffleTiles, v);
  if (!slid) {
    setShuffleStatus("Only passengers in line with the open spot can shuffle over.", "error");
    fx.error();
    return;
  }
  shuffleTiles = slid.tiles;
  shuffleMoves += slid.moves;
  fx.tap();
  positionTiles();

  if (isSolved(shuffleTiles)) {
    shuffleDone = true;
    const dailyPaid = shuffleRewardAvailable();
    let earned = !dailyPaid ? 0 : shuffleMoves <= shufflePar ? 400 : 200;
    if (dailyPaid) save.shuffleRewardDay = todayKey();
    let itinBonus = 0;
    const itin = app.itinerary;
    const nextBagBtn = $("btnNextItineraryBag");
    if (itin && itin.step === 3) {
      itin.step = 4;
      if (!save.itineraries[itin.bagId]) {
        save.itineraries[itin.bagId] = true;
        itinBonus = 300;
        earned += itinBonus;
      }
      nextBagBtn.style.display = "inline-flex";
      const nextIdx = itin.levelIdx + 1;
      nextBagBtn.textContent = nextIdx < LEVELS.length ? `🧳 Pack ${LEVELS[nextIdx].dest} Bag ➔` : "📅 Daily Bag ➔";
    } else {
      nextBagBtn.style.display = "none";
    }
    save.shuffleSolved++;
    persist();
    addMiles(earned);
    syncBoardingHeader();
    renderLevelStrip();
    fx.win();
    const practiceNote = dailyPaid ? "" : " Today's boarding miles are already banked — back tomorrow for more!";
    setShuffleStatus(earned
      ? `✅ All groups lined up in ${shuffleMoves} moves! +${earned} Miles${itinBonus ? " (incl. +300 MI Itinerary Bonus!)" : ""}.${practiceNote}`
      : `✅ All groups lined up in ${shuffleMoves} moves!${practiceNote}`, "success");
    $("shuffleWinTitle").textContent = earned ? `✅ Boarding Complete! (+${earned} MI)` : "✅ Boarding Complete!";
    $("shuffleWinSub").textContent = shuffleMoves <= shufflePar ? `Under par (${shufflePar}) — on-time departure!` : `${shuffleMoves} moves — a little delayed, but boarded.`;
    $("shuffleWinBanner").classList.add("show");
  } else {
    setShuffleStatus(`🚶 Keep going — ${shuffleTiles.filter((t, i) => t === i + 1).length}/8 passengers in place.`);
  }
}

export function completeItineraryAndNextBag() {
  const fromIdx = app.itinerary ? app.itinerary.levelIdx : currentLevelIndex();
  app.itinerary = null;
  switchMode("tetris");
  loadNextBagAfter(fromIdx);
}
