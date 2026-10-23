// Shared test helpers: work out how to pack a generated item into its solution cells.
import { rotateMatrix } from "../js/util.js";
import { placementBase } from "../js/packing.js";

export const cellsOf = (shape) => shape.flatMap((row, i) => row.flatMap((v, j) => (v ? [[i, j]] : [])));

export function normCells(cells) {
  const mr = Math.min(...cells.map(c => c[0])), mc = Math.min(...cells.map(c => c[1]));
  return cells.map(([r, c]) => `${r - mr},${c - mc}`).sort().join("|");
}

// How many clockwise rotations turn item.shape into the shape of its solution cells, or -1
export function rotationsToSolution(item) {
  let shape = item.shape;
  for (let k = 0; k < 4; k++) {
    if (normCells(cellsOf(shape)) === normCells(item.solCells)) return k;
    shape = rotateMatrix(shape);
  }
  return -1;
}

// The rotations to apply and the grid cell to tap so the item lands exactly on its solution
export function solutionMove(item) {
  const rotations = rotationsToSolution(item);
  let shape = item.shape;
  for (let k = 0; k < rotations; k++) shape = rotateMatrix(shape);
  const [offR, offC] = placementBase({ shape }, 0, 0); // = minus the anchor cell inside the shape
  const minR = Math.min(...item.solCells.map(c => c[0])), minC = Math.min(...item.solCells.map(c => c[1]));
  return { rotations, shape, tap: [minR - offR, minC - offC], base: [minR, minC] };
}

// Seeded RNG for repeatable random tests
export { mulberry32 } from "../js/util.js";

// Shortest list of passengers to tap (one step each) to solve a Boarding line-up
export async function boardingSolutionTaps(tiles) {
  const { neighbors, isSolved } = await import("../js/boarding-logic.js");
  const prev = new Map([[tiles.join(), null]]);
  let frontier = [tiles];
  while (frontier.length) {
    const next = [];
    for (const cur of frontier) {
      if (isSolved(cur)) {
        const taps = [];
        for (let k = cur.join(); prev.get(k); k = prev.get(k).from) taps.unshift(prev.get(k).tap);
        return taps;
      }
      const e = cur.indexOf(0);
      for (const nb of neighbors(e)) {
        const t = [...cur];
        [t[e], t[nb]] = [t[nb], t[e]];
        if (!prev.has(t.join())) { prev.set(t.join(), { from: cur.join(), tap: cur[nb] }); next.push(t); }
      }
    }
    frontier = next;
  }
  return null;
}
