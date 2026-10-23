// Mode 3: Boarding Group Shuffle — line the boarding groups up toward the jet bridge.
// Free play is a 3×3 cabin (Groups 1–8); connected trips from the 4th bag on board a 4×4 cabin (Groups 1–15).
import { $, todayKey } from "../util.js";
import { save, persist } from "../save.js";
import { fx } from "../audio.js";
import { addMiles } from "../economy.js";
import { app } from "../state.js";
import { syncBoardingHeader, switchMode } from "../shell.js";
import { isSolved, scramble, slideLine, solve } from "../boarding-logic.js";
import { LEVELS } from "../generator.js";
import { loadNextBagAfter, currentLevelIndex, renderLevelStrip } from "./pack.js";
import { paxArt } from "../art.js";

// Per cabin size: scramble walk length, par slack over the shortest solution, and miles (under / over par).
// 4×4 scrambles stay short so the exact solver finishes in milliseconds on a phone.
const CABINS = {
  3: { scramble: 80, slack: 6, reward: [400, 200] },
  4: { scramble: 30, slack: 8, reward: [600, 300] }
};
export const BIG_CABIN_FROM_LEVEL = 3; // trip legs starting at this bag index (LHR ✈ RAK onward) use the 4×4 cabin
const SOLVER_NODE_BUDGET = 200000;
// Group labels; each passenger's drawing (and what they carry) is in art.js
const PAX = [null, "Pre-board", "First", "Business", "Elite", "Families", "Main", "Main", "Basic",
  "Comfort+", "Corporate", "Kids", "Pets", "Students", "Standby", "Last Call"];

let cabin = 3;
let shuffleTiles = [];
let shufflePar = 0;
let shuffleMoves = 0;
let shuffleDone = false;

const shuffleRewardAvailable = () => save.shuffleRewardDay !== todayKey();
const lastGroup = () => cabin * cabin - 1;

function cabinForNextLineUp() {
  const itin = app.itinerary;
  return itin && itin.step === 3 && itin.levelIdx >= BIG_CABIN_FROM_LEVEL ? 4 : 3;
}

export function boardingHeader() {
  const itin = app.itinerary;
  const connecting = itin && itin.step >= 3;
  return connecting ? {
    title: `${itin.dest} ✈ ${itin.nextDest || "JET"}`,
    subtitle: cabin === 4 ? "Wide-body 4×4" : "Connecting gate",
    detail: "Complete the leg for +300 MI",
    badgeLabel: "Line-up",
    badge: `#${save.shuffleSolved + 1}`
  } : {
    title: "B14 ✈ 1L",
    fromCity: "Gate",
    toCity: "Aircraft door",
    subtitle: "Boarding group shuffle",
    detail: `Groups 1 to ${lastGroup()}`,
    badgeLabel: "Line-up",
    badge: `#${save.shuffleSolved + 1}`
  };
}

function setShuffleStatus(msg, type) {
  const banner = $("shuffleStatusBanner");
  banner.className = "rule-banner" + (type ? ` ${type}` : "");
  $("shuffleStatusText").textContent = msg;
}

export function newShuffle() {
  cabin = cabinForNextLineUp();
  const { scramble: steps, slack } = CABINS[cabin];
  shuffleTiles = scramble(steps, Math.random, cabin);
  // The scramble walk played backwards is a solution, so it bounds par if the solver gives up
  const shortest = solve(shuffleTiles, SOLVER_NODE_BUDGET);
  shufflePar = (shortest ? shortest.length : steps) + slack;
  shuffleMoves = 0;
  shuffleDone = false;
  $("shuffleWinBanner").classList.remove("show");
  setShuffleStatus(cabin === 4
    ? `Wide-body boarding! Line up groups 1 to ${lastGroup()} — tap a passenger in line with the gap.`
    : `Tap a passenger next to the gap to step them forward. Line up groups 1 to ${lastGroup()}, ending at the jet bridge.`);
  buildShuffleBoard();
  syncBoardingHeader();
}

function buildShuffleBoard() {
  const board = $("shuffleBoard");
  board.style.setProperty("--n", cabin);
  board.classList.toggle("wide", cabin === 4);
  board.innerHTML = `<div class="jet-door"><svg class="door-art" viewBox="0 0 60 56" aria-hidden="true"><path class="bridge" d="M2 55L18 47M58 55L42 47M18 50h24"/><rect class="door" x="18" y="4" width="24" height="44" rx="9"/><circle class="bridge" cx="30" cy="17" r="5"/><path class="bridge" d="M36 30v6"/></svg>Jet bridge</div>`;
  for (let v = 1; v <= lastGroup(); v++) {
    const b = document.createElement("button");
    b.className = "pax-tile";
    b.id = `pax-${v}`;
    b.setAttribute("aria-label", `Group ${v} ${PAX[v]}`);
    b.innerHTML = `<span class="pax-group">Group ${v}</span>${paxArt(v)}<span class="pax-label">${PAX[v]}</span>`;
    b.onclick = () => tapPax(v);
    board.appendChild(b);
  }
  positionTiles();
}

function positionTiles() {
  shuffleTiles.forEach((v, idx) => {
    if (!v) return;
    const el = $(`pax-${v}`);
    const r = Math.floor(idx / cabin), c = idx % cabin;
    el.style.left = `calc(${c} * (100% / ${cabin}) + 3px)`;
    el.style.top = `calc(${r} * (100% / ${cabin}) + 3px)`;
    el.classList.toggle("in-place", v === idx + 1);
  });
  $("shuffleMovesText").textContent = `MOVES: ${shuffleMoves}`;
  const [underPar, overPar] = CABINS[cabin].reward;
  $("shuffleParText").textContent = !shuffleRewardAvailable()
    ? `PAR: ${shufflePar} • PRACTICE`
    : shuffleMoves <= shufflePar ? `PAR: ${shufflePar} → +${underPar} MI` : `OVER PAR → +${overPar} MI`;
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
    const [underPar, overPar] = CABINS[cabin].reward;
    let earned = !dailyPaid ? 0 : shuffleMoves <= shufflePar ? underPar : overPar;
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
      nextBagBtn.textContent = nextIdx < LEVELS.length ? `Pack ${LEVELS[nextIdx].dest} Bag` : "Daily Bag";
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
      ? `All groups lined up in ${shuffleMoves} moves! +${earned} miles${itinBonus ? " (incl. +300 MI itinerary bonus!)" : ""}.${practiceNote}`
      : `All groups lined up in ${shuffleMoves} moves!${practiceNote}`, "success");
    $("shuffleWinTitle").textContent = earned ? `Boarding complete! +${earned} MI` : "Boarding complete!";
    $("shuffleWinSub").textContent = shuffleMoves <= shufflePar ? `Under par (${shufflePar}) — on-time departure!` : `${shuffleMoves} moves — a little delayed, but boarded.`;
    $("shuffleWinBanner").classList.add("show");
  } else {
    setShuffleStatus(`Keep going — ${shuffleTiles.filter((t, i) => t === i + 1).length}/${lastGroup()} passengers in place.`);
  }
}

export function completeItineraryAndNextBag() {
  const fromIdx = app.itinerary ? app.itinerary.levelIdx : currentLevelIndex();
  app.itinerary = null;
  switchMode("tetris");
  loadNextBagAfter(fromIdx);
}
