// Mode 2: Where Are We Flying? — deduce the destination from heading, flight time and clues.
import { $, toast } from "../util.js";
import { save, persist } from "../save.js";
import { fx } from "../audio.js";
import { addMiles, spendMiles } from "../economy.js";
import { app } from "../state.js";
import { syncBoardingHeader, switchMode } from "../shell.js";
import { TRIVIA_ROUNDS } from "../data/trivia-rounds.js";
import { LEVELS } from "../generator.js";
import { isRoundUnlocked } from "../progress.js";
import { newShuffle } from "./boarding.js";

const TRIVIA_START_POT = 500;
const WRONG_PENALTY = 150;
const FIFTY_COST = 100;

let currentTriviaIdx = 0;
let currentTriviaPot = TRIVIA_START_POT;
let triviaRoundOver = false;
let triviaPractice = false;
let fiftyUsed = false;

const unlocked = (idx) => isRoundUnlocked(TRIVIA_ROUNDS[idx], save);
const unlockHint = (round) => {
  const bag = LEVELS.find(lv => lv.id === round.unlockBag);
  return bag ? `Pack the ${bag.route} bag to unlock this flight.` : "";
};

export function triviaHeader() {
  const round = TRIVIA_ROUNDS[currentTriviaIdx];
  const solved = Object.keys(save.triviaSolved).length;
  const open = TRIVIA_ROUNDS.filter((r, i) => unlocked(i)).length;
  return {
    title: `${round.origin} ✈ ${triviaRoundOver ? round.answer : "???"}`,
    subtitle: `Where Are We Flying? • Routed ${solved}/${TRIVIA_ROUNDS.length}` + (open < TRIVIA_ROUNDS.length ? ` • ${TRIVIA_ROUNDS.length - open} locked` : ""),
    badge: `Flight ${currentTriviaIdx + 1}/${TRIVIA_ROUNDS.length}`
  };
}

function compass(deg) {
  const pts = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return pts[Math.round(deg / 22.5) % 16];
}

function drawRadar(round) {
  const ox = 140, oy = 70;
  const scale = Math.min(1, 0.35 + round.hours / 8);
  const rad = (round.hdg * Math.PI) / 180;
  const dx = ox + Math.sin(rad) * 115 * scale;
  const dy = oy - Math.cos(rad) * 58 * scale;

  // Great-circle-ish bow: offset the midpoint perpendicular to the route, bending "up"
  const mx = (ox + dx) / 2, my = (oy + dy) / 2;
  let px = -(dy - oy), py = dx - ox;
  const len = Math.hypot(px, py) || 1;
  px /= len; py /= len;
  if (py > 0) { px = -px; py = -py; }
  const bend = Math.hypot(dx - ox, dy - oy) * 0.22;
  const cx = mx + px * bend, cy = my + py * bend;

  $("radarRoute").setAttribute("d", `M ${ox} ${oy} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}`);
  $("radarDestDot").setAttribute("cx", dx.toFixed(1));
  $("radarDestDot").setAttribute("cy", dy.toFixed(1));
  const destText = $("radarDestText");
  destText.setAttribute("x", Math.max(4, Math.min(250, dx - 12)).toFixed(1));
  destText.setAttribute("y", Math.max(12, Math.min(136, dy < oy ? dy - 10 : dy + 18)).toFixed(1));
  const originText = $("radarOriginText");
  originText.setAttribute("y", round.hdg > 90 && round.hdg < 270 ? 60 : 88);

  $("radarPlaneLayer").innerHTML = `
    <g>
      <path d="M -8 -4.5 L 9 0 L -8 4.5 L -4.5 0 Z" fill="#f8fafc" />
      <animateMotion dur="3.4s" repeatCount="indefinite" rotate="auto"><mpath href="#radarRoute" /></animateMotion>
    </g>`;
}

function setTriviaStatus(msg, type) {
  const banner = $("triviaStatusBanner");
  banner.className = "rule-banner" + (type ? ` ${type}` : "");
  $("triviaStatusText").textContent = msg;
}

function updatePot() {
  $("telemetryPot").textContent = triviaPractice ? "PRACTICE • NO MILES" : `REWARD POOL: +${currentTriviaPot} MI`;
}

// One chip per flight: routed ✓, open, or 🔒 until its bag is packed
export function renderFlightStrip() {
  const strip = $("flightStrip");
  strip.innerHTML = "";
  TRIVIA_ROUNDS.forEach((round, i) => {
    const open = unlocked(i);
    const solved = !!save.triviaSolved[round.id];
    const chip = document.createElement("button");
    chip.id = `flightChip-${round.id}`;
    chip.className = "level-chip" + (i === currentTriviaIdx ? " active" : "") + (open ? "" : " locked") + (solved ? " solved" : "");
    chip.innerHTML = `<span>${open ? "" : "🔒 "}${round.origin}</span><span class="chip-stars">${solved ? `✓ ${round.answer}` : "???"}</span>`;
    chip.title = open ? `${round.origin} ✈ ${solved ? round.answer : "???"}` : unlockHint(round);
    chip.onclick = () => {
      if (!open) { setTriviaStatus(`🔒 ${unlockHint(round)}`, "error"); fx.error(); return; }
      fx.tap();
      loadTriviaRound(i);
    };
    strip.appendChild(chip);
  });
  const active = strip.querySelector(".active");
  if (active) strip.scrollTo({ left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
}

export function loadTriviaRound(idx) {
  // A locked flight (e.g. a stale saved index) falls back to the first open one
  if (!unlocked(idx)) idx = TRIVIA_ROUNDS.findIndex((r, i) => unlocked(i));
  currentTriviaIdx = idx;
  save.triviaIdx = idx;
  persist();
  const round = TRIVIA_ROUNDS[idx];
  triviaPractice = !!save.triviaSolved[round.id];
  currentTriviaPot = triviaPractice ? 0 : TRIVIA_START_POT;
  triviaRoundOver = false;
  fiftyUsed = false;

  syncBoardingHeader();
  renderFlightStrip();
  drawRadar(round);
  $("radarOriginText").textContent = round.origin;
  $("radarDestText").textContent = "???";
  $("telemetryHeading").textContent = `HDG ${String(round.hdg).padStart(3, "0")}° ${compass(round.hdg)} • ${round.dur}`;
  updatePot();
  $("clue1Text").textContent = round.clue1;

  [2, 3].forEach(n => {
    $(`clue${n}Box`).classList.remove("revealed");
    const t = $(`clue${n}Text`);
    t.textContent = n === 2 ? "Locked — Reveal passenger gear & local weather" : "Locked — Reveal destination signature clue";
    t.style.color = "var(--text-muted)";
    $(`btnClue${n}`).style.display = "inline-flex";
  });

  setTriviaStatus(triviaPractice
    ? "🔁 Already routed — practice round (no miles). Where are we flying?"
    : "🌍 Where are we flying? Select the destination airport:");
  $("btnFifty").style.display = "inline-flex";
  $("btnFifty").disabled = false;
  $("triviaWinBanner").classList.remove("show");

  const opts = [...round.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  const grid = $("destinationsGrid");
  grid.innerHTML = "";
  opts.forEach(([iata, city]) => {
    const btn = document.createElement("button");
    btn.className = "dest-btn";
    btn.id = `dest-${iata}`;
    btn.dataset.iata = iata;
    btn.innerHTML = `<span class="dest-iata">🛫 ${iata}</span><span class="dest-city">${city}</span>`;
    btn.addEventListener("click", () => handleTriviaGuess(iata, city, btn));
    grid.appendChild(btn);
  });
}

export function unlockClue(num) {
  if (triviaRoundOver) return;
  const round = TRIVIA_ROUNDS[currentTriviaIdx];
  const cost = num === 2 ? 100 : 200;
  currentTriviaPot = Math.max(0, currentTriviaPot - cost);
  $(`clue${num}Box`).classList.add("revealed");
  const t = $(`clue${num}Text`);
  t.textContent = num === 2 ? round.clue2 : round.clue3;
  t.style.color = "var(--text-main)";
  $(`btnClue${num}`).style.display = "none";
  updatePot();
  fx.tap();
}

export function fiftyFifty() {
  if (triviaRoundOver || fiftyUsed) return;
  const round = TRIVIA_ROUNDS[currentTriviaIdx];
  const candidates = [...document.querySelectorAll("#destinationsGrid .dest-btn")]
    .filter(b => !b.disabled && b.dataset.iata !== round.answer);
  if (!candidates.length) return;
  if (!spendMiles(FIFTY_COST)) {
    setTriviaStatus(`You need ${FIFTY_COST} MI for a 50/50.`, "error");
    fx.error();
    return;
  }
  fiftyUsed = true;
  const btn = candidates[Math.floor(Math.random() * candidates.length)];
  btn.disabled = true;
  btn.classList.add("eliminated");
  $("btnFifty").disabled = true;
  setTriviaStatus(`✂️ Not ${btn.dataset.iata}! One fewer option.`);
  fx.coin();
}

function handleTriviaGuess(iata, city, btnEl) {
  if (triviaRoundOver || btnEl.disabled) return;
  const round = TRIVIA_ROUNDS[currentTriviaIdx];

  if (iata === round.answer) {
    triviaRoundOver = true;
    btnEl.classList.add("correct");
    document.querySelectorAll("#destinationsGrid .dest-btn").forEach(b => { b.disabled = true; });
    $("btnFifty").style.display = "none";
    $("radarDestText").textContent = round.answer;
    syncBoardingHeader();

    const earned = triviaPractice ? 0 : currentTriviaPot;
    if (!triviaPractice) {
      save.triviaSolved[round.id] = true;
      persist();
      renderFlightStrip();
    }
    if (earned) addMiles(earned);
    syncBoardingHeader();
    fx.win();

    setTriviaStatus(earned
      ? `✅ Cleared for ${city} (${iata})! Earned +${earned} Miles.`
      : triviaPractice ? `✅ ${city} (${iata}) — practice round complete.` : `✅ ${city} (${iata}) — pool was empty, fewer guesses next time!`, "success");
    $("triviaWinTitle").textContent = earned ? `🎯 Routed to ${iata}! (+${earned} MI)` : `🎯 Routed to ${iata}!`;
    $("triviaWinSub").textContent = `${city} • Boarding pass verified.`;

    const boardBtn = $("btnBoardFlight");
    if (app.itinerary && app.itinerary.dest === round.origin) {
      app.itinerary.nextDest = round.answer;
      app.itinerary.step = 3;
      syncBoardingHeader();
      boardBtn.style.display = "inline-flex";
      boardBtn.textContent = `🚶 Board ${round.origin} ✈ ${round.answer}`;
    } else {
      boardBtn.style.display = "none";
    }

    $("triviaWinBanner").classList.add("show");
  } else {
    btnEl.classList.add("wrong");
    btnEl.disabled = true;
    currentTriviaPot = Math.max(0, currentTriviaPot - WRONG_PENALTY);
    updatePot();
    fx.error();
    setTriviaStatus(triviaPractice
      ? `❌ Not ${iata}! Check flight time & clues.`
      : `❌ Not ${iata}! Check flight time & clues (−${WRONG_PENALTY} pool).`, "error");
  }
}

export function nextTriviaRound() {
  // Prefer the next open, un-routed flight; otherwise practice the next open one
  const n = TRIVIA_ROUNDS.length;
  const order = Array.from({ length: n }, (_, k) => (currentTriviaIdx + 1 + k) % n).filter(unlocked);
  const fresh = order.find(idx => !save.triviaSolved[TRIVIA_ROUNDS[idx].id]);
  if (fresh === undefined && order.length < n) toast("🔒 Pack more bags to unlock new flights!");
  loadTriviaRound(fresh ?? order[0]);
}

export function continueToBoarding() {
  switchMode("shuffle");
  newShuffle();
  if (app.itinerary) {
    toast(`🚶 Boarding ${app.itinerary.dest} ✈ ${app.itinerary.nextDest} — line up the boarding groups!`);
  }
}
