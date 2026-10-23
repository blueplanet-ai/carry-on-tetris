// Packing rules shared by the generator and the game: centre-of-gravity balance,
// where a tapped shape anchors, and whether a placement obeys the TSA / weight rules.
// Pure: grids are passed in, nothing touches the DOM.
import { DIRS } from "./util.js";

export function computeBalance(rows, cols, cells) {
  const centerCol = (cols - 1) / 2;
  const centerRow = (rows - 1) / 2;
  let total = 0, torque = 0, heavyCount = 0, heavyRowSum = 0;
  cells.forEach(({ r, c, rule }) => {
    const heavy = rule === "HEAVY" || rule === "BOTTOM_HEAVY";
    const mass = heavy ? 2.8 : rule === "FRAGILE" ? 0.8 : 1.2;
    total += mass;
    torque += mass * (c - centerCol);
    if (heavy) { heavyCount++; heavyRowSum += r; }
  });
  const maxTorque = 3 * cols;
  const shift = Math.max(-46, Math.min(46, (torque / maxTorque) * 46));
  const abs = Math.abs(shift);
  const topHeavy = heavyCount > 0 && heavyRowSum / heavyCount < centerRow;
  return { total, shift, abs, topHeavy, heavyCount, isBalanced: abs <= 20 && !topHeavy, isTipping: abs > 34 };
}

// Anchor the shape so the tapped cell is the filled cell closest to the shape's centre
export function placementBase(item, r, c) {
  const h = item.shape.length, w = item.shape[0].length;
  const cr = (h - 1) / 2, cc = (w - 1) / 2;
  let best = null, bestD = Infinity;
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      if (!item.shape[i][j]) continue;
      const d = (i - cr) ** 2 + (j - cc) ** 2;
      if (d < bestD - 1e-9) { bestD = d; best = [i, j]; }
    }
  }
  return [r - best[0], c - best[1]];
}

// grid: rows of null (empty), "BLOCKED" or an item id; getItem: id -> item (for neighbour rules)
export function validatePlacement(item, baseR, baseC, { grid, getItem }) {
  const rows = grid.length, cols = grid[0].length;
  const occupiedCells = [];
  const previewCells = [];

  for (let r = 0; r < item.shape.length; r++) {
    for (let c = 0; c < item.shape[0].length; c++) {
      if (item.shape[r][c] !== 1) continue;
      const tr = baseR + r, tc = baseC + c;
      const inside = tr >= 0 && tr < rows && tc >= 0 && tc < cols;
      if (inside) previewCells.push([tr, tc]);
      if (!inside) return { valid: false, reason: "Sticks outside the suitcase!", previewCells };
      if (grid[tr][tc] === "BLOCKED") return { valid: false, reason: "That's the suitcase frame — nothing fits there!", previewCells };
      if (grid[tr][tc] !== null) return { valid: false, reason: "Space is already occupied!", previewCells };
      occupiedCells.push([tr, tc]);
    }
  }

  if (item.rule === "TOP_ROW" && !occupiedCells.some(([r]) => r === 0)) {
    return { valid: false, reason: `TSA Rule: ${item.name} must touch the Top Row!`, previewCells: occupiedCells };
  }
  if (item.rule === "BOTTOM_HEAVY" && !occupiedCells.some(([r]) => r === rows - 1)) {
    return { valid: false, reason: `Packing Rule: Heavy ${item.name} must sit on the Bottom Row!`, previewCells: occupiedCells };
  }

  const isHeavy = (it) => it && (it.rule === "HEAVY" || it.rule === "BOTTOM_HEAVY");
  const isFragile = (it) => it && it.rule === "FRAGILE";
  for (const [r, c] of occupiedCells) {
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nid = grid[nr][nc];
      if (!nid || nid === "BLOCKED") continue;
      const neighbor = getItem(nid);
      if ((isFragile(item) && isHeavy(neighbor)) || (isHeavy(item) && isFragile(neighbor))) {
        return {
          valid: false,
          reason: `Careful! Fragile items can't touch Heavy ${isHeavy(item) ? item.name : neighbor.name}!`,
          previewCells: occupiedCells
        };
      }
    }
  }
  return { valid: true, cells: occupiedCells, previewCells: occupiedCells };
}
