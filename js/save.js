// Save data in localStorage. parseSave/migrateSave are pure so they can be unit-tested.

export const SAVE_KEY = "gate_suite_save_v3";
export const SAVE_VERSION = 3; // bump and add a step to migrateSave() whenever the save shape changes

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

export function defaultSave(legacyMiles = Number(storageGet("gate_suite_miles") || 1200)) {
  return {
    version: SAVE_VERSION,
    miles: legacyMiles,
    lifetime: legacyMiles,
    muted: false,
    skin: "classic",
    ownedSkins: ["classic"],
    bagStars: {},      // levelId -> star bitmask (1 packed, 2 balanced, 4 full)
    dailyStats: {},    // dateKey -> { moves, balancePct, stars, mask }
    itineraries: {},   // levelId -> true (completed Pack + Route + Board)
    skippedBags: {},   // levelId -> true (skipped to open the next bag; no stars or miles)
    bagRecords: {},    // levelId -> best run { stars, moves, balancePct } (hand-made bags)
    triviaRecords: {}, // roundId -> best { score, wrong }
    boardingRecords: {}, // cabin size ("3" / "4") -> { solved, atPar, vsPar, moves, par }
    tetrisLevel: 0,
    triviaIdx: 0,
    triviaSolved: {},  // roundId -> true
    shuffleSolved: 0,
    shuffleRewardDay: null // dateKey of the last line-up that paid miles (one paid line-up per day)
  };
}

// Upgrade older saves one version at a time; new fields are filled from defaultSave()
export function migrateSave(raw, defaults = defaultSave()) {
  const s = { ...defaults, ...raw };
  if (!raw.version) {
    // v0 (v0.3–v0.4 saves had no version): make sure the keyed maps exist
    ["bagStars", "dailyStats", "itineraries", "triviaSolved"].forEach(k => {
      if (!s[k] || typeof s[k] !== "object") s[k] = {};
    });
    if (!Array.isArray(s.ownedSkins)) s.ownedSkins = ["classic"];
  }
  if ((raw.version || 0) < 2) {
    // v2 added skippedBags; repair it in case an older build stored something odd there
    if (!s.skippedBags || typeof s.skippedBags !== "object") s.skippedBags = {};
  }
  if ((raw.version || 0) < 3) {
    // v3 added personal records; they start empty (older saves only kept stars and daily results)
    ["bagRecords", "triviaRecords", "boardingRecords"].forEach(k => {
      if (!s[k] || typeof s[k] !== "object") s[k] = {};
    });
  }
  s.version = SAVE_VERSION;
  return s;
}

// Turn the stored JSON text into a save, falling back to a fresh one if it's missing or corrupted
export function parseSave(text, defaults = defaultSave()) {
  try {
    const raw = JSON.parse(text);
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return migrateSave(raw, defaults);
  } catch (e) { /* corrupted save, start fresh */ }
  return defaults;
}

// The live save object. Modules mutate its fields and call persist().
export const save = parseSave(storageGet(SAVE_KEY));

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage full or blocked */ }
}
