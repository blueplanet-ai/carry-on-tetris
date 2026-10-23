import { test } from "node:test";
import assert from "node:assert/strict";
import { computeBalance, placementBase, validatePlacement } from "../../js/packing.js";

const emptyGrid = (rows = 4, cols = 5) => Array.from({ length: rows }, () => Array(cols).fill(null));
const domino = (rule, id = "a") => ({ id, name: id, rule, shape: [[1, 1]] });

function check(item, r, c, grid, others = {}) {
  const items = { [item.id]: item, ...others };
  return validatePlacement(item, r, c, { grid, getItem: id => items[id] });
}

test("pieces must stay inside the suitcase and off blocked or filled cells", () => {
  const g = emptyGrid();
  assert.equal(check(domino("NONE"), 0, 4, g).valid, false);
  assert.match(check(domino("NONE"), 0, 4, g).reason, /outside/);
  g[1][1] = "BLOCKED";
  assert.match(check(domino("NONE"), 1, 0, g).reason, /frame/);
  g[2][2] = "b";
  assert.match(check(domino("NONE"), 2, 2, g, { b: domino("NONE", "b") }).reason, /occupied/);
  assert.equal(check(domino("NONE"), 3, 0, g).valid, true);
});

test("TSA items must touch the top row, bottom-heavy items the bottom row", () => {
  const g = emptyGrid();
  assert.equal(check(domino("TOP_ROW"), 1, 0, g).valid, false);
  assert.equal(check(domino("TOP_ROW"), 0, 0, g).valid, true);
  assert.equal(check(domino("BOTTOM_HEAVY"), 2, 0, g).valid, false);
  assert.equal(check(domino("BOTTOM_HEAVY"), 3, 0, g).valid, true);
});

test("fragile and heavy items can't share an edge, either way round", () => {
  const g = emptyGrid();
  g[2][0] = "h"; g[2][1] = "h";
  const heavy = domino("HEAVY", "h");
  assert.equal(check(domino("FRAGILE"), 1, 0, g, { h: heavy }).valid, false);   // directly above
  assert.equal(check(domino("FRAGILE"), 0, 0, g, { h: heavy }).valid, true);    // a row of gap
  assert.equal(check(domino("FRAGILE"), 1, 2, g, { h: heavy }).valid, true);    // diagonal only
  const g2 = emptyGrid();
  g2[0][0] = "f"; g2[0][1] = "f";
  assert.equal(check(domino("HEAVY"), 0, 2, g2, { f: domino("FRAGILE", "f") }).valid, false);
});

test("placement anchors on the filled cell nearest the shape's centre", () => {
  assert.deepEqual(placementBase({ shape: [[1, 1, 1]] }, 2, 2), [2, 1]);
  assert.deepEqual(placementBase({ shape: [[1], [1], [1]] }, 2, 2), [1, 2]);
  // L-shape: centre (0.5, 0.5) is closest to filled cell (0,0), the first of the ties
  assert.deepEqual(placementBase({ shape: [[1, 0], [1, 1]] }, 3, 3), [3, 3]);
});

test("balance: heavy items on one side tip the bag, low heavy items aren't top-heavy", () => {
  const left = computeBalance(4, 5, [{ r: 3, c: 0, rule: "HEAVY" }, { r: 3, c: 1, rule: "HEAVY" }]);
  assert.ok(left.shift < 0 && !left.isBalanced);
  const even = computeBalance(4, 5, [{ r: 3, c: 0, rule: "HEAVY" }, { r: 3, c: 4, rule: "HEAVY" }]);
  assert.equal(even.shift, 0);
  assert.ok(even.isBalanced);
  const high = computeBalance(4, 5, [{ r: 0, c: 2, rule: "HEAVY" }]);
  assert.ok(high.topHeavy && !high.isBalanced);
});
