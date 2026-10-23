import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, THEMES, dailyConfig, generateBag } from "../../js/generator.js";
import { computeBalance, validatePlacement } from "../../js/packing.js";
import { solutionMove, rotationsToSolution } from "../helpers.js";

const allPieces = (bag) => [...bag.items, bag.bonus];

// Pack every piece into its solution cells through the real placement rules; returns the filled grid
function packSolution(cfg, bag) {
  const grid = Array.from({ length: cfg.rows }, () => Array(cfg.cols).fill(null));
  cfg.blocked.forEach(([r, c]) => { grid[r][c] = "BLOCKED"; });
  const pieces = allPieces(bag);
  const byId = new Map(pieces.map(p => [p.id, p]));
  for (const item of pieces) {
    const { shape, base } = solutionMove(item);
    const check = validatePlacement({ ...item, shape }, base[0], base[1], { grid, getItem: id => byId.get(id) });
    assert.ok(check.valid, `${cfg.id}: ${item.name} rejected at its solution — ${check.reason}`);
    check.cells.forEach(([r, c]) => { grid[r][c] = item.id; });
  }
  return { grid, byId };
}

function assertThreeStarSolution(cfg) {
  const bag = generateBag(cfg);
  assert.ok(bag, `${cfg.id}: no bag generated`);
  assert.ok(bag.bonus, `${cfg.id}: missing curveball item`);
  for (const item of allPieces(bag)) assert.notEqual(rotationsToSolution(item), -1, `${cfg.id}: ${item.name} can't rotate into its solution`);

  const { grid, byId } = packSolution(cfg, bag);
  // ⭐⭐⭐ needs every free slot filled …
  assert.equal(grid.flat().filter(v => v === null).length, 0, `${cfg.id}: solution leaves empty slots`);
  // … and a balanced bag with heavy items low
  const cells = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (v && v !== "BLOCKED") cells.push({ r, c, rule: byId.get(v).rule }); }));
  const bal = computeBalance(cfg.rows, cfg.cols, cells);
  assert.ok(bal.isBalanced, `${cfg.id}: solution isn't balanced (shift ${bal.shift.toFixed(1)}, topHeavy ${bal.topHeavy})`);
}

test("every hand-made level has a valid, full, balanced (3-star) solution", () => {
  LEVELS.forEach(assertThreeStarSolution);
});

test("a year of daily bags all have 3-star solutions", () => {
  const day = new Date(2026, 0, 1);
  for (let i = 0; i < 365; i++) {
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    assertThreeStarSolution(dailyConfig(key));
    day.setDate(day.getDate() + 1);
  }
});

test("bags are deterministic for a given config", () => {
  for (const cfg of [LEVELS[2], dailyConfig("2026-10-23")]) {
    assert.deepEqual(generateBag(cfg), generateBag(cfg));
  }
});

test("the daily bag is the same all day and changes between days", () => {
  assert.deepEqual(dailyConfig("2026-10-23"), dailyConfig("2026-10-23"));
  const seeds = new Set(Array.from({ length: 30 }, (_, i) => dailyConfig(`2026-11-${String(i + 1).padStart(2, "0")}`).seed));
  assert.ok(seeds.size > 25, "daily seeds barely vary");
});

test("items use the destination theme and carry their rule", () => {
  const bag = generateBag(LEVELS[1]); // island theme
  const themed = new Set(Object.values(THEMES.island).flat(1).map(x => (Array.isArray(x) ? x[0] : x)));
  assert.ok(bag.items.some(i => themed.has(i.name)));
  assert.equal(bag.bonus.name, THEMES.island.curveball[0]);
  for (const item of bag.items) assert.ok(["TOP_ROW", "BOTTOM_HEAVY", "HEAVY", "FRAGILE", "NONE"].includes(item.rule));
});

test("layouts that can't be partitioned return null instead of throwing", () => {
  const walledIn = { rows: 5, cols: 6, blocked: [[0, 1], [1, 0]], rules: { top: 1, bottomHeavy: 0, heavy: 0, fragile: 0 }, seed: 777, theme: "weekend" };
  assert.equal(generateBag(walledIn), null);
  const allBlocked = { ...walledIn, blocked: Array.from({ length: 30 }, (_, i) => [Math.floor(i / 6), i % 6]) };
  assert.equal(generateBag(allBlocked), null);
});
