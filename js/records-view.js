// The Records window: personal bests for Pack (with the daily bag), Trivia and Boarding, all from this device's save.
import { $, toast, todayKey, starString } from "./util.js";
import { save } from "./save.js";
import { fx } from "./audio.js";
import { app } from "./state.js";
import { switchMode } from "./shell.js";
import { LEVELS } from "./generator.js";
import { TRIVIA_ROUNDS } from "./data/trivia-rounds.js";
import { loadLevel } from "./modes/pack.js";
import { formatVsPar, starsText } from "./records.js";

const TABS = ["pack", "trivia", "boarding"];
const TAB_FOR_MODE = { tetris: "pack", trivia: "trivia", shuffle: "boarding" };

const row = (label, value, cls = "") => `
    <div class="day-row${cls ? ` ${cls}` : ""}"><span>${label}</span><span>${value}</span></div>`;

export function openRecords() {
  showRecordsTab(TAB_FOR_MODE[app.mode] || "pack");
  $("recordsModal").classList.add("show");
  fx.tap();
}

export function closeRecords() {
  $("recordsModal").classList.remove("show");
}

export function showRecordsTab(tab) {
  TABS.forEach(t => {
    $(`recTab-${t}`).classList.toggle("active", t === tab);
    $(`recTab-${t}`).setAttribute("aria-selected", String(t === tab));
    $(`recPanel-${t}`).classList.toggle("hidden", t !== tab);
  });
  if (tab === "pack") renderPackRecords();
  else if (tab === "trivia") renderTriviaRecords();
  else renderBoardingRecords();
}

function renderPackRecords() {
  renderDailyCard();
  $("bagRecords").innerHTML = LEVELS.map(lv => {
    const rec = save.bagRecords[lv.id];
    const banked = save.bagStars[lv.id] || 0;
    if (rec) return row(lv.route, `${starsText(rec.stars)} · ${rec.moves}m · ${rec.balancePct}% bal`);
    if (save.skippedBags[lv.id]) return row(lv.route, "skipped", "missed");
    // Bags packed before records existed only kept their stars
    if (banked) return row(lv.route, `${starString(banked)} · replay to record moves`, "missed");
    return row(lv.route, "not packed", "missed");
  }).join("");
}

// Today's result plus the last week
function renderDailyCard() {
  const key = todayKey();
  $("lbDateLabel").textContent = key;
  const stats = save.dailyStats || {};
  const today = stats[key];
  const head = today
    ? `<div class="daily-today"><span class="daily-stars">${starsText(today.stars)}</span><span>${today.moves} moves · ${today.balancePct}% balance</span></div>`
    : `<div class="daily-today empty">Pack today's daily bag to record your score.</div>`;

  const rows = [];
  const d = new Date();
  for (let i = 1; i <= 7; i++) {
    d.setDate(d.getDate() - 1);
    const st = stats[todayKey(d)];
    rows.push(st
      ? row(todayKey(d), `${starsText(st.stars)} · ${st.moves}m · ${st.balancePct}% bal`)
      : row(todayKey(d), "not packed", "missed"));
  }

  $("dailyCard").innerHTML = head + `<div class="section-label sub">Last 7 days</div>` + rows.join("");
}

function renderTriviaRecords() {
  const routed = Object.keys(save.triviaSolved).length;
  $("triviaSummary").textContent = `${routed} of ${TRIVIA_ROUNDS.length} flights routed. Best score is out of 500 (the miles a first try pays); practice rounds count too.`;
  $("triviaRecords").innerHTML = TRIVIA_ROUNDS.map(r => {
    const solved = !!save.triviaSolved[r.id];
    const rec = save.triviaRecords[r.id];
    const label = `${r.origin} ✈ ${solved || rec ? r.answer : "???"}`;
    if (rec) return row(label, `${rec.score} pts · ${rec.wrong} wrong`);
    return row(label, solved ? "routed · replay to record a score" : "not routed", "missed");
  }).join("");
}

function renderBoardingRecords() {
  $("boardingSummary").textContent = `${save.shuffleSolved} line-up${save.shuffleSolved === 1 ? "" : "s"} boarded. Every line-up is shuffled differently, so the best is measured against its par.`;
  $("boardingRecords").innerHTML = [[3, "Standard 3×3"], [4, "Wide-body 4×4"]].map(([n, name]) => {
    const rec = save.boardingRecords[n];
    if (!rec) {
      const note = n === 4 ? "Boards on connected trips from LHR ✈ RAK onward." : "No line-ups yet.";
      return `<div class="record-card"><div class="record-title">${name}</div><div class="record-empty">${note}</div></div>`;
    }
    return `<div class="record-card"><div class="record-title">${name}</div>${
      row("Best vs par", `${formatVsPar(rec.vsPar)} (${rec.moves} moves, par ${rec.par})`)}${
      row("Line-ups solved", rec.solved)}${
      row("At or under par", `${rec.atPar} of ${rec.solved}`)}</div>`;
  }).join("");
}

export function playDailyFromRecords() {
  closeRecords();
  switchMode("tetris");
  loadLevel("daily");
}

export function shareDailyResult() {
  const key = todayKey();
  const st = save.dailyStats && save.dailyStats[key];
  const stars = st ? "⭐".repeat(st.stars) : "☆☆☆ (Unpacked)";
  const details = st ? `${st.moves} moves • ${st.balancePct}% balance` : "Try today's gate challenge!";
  const text = `🧳 Gate Games 📅 Daily (${key})\n${stars} — ${details}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast("Daily scorecard copied!"));
  } else {
    toast(text);
  }
  fx.tap();
}
