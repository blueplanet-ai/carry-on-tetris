// The builder window: the custom bag builder and share links.
import { $, toast } from "./util.js";
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
    if (announce) toast("That shared bag can't be packed.");
    else setTimeout(() => toast("That shared bag can't be packed — starting a regular bag."), 300);
    return false;
  }
  app.customBagCfg = parsed;
  switchMode("tetris");
  loadLevel("custom");
  if (announce) toast(`Loaded shared bag: ${parsed.route}`);
  return true;
}

export function openBuilder() {
  rebuildCustomPreviewGrid();
  $("builderModal").classList.add("show");
  fx.tap();
}

export function closeBuilder() {
  $("builderModal").classList.remove("show");
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
  toast("That layout can't be packed — unblock a few cells.");
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
  toast(`Loaded custom bag: ${cfg.route}`);
}

export function shareCustomBagUrl() {
  const cfg = buildCustomConfigFromInputs();
  if (!isPackable(cfg)) { rejectUnpackable(); return; }
  app.customBagCfg = cfg;
  const hash = encodeCustomHash(cfg);
  try { history.replaceState(null, "", hash); } catch (e) { /* ignore */ }
  const url = location.origin + location.pathname + hash;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => toast("Custom bag URL copied to clipboard!"));
  } else {
    toast("URL ready in the address bar!");
  }
  fx.coin();
}
