// Custom bag configs and their shareable URL hash (#custom=1&o=SFO&d=NRT&...).
// Pure: takes and returns plain values, so parsing and encoding are unit-tested.
import { THEMES, generateBag } from "./generator.js";

export const RULE_PRESETS = {
  light: { top: 1, bottomHeavy: 0, heavy: 1, fragile: 0 },
  normal: { top: 2, bottomHeavy: 1, heavy: 0, fragile: 1 },
  strict: { top: 2, bottomHeavy: 1, heavy: 1, fragile: 2 }
};

export const SIZE_LIMITS = { minRows: 4, maxRows: 6, minCols: 5, maxCols: 7 };

// Keep at least 12 free slots so a bag always has room for several items
export const maxBlockedFor = (rows, cols) => Math.max(0, rows * cols - 12);

// Generation is deterministic, so a trial run tells us whether a layout can be packed at all
export const isPackable = (cfg) => !!generateBag(cfg);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Airport codes are letters only (they end up in the level strip's markup)
const iata = (v, fallback) => (String(v || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || fallback);

// Normalise raw inputs (from the builder form or a shared link) into a bag config
export function makeCustomConfig({ origin, dest, rows, cols, theme, ruleKey, seed, blocked = [] }, subtitlePrefix = "🛠️ Custom Flight Bag") {
  const o = iata(origin, "SFO");
  const d = iata(dest, "NRT");
  const r = clamp(Number(rows) || 5, SIZE_LIMITS.minRows, SIZE_LIMITS.maxRows);
  const c = clamp(Number(cols) || 6, SIZE_LIMITS.minCols, SIZE_LIMITS.maxCols);
  const t = THEMES[theme] ? theme : "weekend";
  const k = RULE_PRESETS[ruleKey] ? ruleKey : "normal";
  const s = clamp(Math.floor(Number(seed)) || 777, 1, 99999);
  const seen = new Set();
  const cells = blocked
    .filter(([br, bc]) => Number.isInteger(br) && Number.isInteger(bc) && br >= 0 && br < r && bc >= 0 && bc < c)
    .filter(([br, bc]) => !seen.has(br + "," + bc) && seen.add(br + "," + bc))
    .slice(0, maxBlockedFor(r, c));
  return {
    id: `custom-${o}-${d}-${r}x${c}-${s}`,
    route: `${o} ✈ ${d}`,
    origin: o,
    dest: d,
    subtitle: `${subtitlePrefix} • Seed #${s}`,
    rows: r,
    cols: c,
    blocked: cells,
    rules: RULE_PRESETS[k],
    ruleKey: k,
    seed: s,
    theme: t,
    isCustom: true
  };
}

export function encodeCustomHash(cfg) {
  const params = new URLSearchParams({
    custom: "1",
    o: cfg.origin,
    d: cfg.dest,
    r: String(cfg.rows),
    c: String(cfg.cols),
    t: cfg.theme,
    k: cfg.ruleKey,
    s: String(cfg.seed),
    b: cfg.blocked.map(([r, c]) => `${r}.${c}`).join("_")
  });
  return "#" + params.toString();
}

// Returns a config for a "#custom=1&..." hash, or null for any other hash
export function parseCustomHash(hash) {
  if (!hash || hash.length < 2) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("custom") !== "1") return null;
  const bRaw = params.get("b") || "";
  return makeCustomConfig({
    origin: params.get("o"),
    dest: params.get("d"),
    rows: params.get("r"),
    cols: params.get("c"),
    theme: params.get("t"),
    ruleKey: params.get("k"),
    seed: params.get("s"),
    blocked: bRaw ? bRaw.split("_").map(p => p.split(".").map(Number)) : []
  }, "🛠️ Shared Custom Bag");
}
