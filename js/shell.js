// Mode tabs, the boarding-pass header and the connected-itinerary bar.
import { $ } from "./util.js";
import { app } from "./state.js";
import { packHeader } from "./modes/pack.js";
import { triviaHeader } from "./modes/trivia.js";
import { boardingHeader } from "./modes/boarding.js";

const HEADERS = { tetris: packHeader, trivia: triviaHeader, shuffle: boardingHeader };

function syncItineraryBar() {
  const bar = $("itineraryBar");
  if (!app.itinerary) {
    bar.classList.remove("show");
    return;
  }
  bar.classList.add("show");
  const { origin, dest, nextDest, step } = app.itinerary;
  $("itineraryLabel").textContent = `🎫 Leg: ${origin} ✈ ${dest}${nextDest ? ` ✈ ${nextDest}` : ""}`;
  const s1 = $("itinStepPack"), s2 = $("itinStepTrivia"), s3 = $("itinStepBoard");
  s1.className = "itinerary-step" + (step > 1 ? " done" : " active");
  s2.className = "itinerary-step" + (step > 2 ? " done" : step === 2 ? " active" : "");
  s3.className = "itinerary-step" + (step > 3 ? " done" : step === 3 ? " active" : "");
}

export function syncBoardingHeader() {
  const info = HEADERS[app.mode]();
  if (info) {
    $("routeTitle").textContent = info.title;
    $("routeSubtitle").textContent = info.subtitle;
    $("levelBadge").textContent = info.badge;
  }
  syncItineraryBar();
}

export function switchMode(mode) {
  app.mode = mode;
  $("modeTetris").classList.toggle("hidden", mode !== "tetris");
  $("modeTrivia").classList.toggle("hidden", mode !== "trivia");
  $("modeShuffle").classList.toggle("hidden", mode !== "shuffle");
  $("tabMode1").classList.toggle("active", mode === "tetris");
  $("tabMode2").classList.toggle("active", mode === "trivia");
  $("tabMode3").classList.toggle("active", mode === "shuffle");
  syncBoardingHeader();
}
