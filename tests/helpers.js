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

// Shortest list of passengers to tap (one step each) to solve a Boarding line-up (3×3 or 4×4)
export async function boardingSolutionTaps(tiles) {
  const { solve } = await import("../js/boarding-logic.js");
  return solve(tiles);
}
