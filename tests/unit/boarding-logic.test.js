import { test } from "node:test";
import assert from "node:assert/strict";
import { isSolved, neighbors, scramble, slideLine, shortestSolution, solvedTiles } from "../../js/boarding-logic.js";
import { mulberry32 } from "../helpers.js";

// Reference answer: plain breadth-first search over single-passenger moves
function bfs(start) {
  const goal = solvedTiles().join();
  if (start.join() === goal) return 0;
  const seen = new Set([start.join()]);
  let frontier = [start];
  for (let depth = 1; frontier.length; depth++) {
    const next = [];
    for (const cur of frontier) {
      const e = cur.indexOf(0);
      for (const nb of neighbors(e)) {
        const t = [...cur];
        [t[e], t[nb]] = [t[nb], t[e]];
        const key = t.join();
        if (key === goal) return depth;
        if (!seen.has(key)) { seen.add(key); next.push(t); }
      }
    }
    frontier = next;
  }
  return -1;
}

test("shortestSolution matches breadth-first search", () => {
  const rng = mulberry32(42);
  for (let i = 0; i < 60; i++) {
    const t = scramble(200, rng);
    assert.equal(shortestSolution(t), bfs(t), `mismatch for ${t.join()}`);
  }
});

test("shortestSolution: solved is 0, one move away is 1", () => {
  assert.equal(shortestSolution(solvedTiles()), 0);
  assert.equal(shortestSolution([1, 2, 3, 4, 5, 6, 7, 0, 8]), 1);
});

test("scramble never returns a solved line", () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 200; i++) assert.equal(isSolved(scramble(2, rng)), false);
});

test("tapping a passenger slides the whole line toward the gap", () => {
  // gap at top-left; tapping the end of the top row slides two passengers left
  const slid = slideLine([0, 1, 2, 3, 4, 5, 6, 7, 8], 2);
  assert.deepEqual(slid, { tiles: [1, 2, 0, 3, 4, 5, 6, 7, 8], moves: 2 });
  // vertical slide
  assert.deepEqual(slideLine([0, 1, 2, 3, 4, 5, 6, 7, 8], 6).tiles, [3, 1, 2, 6, 4, 5, 0, 7, 8]);
});

test("passengers out of line with the gap can't move", () => {
  assert.equal(slideLine([0, 1, 2, 3, 4, 5, 6, 7, 8], 4), null);
  assert.equal(slideLine([0, 1, 2, 3, 4, 5, 6, 7, 8], 0), null);
});
