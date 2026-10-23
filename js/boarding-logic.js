// Boarding Group Shuffle rules: an n×n sliding puzzle (3×3 or 4×4) stored as a flat array, 0 = the open spot.
// Pure, so the solver and slide rules can be unit-tested.

export const SHUFFLE_N = 3;

export const solvedTiles = (n = SHUFFLE_N) => Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? 0 : i + 1));
export const isSolved = (t) => t.every((v, i) => (i === t.length - 1 ? v === 0 : v === i + 1));
export const sizeOf = (t) => Math.round(Math.sqrt(t.length));

export function neighbors(idx, n = SHUFFLE_N) {
  const r = Math.floor(idx / n), c = idx % n;
  const res = [];
  if (r > 0) res.push(idx - n);
  if (r < n - 1) res.push(idx + n);
  if (c > 0) res.push(idx - 1);
  if (c < n - 1) res.push(idx + 1);
  return res;
}

// Random walk from the solved line (never stepping straight back), so the result is always solvable
export function scramble(steps, rng = Math.random, n = SHUFFLE_N) {
  const t = solvedTiles(n);
  let empty = t.length - 1, prev = -1;
  do {
    for (let k = 0; k < steps; k++) {
      const nb = neighbors(empty, n).filter(i => i !== prev);
      const pick = nb[Math.floor(rng() * nb.length)];
      [t[empty], t[pick]] = [t[pick], t[empty]];
      prev = empty;
      empty = pick;
    }
  } while (isSolved(t));
  return t;
}

// Tapping passenger v slides the whole line between v and the open spot.
// Returns { tiles, moves } (moves = passengers stepped), or null if v isn't in line with the gap.
export function slideLine(tiles, v) {
  const n = sizeOf(tiles);
  const idx = tiles.indexOf(v);
  const e = tiles.indexOf(0);
  const ir = Math.floor(idx / n), ic = idx % n;
  const er = Math.floor(e / n), ec = e % n;
  if (idx < 0 || v === 0 || (ir !== er && ic !== ec)) return null;
  const t = [...tiles];
  const step = ir === er ? (ic > ec ? 1 : -1) : (ir > er ? n : -n);
  let cur = e, moves = 0;
  while (cur !== idx) {
    const nxt = cur + step;
    t[cur] = t[nxt];
    t[nxt] = 0;
    cur = nxt;
    moves++;
  }
  return { tiles: t, moves };
}

// Fewest single-passenger moves to solve, as the list of passengers to tap one step each.
// IDA* with a Manhattan-distance heuristic: exact, and fast for the scramble depths the game uses.
// With maxNodes set it gives up (returns null) once it has expanded that many positions.
export function solve(start, maxNodes = Infinity) {
  const N = sizeOf(start);
  const t = [...start];
  const dist = (idx, v) => Math.abs(Math.floor(idx / N) - Math.floor((v - 1) / N)) + Math.abs((idx % N) - ((v - 1) % N));
  const path = [];
  let empty = t.indexOf(0);
  let found = false;
  let nodes = 0;

  const search = (g, bound, prev, h) => {
    if (g + h > bound) return g + h;
    if (++nodes > maxNodes) return Infinity;
    if (h === 0) { found = true; return -1; }
    let min = Infinity;
    for (const nb of neighbors(empty, N)) {
      if (nb === prev) continue;
      const v = t[nb], from = empty;
      const nh = h - dist(nb, v) + dist(from, v);
      t[from] = v; t[nb] = 0; empty = nb;
      path.push(v);
      const res = search(g + 1, bound, from, nh);
      if (res === -1) return -1;
      path.pop();
      t[nb] = v; t[from] = 0; empty = from;
      if (res < min) min = res;
    }
    return min;
  };

  const h0 = t.reduce((sum, v, i) => sum + (v ? dist(i, v) : 0), 0);
  for (let bound = h0; !found;) {
    bound = search(0, bound, -1, h0);
    if (nodes > maxNodes) return null;
  }
  return path;
}

export const shortestSolution = (start) => solve(start).length;
