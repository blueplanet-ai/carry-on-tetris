// Small shared helpers. Everything here except $ and toast is pure, so it also runs under Node.

export const $ = (id) => document.getElementById(id);
export const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const pad2 = (n) => String(n).padStart(2, "0");
export const popcount = (m) => ((m & 1) ? 1 : 0) + ((m & 2) ? 1 : 0) + ((m & 4) ? 1 : 0);
export const starString = (m) => "★".repeat(popcount(m)) + "☆".repeat(3 - popcount(m));

export function rotateMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const res = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) res[c][rows - 1 - r] = matrix[r][c];
  }
  return res;
}

// Local calendar date, e.g. "2026-10-23" (the daily bag changes at the player's midnight)
export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

let toastTimer = null;
export function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
}
