// End-to-end smoke tests: drive the real UI in headless Chromium through clicks and keys only.
// Run with `npm run test:e2e` (needs the Playwright Chromium build: `npx playwright install chromium`).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startServer } from "../../scripts/serve.js";
import { LEVELS, generateBag } from "../../js/generator.js";
import { TRIVIA_ROUNDS } from "../../js/data/trivia-rounds.js";
import { solutionMove, boardingSolutionTaps } from "../helpers.js";

const PORT = 8791;
const URL_BASE = `http://localhost:${PORT}/index.html`;
let server, browser;

before(async () => {
  server = await startServer(PORT);
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

// Fresh browser profile per test, collecting any page errors. `save` seeds localStorage before the game boots.
async function openGame(hash = "", contextOptions = {}, save = null) {
  const context = await browser.newContext({ viewport: { width: 420, height: 900 }, ...contextOptions });
  if (save) {
    await context.addInitScript((json) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("gate_suite_save_v3", json); sessionStorage.setItem("seeded", "1"); }
    }, JSON.stringify(save));
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(URL_BASE + hash);
  await page.waitForSelector("#itemTray .item-card");
  return { page, errors, close: () => context.close() };
}

const miles = async (page) => Number((await page.textContent("#milesCount")).replace(/,/g, ""));
const cell = (r, c) => `#suitcaseGrid .cell[data-r="${r}"][data-c="${c}"]`;

async function packItem(page, item) {
  const move = solutionMove(item);
  await page.click(`#itemCard-${item.id}`);
  for (let k = 0; k < move.rotations; k++) await page.click("#btnRotate");
  await page.click(cell(...move.tap));
}

test("boots cleanly and switches between all three modes", async () => {
  const { page, errors, close } = await openGame();
  assert.equal(await page.textContent("#routeTitle"), LEVELS[0].route);
  await page.click("#tabMode2");
  assert.equal(await page.isVisible("#modeTrivia"), true);
  assert.equal(await page.locator(".dest-btn").count(), 4);
  await page.click("#tabMode3");
  assert.equal(await page.isVisible("#modeShuffle"), true);
  assert.equal(await page.locator(".pax-tile").count(), 8);
  assert.match(await page.textContent("#shuffleParText"), /PAR: \d+/);
  await page.click("#tabMode1");
  assert.equal(await page.isVisible("#modeTetris"), true);
  assert.deepEqual(errors, []);
  await close();
});

test("packing the first bag perfectly earns three stars and 1,000 miles", async () => {
  const { page, errors, close } = await openGame();
  const startMiles = await miles(page);
  const bag = generateBag(LEVELS[0]);

  for (const item of bag.items) await packItem(page, item);
  await page.waitForSelector("#curveballBanner.show");
  await page.click("#btnAcceptCurveball");
  await packItem(page, bag.bonus);

  await page.waitForSelector("#winBanner.show");
  assert.equal(await page.locator("#winStars .dim").count(), 0, "a star is missing");
  assert.equal(await miles(page) - startMiles, 300 + 200 + 500);
  assert.match(await page.textContent("#levelChip-0"), /★★★/);
  assert.match(await page.getAttribute("#levelChip-0", "class"), /perfect/);
  await page.click("#btnNextBag");
  await page.click("#levelChip-0");
  assert.match(await page.getAttribute("#levelBadge", "class"), /perfect/);
  assert.match(await page.textContent("#statusText"), /already zipped this bag perfectly/);
  await page.click("#btnRecords");
  assert.match(await page.textContent("#bagRecords .day-row:first-child"), /SFO ✈ LAX\s*★★★ · \d+m · \d+% bal/);
  assert.deepEqual(errors, []);
  await close();
});

test("keyboard: browser shortcuts are left alone, H buys a hint, arrows + Enter place an item", async () => {
  const { page, errors, close } = await openGame();
  const m0 = await miles(page);
  await page.keyboard.press("Control+h");
  assert.equal(await miles(page), m0, "Ctrl+H must not spend miles");
  await page.keyboard.press("h");
  assert.equal(await miles(page), m0 - 150);

  const item = generateBag(LEVELS[0]).items[0]; // selected by default
  const move = solutionMove(item);
  for (let k = 0; k < move.rotations; k++) await page.keyboard.press("r");
  await page.focus(cell(0, 0));
  for (let i = 0; i < move.tap[0]; i++) await page.keyboard.press("ArrowDown");
  for (let i = 0; i < move.tap[1]; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  assert.match(await page.textContent("#packedCount"), /^1\//);
  assert.deepEqual(errors, []);
  await close();
});

test("touch: first tap previews, second tap on the same cell places", async () => {
  const { page, errors, close } = await openGame("", { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const item = generateBag(LEVELS[0]).items[0];
  const move = solutionMove(item);
  for (let k = 0; k < move.rotations; k++) await page.tap("#btnRotate");
  await page.tap(cell(...move.tap));
  assert.match(await page.textContent("#packedCount"), /^0\//);
  assert.ok(await page.locator(".preview-valid").count() > 0, "no preview after the first tap");
  await page.tap(cell(...move.tap));
  assert.match(await page.textContent("#packedCount"), /^1\//);
  assert.deepEqual(errors, []);
  await close();
});

test("routing the first trivia flight correctly pays the full reward pool", async () => {
  const { page, errors, close } = await openGame();
  const m0 = await miles(page);
  await page.click("#tabMode2");
  await page.click(`#dest-${TRIVIA_ROUNDS[0].answer}`);
  await page.waitForSelector("#triviaWinBanner.show");
  assert.equal(await miles(page) - m0, 500);
  assert.deepEqual(errors, []);
  await close();
});

test("a better trivia replay shows a new best and updates the flight's record", async () => {
  const { page, errors, close } = await openGame();
  const round = TRIVIA_ROUNDS[0];
  await page.click("#tabMode2");
  const wrong = round.options.find(([code]) => code !== round.answer)[0];
  await page.click(`#dest-${wrong}`);
  await page.click(`#dest-${round.answer}`);
  await page.waitForSelector("#triviaWinBanner.show");
  assert.doesNotMatch(await page.textContent("#triviaWinSub"), /New best/, "a first solve isn't a new best");
  await page.click(`#flightChip-${round.id}`);
  await page.click(`#dest-${round.answer}`);
  await page.waitForSelector("#triviaWinBanner.show");
  assert.match(await page.textContent("#triviaWinSub"), /New best for this flight: 500 points, 0 wrong/);
  await page.click("#btnRecords");
  assert.match(await page.textContent("#triviaRecords .day-row:first-child"), /SFO ✈ YVR\s*500 pts · 0 wrong/);
  assert.deepEqual(errors, []);
  await close();
});

test("a shared link that can't be packed falls back to a regular bag", async () => {
  const { page, errors, close } = await openGame("#custom=1&o=SFO&d=NRT&r=5&c=6&t=weekend&k=light&s=777&b=0.1_1.0");
  assert.equal(await page.textContent("#routeTitle"), LEVELS[0].route);
  assert.equal(await page.evaluate(() => location.hash), "");
  await page.click("#tabMode2");
  assert.equal(await page.locator(".dest-btn").count(), 4, "trivia didn't boot");
  assert.deepEqual(errors, []);
  await close();
});

test("a valid shared link loads that custom bag", async () => {
  const { page, errors, close } = await openGame("#custom=1&o=SEA&d=HNL&r=5&c=6&t=island&k=normal&s=42&b=4.0_4.5");
  assert.equal(await page.textContent("#routeTitle"), "SEA ✈ HNL");
  assert.equal(await page.textContent("#levelBadge"), "Custom");
  assert.deepEqual(errors, []);
  await close();
});

test("the records window's Play Daily Bag button switches to the Pack tab", async () => {
  const { page, errors, close } = await openGame();
  await page.click("#tabMode2");
  await page.click("#btnRecords");
  await page.click("#recTab-pack");
  await page.click("[data-action=playDailyFromRecords]");
  assert.equal(await page.isVisible("#modeTetris"), true);
  assert.equal(await page.textContent("#levelBadge"), "Daily");
  assert.deepEqual(errors, []);
  await close();
});

// Read the line-up from the tiles' on-screen grid positions
async function readBoardingTiles(page) {
  return page.$$eval(".pax-tile", (els) => {
    const n = Math.round(Math.sqrt(els.length + 1));
    const tiles = Array(n * n).fill(0);
    const board = document.getElementById("shuffleBoard").getBoundingClientRect();
    els.forEach((el) => {
      const b = el.getBoundingClientRect();
      const c = Math.round(((b.left - board.left) / board.width) * n);
      const r = Math.round(((b.top - board.top) / board.height) * n);
      tiles[r * n + c] = Number(el.id.replace("pax-", ""));
    });
    return tiles;
  });
}

async function solveBoarding(page) {
  await page.waitForTimeout(300); // let tile slide transitions settle before measuring
  const taps = await boardingSolutionTaps(await readBoardingTiles(page));
  for (const v of taps) await page.click(`#pax-${v}`);
  await page.waitForSelector("#shuffleWinBanner.show");
}

test("Boarding pays miles for the first line-up of the day only", async () => {
  const { page, errors, close } = await openGame();
  await page.click("#tabMode3");
  const m0 = await miles(page);
  await solveBoarding(page); // shortest solution is always under par
  assert.equal(await miles(page) - m0, 400);
  await page.click("#btnNextShuffle");
  assert.match(await page.textContent("#shuffleParText"), /PRACTICE/);
  await solveBoarding(page);
  assert.equal(await miles(page) - m0, 400, "second line-up paid again");
  await page.click("#btnRecords");
  assert.equal(await page.isVisible("#recPanel-boarding"), true, "records open on the current game's tab");
  const rec = await page.textContent("#boardingRecords");
  assert.match(rec, /Line-ups solved\s*2/);
  assert.match(rec, /At or under par\s*2 of 2/);
  assert.deepEqual(errors, []);
  await close();
});

test("after one visit the game loads offline", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(URL_BASE);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the service worker
  await page.waitForSelector("#itemTray .item-card");
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector("#itemTray .item-card");
  await page.click("#tabMode2");
  assert.equal(await page.locator(".dest-btn").count(), 4);
  await context.close();
});

test("a connected trip runs Pack → Route → Board and pays the itinerary bonus once", async () => {
  const { page, errors, close } = await openGame();
  const bag = generateBag(LEVELS[0]);
  for (const item of bag.items) await packItem(page, item);
  await page.waitForSelector("#winBanner.show");

  await page.click("#btnContinueTrip");
  assert.equal(await page.isVisible("#modeTrivia"), true);
  assert.equal(await page.isVisible("#itineraryBar"), true);
  const round = TRIVIA_ROUNDS.find((r) => r.origin === LEVELS[0].dest);
  await page.click(`#dest-${round.answer}`);
  await page.click("#btnBoardFlight");
  assert.equal(await page.isVisible("#modeShuffle"), true);
  assert.equal(await page.textContent("#routeTitle"), `${LEVELS[0].dest} ✈ ${round.answer}`);

  const before = await miles(page);
  await solveBoarding(page);
  assert.equal(await miles(page) - before, 400 + 300, "boarding reward + itinerary bonus");
  await page.click("#btnNextItineraryBag");
  assert.equal(await page.textContent("#routeTitle"), LEVELS[1].route);
  assert.match(await page.getAttribute("#levelChip-0", "class"), /itinerary/);
  assert.deepEqual(errors, []);
  await close();
});

test("skipping a stuck bag needs a second tap, opens the next bag and earns nothing", async () => {
  const { page, errors, close } = await openGame();
  const m0 = await miles(page);
  assert.equal(await page.isVisible("#btnSkipBag"), true);
  await page.click("#btnSkipBag");
  assert.equal(await page.textContent("#routeTitle"), LEVELS[0].route, "first tap must only arm the skip");
  assert.match(await page.textContent("#btnSkipBag"), /Tap again/);
  await page.click("#btnSkipBag");
  assert.equal(await page.textContent("#routeTitle"), LEVELS[1].route);
  assert.match(await page.getAttribute("#levelChip-0", "class"), /skipped/);
  assert.equal(await miles(page), m0);
  // skipping doesn't open the trivia flight tied to that bag
  await page.click("#tabMode2");
  assert.match(await page.getAttribute("#flightChip-lax-mex", "class"), /locked/);
  assert.deepEqual(errors, []);
  await close();
});

test("trivia flights unlock as bags are packed", async () => {
  const { page, errors, close } = await openGame();
  await page.click("#tabMode2");
  assert.equal(await page.locator("#flightStrip .level-chip.locked").count(), TRIVIA_ROUNDS.filter(r => r.unlockBag).length);
  await page.click("#flightChip-lax-mex");
  assert.match(await page.textContent("#triviaStatusText"), /Pack the SFO ✈ LAX bag/);

  await page.click("#tabMode1");
  for (const item of generateBag(LEVELS[0]).items) await packItem(page, item);
  await page.waitForSelector("#winBanner.show");
  await page.waitForSelector("#toast.show");
  assert.match(await page.textContent("#toast"), /New trivia flight/);
  await page.click("#tabMode2");
  assert.doesNotMatch(await page.getAttribute("#flightChip-lax-mex", "class"), /locked/);
  await page.click("#flightChip-lax-mex");
  assert.equal(await page.textContent("#radarOriginText"), "LAX");
  assert.deepEqual(errors, []);
  await close();
});

test("later trip legs board a 4×4 wide-body cabin", async () => {
  // Start with the first three bags skipped, so LHR ✈ RAK (bag 4) is open
  const skippedBags = Object.fromEntries(LEVELS.slice(0, 3).map(lv => [lv.id, true]));
  const { page, errors, close } = await openGame("", {}, { version: 2, miles: 1200, lifetime: 1200, skippedBags, tetrisLevel: 3 });
  assert.equal(await page.textContent("#routeTitle"), LEVELS[3].route);
  for (const item of generateBag(LEVELS[3]).items) await packItem(page, item);
  await page.waitForSelector("#winBanner.show");
  await page.click("#btnContinueTrip");
  const round = TRIVIA_ROUNDS.find(r => r.origin === LEVELS[3].dest);
  await page.click(`#dest-${round.answer}`);
  await page.click("#btnBoardFlight");

  assert.equal(await page.locator(".pax-tile").count(), 15);
  assert.match(await page.textContent("#shuffleParText"), /\+600 MI/);
  const before = await miles(page);
  await solveBoarding(page);
  assert.equal(await miles(page) - before, 600 + 300, "4×4 reward + itinerary bonus");
  // free play afterwards is back to the 3×3 cabin
  await page.click("#btnNewShuffle");
  assert.equal(await page.locator(".pax-tile").count(), 8);
  assert.deepEqual(errors, []);
  await close();
});

test("the route title never overlaps the header controls on phone widths", async () => {
  const save = { version: 2, bagStars: { "sfo-lax": 1, "lax-hnl": 1, "jfk-lhr": 1, "lhr-rak": 1 }, tetrisLevel: 4 }; // ICN ✈ CTS
  for (const width of [360, 390, 430]) {
    const { page, close } = await openGame("", { viewport: { width, height: 800 } }, save);
    const overlap = await page.evaluate(() => {
      const t = document.getElementById("routeTitle").getBoundingClientRect();
      const c = document.querySelector(".level-controls").getBoundingClientRect();
      return t.right > c.left && t.bottom > c.top && c.bottom > t.top;
    });
    assert.equal(overlap, false, `title overlaps the controls at ${width}px`);
    await close();
  }
});

test("the theme toggle switches between light and dark and is remembered", async () => {
  const { page, errors, close } = await openGame("", { colorScheme: "light" });
  const ground = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(await ground(), "rgb(235, 240, 230)");
  await page.click("#btnTheme");
  assert.equal(await page.getAttribute("html", "data-theme"), "dark");
  assert.equal(await ground(), "rgb(13, 18, 19)");
  await page.reload();
  await page.waitForSelector("#itemTray .item-card");
  assert.equal(await ground(), "rgb(13, 18, 19)", "dark choice was not remembered");
  assert.deepEqual(errors, []);
  await close();
});

test("every mode fits a 360px phone without sideways scrolling", async () => {
  const { page, errors, close } = await openGame("", { viewport: { width: 360, height: 780 } });
  for (const tab of ["#tabMode1", "#tabMode2", "#tabMode3"]) {
    await page.click(tab);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.equal(overflow, 0, `${tab} scrolls sideways by ${overflow}px`);
  }
  assert.deepEqual(errors, []);
  await close();
});
