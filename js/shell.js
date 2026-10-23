// Mode tabs, the boarding-pass header and the connected-itinerary bar.
import { $ } from "./util.js";
import { app } from "./state.js";
import { cityOf } from "./data/airports.js";
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
  $("itineraryLabel").textContent = `Connected leg: ${origin} ✈ ${dest}${nextDest ? ` ✈ ${nextDest}` : ""}`;
  const s1 = $("itinStepPack"), s2 = $("itinStepTrivia"), s3 = $("itinStepBoard");
  s1.className = "itinerary-step" + (step > 1 ? " done" : " active");
  s2.className = "itinerary-step" + (step > 2 ? " done" : step === 2 ? " active" : "");
  s3.className = "itinerary-step" + (step > 3 ? " done" : step === 3 ? " active" : "");
}

// The route title keeps the plain "SFO ✈ LAX" text; the codes and plane are styled separately
function renderRoute(title) {
  const [from, to = ""] = title.split(" ✈ ");
  const el = $("routeTitle");
  el.textContent = "";
  const code = (text) => {
    const s = document.createElement("span");
    s.className = "pass-code";
    s.textContent = text;
    return s;
  };
  const plane = document.createElement("span");
  plane.className = "pass-plane";
  plane.textContent = " ✈ ";
  el.append(code(from), plane, code(to));
  return [from, to];
}

export function syncBoardingHeader() {
  const info = HEADERS[app.mode]();
  if (info) {
    const [from, to] = renderRoute(info.title);
    $("passFromCity").textContent = info.fromCity ?? cityOf(from, "Origin");
    $("passToCity").textContent = info.toCity ?? cityOf(to, "Destination");
    $("routeSubtitle").textContent = info.subtitle;
    $("passDetail").textContent = info.detail || "";
    $("levelBadge").textContent = info.badge;
    $("levelBadge").classList.toggle("perfect", !!info.perfect);
    $("levelBadge").previousElementSibling.textContent = info.badgeLabel || "Flight";
  }
  syncItineraryBar();
}

export function switchMode(mode) {
  app.mode = mode;
  $("modeTetris").classList.toggle("hidden", mode !== "tetris");
  $("modeTrivia").classList.toggle("hidden", mode !== "trivia");
  $("modeShuffle").classList.toggle("hidden", mode !== "shuffle");
  [["tabMode1", "tetris"], ["tabMode2", "trivia"], ["tabMode3", "shuffle"]].forEach(([id, m]) => {
    $(id).classList.toggle("active", mode === m);
    if (mode === m) $(id).setAttribute("aria-current", "page");
    else $(id).removeAttribute("aria-current");
  });
  syncBoardingHeader();
}
