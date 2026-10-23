// The 🛠️ window: daily leaderboard and score card, plus the custom bag builder and share links.
import { $, toast, todayKey, mulberry32, hashStr } from "./util.js";
import { save } from "./save.js";
import { fx } from "./audio.js";
import { app } from "./state.js";
import { switchMode } from "./shell.js";
import { loadLevel } from "./modes/pack.js";
import { makeCustomConfig, encodeCustomHash, parseCustomHash, isPackable, maxBlockedFor } from "./custom-bag.js";

let builderBlocked = new Set(["4,0", "4,5"]);

export function clearCustomHash() {
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
}

// Load the bag described by the current URL hash, if it's a playable shared bag. Returns true if loaded.
export function loadSharedBagFromHash({ announce = true } = {}) {
  const parsed = parseCustomHash(location.hash);
  if (!parsed) return false;
  if (!isPackable(parsed)) {
    clearCustomHash();
    // At boot the caller falls back to a regular bag; on a later hash change the current bag stays
    if (announce) toast("🚫 That shared bag can't be packed.");
    else setTimeout(() => toast("🚫 That shared bag can't be packed — starting a regular bag."), 300);
    return false;
  }
  app.customBagCfg = parsed;
  switchMode("tetris");
  loadLevel("custom");
  if (announce) toast(`🧳 Loaded shared bag: ${parsed.route}`);
  return true;
}

export function openBuilder() {
  renderDailyLeaderboard();
  rebuildCustomPreviewGrid();
  $("builderModal").classList.add("show");
  fx.tap();
}

export function closeBuilder() {
  $("builderModal").classList.remove("show");
}

export function playDailyFromBuilder() {
  closeBuilder();
  switchMode("tetris");
  loadLevel("daily");
}

export function initBuilderForm() {
  ["custOrigin", "custDest"].forEach(id => $(id).addEventListener("input", (e) => { e.target.value = e.target.value.toUpperCase(); }));
  $("custSize").addEventListener("change", rebuildCustomPreviewGrid);
}

function rebuildCustomPreviewGrid() {
  const [rows, cols] = $("custSize").value.split("x").map(Number);
  const grid = $("builderMiniGrid");
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.innerHTML = "";
  // Remove out-of-bounds blocked coordinates
  [...builderBlocked].forEach(k => {
    const [r, c] = k.split(",").map(Number);
    if (r >= rows || c >= cols) builderBlocked.delete(k);
  });
  const maxBlocked = maxBlockedFor(rows, cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const cell = document.createElement("div");
      cell.className = "builder-cell" + (builderBlocked.has(key) ? " blocked" : "");
      cell.textContent = builderBlocked.has(key) ? "✕" : "";
      cell.onclick = () => {
        if (builderBlocked.has(key)) {
          builderBlocked.delete(key);
        } else {
          if (builderBlocked.size >= maxBlocked) {
            toast("Keep at least 12 free slots in the bag!");
            fx.error();
            return;
          }
          builderBlocked.add(key);
        }
        fx.tap();
        rebuildCustomPreviewGrid();
      };
      grid.appendChild(cell);
    }
  }
}

function buildCustomConfigFromInputs() {
  const [rows, cols] = $("custSize").value.split("x").map(Number);
  return makeCustomConfig({
    origin: $("custOrigin").value.trim(),
    dest: $("custDest").value.trim(),
    rows,
    cols,
    theme: $("custTheme").value,
    ruleKey: $("custRules").value,
    seed: $("custSeed").value,
    blocked: [...builderBlocked].map(k => k.split(",").map(Number))
  });
}

function rejectUnpackable() {
  toast("🚫 That layout can't be packed — unblock a few cells.");
  fx.error();
}

export function playCustomBagFromModal() {
  const cfg = buildCustomConfigFromInputs();
  if (!isPackable(cfg)) { rejectUnpackable(); return; }
  app.customBagCfg = cfg;
  try { history.replaceState(null, "", encodeCustomHash(cfg)); } catch (e) { /* ignore */ }
  closeBuilder();
  switchMode("tetris");
  loadLevel("custom");
  toast(`🧳 Loaded custom bag: ${cfg.route}`);
}

export function shareCustomBagUrl() {
  const cfg = buildCustomConfigFromInputs();
  if (!isPackable(cfg)) { rejectUnpackable(); return; }
  app.customBagCfg = cfg;
  const hash = encodeCustomHash(cfg);
  try { history.replaceState(null, "", hash); } catch (e) { /* ignore */ }
  const url = location.origin + location.pathname + hash;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => toast("🔗 Custom bag URL copied to clipboard!"));
  } else {
    toast(`🔗 URL ready in address bar!`);
  }
  fx.coin();
}

function renderDailyLeaderboard() {
  const key = todayKey();
  $("lbDateLabel").textContent = key;
  const rng = mulberry32(hashStr("lb-" + key));
  const callsigns = ["Capt. Lin (SFO)", "FirstClassFox", "GateB14_Pro", "JetBridgeJay", "AisleSeatAmy", "RedEyeRory"];
  const entries = [];
  for (let i = 0; i < 4; i++) {
    const name = callsigns[Math.floor(rng() * callsigns.length)] + ` #${10 + Math.floor(rng() * 89)}`;
    const stars = i < 2 ? 3 : 2;
    const moves = 7 + i * 2 + Math.floor(rng() * 3);
    const balancePct = 96 - i * 4 - Math.floor(rng() * 3);
    entries.push({ name, stars, moves, balancePct, isMe: false });
  }
  const myStat = save.dailyStats && save.dailyStats[key];
  if (myStat) {
    entries.push({
      name: "✈️ You (Gate Traveler)",
      stars: myStat.stars,
      moves: myStat.moves,
      balancePct: myStat.balancePct,
      isMe: true
    });
  }
  entries.sort((a, b) => (b.stars - a.stars) || (a.moves - b.moves) || (b.balancePct - a.balancePct));

  const el = $("dailyLeaderboard");
  el.innerHTML = entries.map((e, idx) => `
    <div class="lb-row${e.isMe ? " me" : ""}">
      <span>#${idx + 1} ${e.name}</span>
      <span>${"★".repeat(e.stars)}${"☆".repeat(3 - e.stars)} • ${e.moves}m • ⚖️${e.balancePct}%</span>
    </div>
  `).join("") + `<div style="font-size:0.62rem; color:var(--text-muted); text-align:center; padding-top:2px;">Other travelers are sample scores for practice — not real players.</div>` + (!myStat ? `<div style="font-size:0.66rem; color:var(--text-muted); text-align:center; padding-top:2px;">Pack today's 📅 Daily Bag to post your score!</div>` : "");
}

export function shareDailyResult() {
  const key = todayKey();
  const st = save.dailyStats && save.dailyStats[key];
  const stars = st ? "⭐".repeat(st.stars) : "☆☆☆ (Unpacked)";
  const details = st ? `${st.moves} moves • ${st.balancePct}% balance` : "Try today's gate challenge!";
  const text = `🧳 Gate Games 📅 Daily (${key})\n${stars} — ${details}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast("📋 Daily scorecard copied!"));
  } else {
    toast(text);
  }
  fx.tap();
}

