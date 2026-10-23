// Entry point: wires buttons and keyboard shortcuts, then boots all three modes.
import { $ } from "./util.js";
import { save } from "./save.js";
import { toggleSound, updateSoundIcon } from "./audio.js";
import { applySkin, updateMilesDisplay, openShop, closeShop } from "./economy.js";
import { applyTheme, toggleTheme } from "./theme.js";
import { app } from "./state.js";
import { switchMode } from "./shell.js";
import { LEVELS } from "./generator.js";
import { TRIVIA_ROUNDS } from "./data/trivia-rounds.js";
import * as pack from "./modes/pack.js";
import * as trivia from "./modes/trivia.js";
import * as boarding from "./modes/boarding.js";
import * as builder from "./builder.js";

// Buttons declare data-action (and optionally data-arg) instead of inline onclick handlers
const ACTIONS = {
  switchMode: (mode) => switchMode(mode),
  openBuilder: builder.openBuilder,
  closeBuilder: builder.closeBuilder,
  playDailyFromBuilder: builder.playDailyFromBuilder,
  playCustomBag: builder.playCustomBagFromModal,
  shareCustomBag: builder.shareCustomBagUrl,
  shareDailyResult: builder.shareDailyResult,
  openShop,
  closeShop,
  toggleSound,
  toggleTheme,
  acceptCurveball: pack.acceptCurveball,
  declineCurveball: pack.declineCurveball,
  nextBag: pack.nextLevel,
  continueTrip: pack.continueTrip,
  rotate: pack.rotateSelected,
  undo: pack.undo,
  hint: pack.useHint,
  reset: pack.resetLevel,
  skipBag: pack.skipBag,
  unlockClue: (n) => trivia.unlockClue(Number(n)),
  fiftyFifty: trivia.fiftyFifty,
  nextFlight: trivia.nextTriviaRound,
  boardFlight: trivia.continueToBoarding,
  newShuffle: boarding.newShuffle,
  nextLegBag: boarding.completeItineraryAndNextBag
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (el && !el.disabled) ACTIONS[el.dataset.action](el.dataset.arg);
});

// Tapping the dimmed backdrop closes a modal
[["builderModal", builder.closeBuilder], ["shopModal", closeShop]].forEach(([id, close]) => {
  $(id).addEventListener("click", (e) => { if (e.target === e.currentTarget) close(); });
});

document.addEventListener("keydown", (e) => {
  if ($("shopModal").classList.contains("show")) {
    if (e.key === "Escape") closeShop();
    return;
  }
  if ($("builderModal").classList.contains("show")) {
    if (e.key === "Escape") builder.closeBuilder();
    return;
  }
  if (app.mode !== "tetris") return;
  const k = e.key.toLowerCase();
  // Leave browser shortcuts (Ctrl+R reload, Ctrl+H history, …) alone; only Ctrl/⌘+Z maps to undo
  if (e.ctrlKey || e.metaKey || e.altKey) {
    if (k === "z" && !e.altKey && !e.shiftKey) { e.preventDefault(); pack.undo(); }
    return;
  }
  if (k === "r") pack.rotateSelected();
  else if (k === "z") { e.preventDefault(); pack.undo(); }
  else if (k === "h") pack.useHint();
});

window.addEventListener("hashchange", () => builder.loadSharedBagFromHash());

/* Boot */
applyTheme();
applySkin();
updateMilesDisplay();
updateSoundIcon();
pack.initGridInput();
builder.initBuilderForm();
if (!builder.loadSharedBagFromHash({ announce: false })) {
  const startLevel = Math.min(save.tetrisLevel || 0, LEVELS.length - 1);
  pack.loadLevel(pack.isLevelUnlocked(startLevel) ? startLevel : 0);
}
trivia.loadTriviaRound(Math.min(save.triviaIdx || 0, TRIVIA_ROUNDS.length - 1));
boarding.newShuffle();
switchMode("tetris");

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
