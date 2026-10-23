// Mode 1 content (themes, levels, daily routes) and the solvable-bag generator.
// Pure: no DOM access, so it runs in the browser and under Node tests.
import { DIRS, mulberry32, hashStr, rotateMatrix, todayKey } from "./util.js";
import { computeBalance } from "./packing.js";

// Muted item colours from the site's illustration palette. Rule items share a colour so the rule
// reads at a glance (sand = TSA top row, slate = heavy, mist = fragile); flexible items take the rest.
const RULE_COLORS = { TOP_ROW: "#E2D3B2", BOTTOM_HEAVY: "#8FA3A6", HEAVY: "#8FA3A6", FRAGILE: "#C9DCDA" };
const PALETTE = ["#D8C3AE", "#C5CFB4", "#B9C7D6", "#D9D2C1", "#C8B9A6", "#BFD0C4", "#D3C4CF", "#CBBFA1"];
const BONUS_COLOR = "#A7D3D6";

export const RULE_META = {
  TOP_ROW: { label: "TSA: Top Row", desc: "TSA quick-access: must touch the top zipper row." },
  BOTTOM_HEAVY: { label: "Bottom + Heavy", desc: "Heavy! Must touch the bottom row and can't touch Fragile items." },
  HEAVY: { label: "Heavy", desc: "Heavy! Can't touch Fragile items — keep it low for balance." },
  FRAGILE: { label: "Fragile", desc: "Fragile! Cannot touch Heavy items." },
  NONE: { label: "Flexible", desc: "Squishy — fits anywhere." }
};

export const GENERIC = {
  top: [["3-1-1 Liquids", "🧴"], ["Laptop", "💻"], ["Tablet", "📱"], ["Toiletry Kit", "🪥"], ["Camera", "📷"]],
  bottomHeavy: [["Hiking Boots", "🥾"], ["Sneakers", "👟"], ["Book Stack", "📚"]],
  heavy: [["Hair Dryer", "💨"], ["Power Bank", "🔋"], ["Travel Iron", "🧺"]],
  fragile: [["Sunglasses", "🕶️"], ["Perfume", "🌸"], ["Snowglobe", "🔮"], ["Wine Glass", "🍷"]],
  filler: [["Rolled Tees", "👕"], ["Jeans", "👖"], ["Socks", "🧦"], ["Hoodie", "🧥"], ["Pajamas", "🩳"], ["Scarf", "🧣"], ["Cap", "🧢"], ["Snacks", "🥨"], ["Headphones", "🎧"], ["Charger Cables", "🔌"], ["Sleep Mask", "😴"], ["Paperback", "📖"], ["Gloves", "🧤"]]
};

export const THEMES = {
  weekend: {
    top: [["Sunscreen", "🧴"], ["Laptop", "💻"]],
    bottomHeavy: [["Sneakers", "👟"]],
    heavy: [["Skate Trucks", "🛹"]],
    fragile: [["Sunglasses", "🕶️"], ["Snowglobe", "🔮"]],
    filler: [["Rolled Tees", "👕"], ["Denim Jeans", "👖"], ["Giant Toblerone", "🍫"], ["Hoodie", "🧥"]],
    curveball: ["Neck Pillow", "🥐"]
  },
  island: {
    top: [["Reef Sunscreen", "🧴"], ["GoPro", "📷"]],
    bottomHeavy: [["Snorkel Fins", "🤿"]],
    heavy: [["Coconut Haul", "🥥"]],
    fragile: [["Seashell Lei", "🐚"], ["Mai Tai Glasses", "🍹"]],
    filler: [["Aloha Shirt", "👕"], ["Swim Trunks", "🩳"], ["Beach Towel", "🏖️"], ["Flip-Flops", "🩴"], ["Sun Hat", "👒"]],
    curveball: ["Ukulele", "🪕"]
  },
  london: {
    top: [["Work Laptop", "💻"], ["Cologne Bag", "🧴"]],
    bottomHeavy: [["Dress Boots", "🥾"]],
    heavy: [["Hardcover Books", "📚"]],
    fragile: [["Fine Porcelain", "☕"]],
    filler: [["Folded Blazer", "🧥"], ["London Umbrella", "☂️"], ["Dress Shirt", "👔"], ["Bagels", "🥯"]],
    curveball: ["Duty-Free Bag", "🛍️"]
  },
  marrakech: {
    top: [["Argan Oil", "🧴"], ["Phone Kit", "📱"]],
    bottomHeavy: [["Leather Boots", "🥾"]],
    heavy: [["Brass Lantern", "🏮"]],
    fragile: [["Tea Glasses", "🍵"], ["Ceramic Tagine", "🏺"]],
    filler: [["Linen Shirt", "👕"], ["Silk Scarf", "🧣"], ["Babouches", "🥿"], ["Spice Tins", "🌶️"], ["Woven Rug", "🧶"]],
    curveball: ["Mint Tea Tin", "🫖"]
  },
  hokkaido: {
    top: [["K-Beauty Kit", "🧴"], ["Hand Cream", "🧼"]],
    bottomHeavy: [["Ski Boots", "🎿"]],
    heavy: [["Snowboard Bindings", "🏂"]],
    fragile: [["Snow Goggles", "🥽"], ["Cup Ramen x4", "🍜"]],
    filler: [["Down Puffer", "🧥"], ["Thermal Socks", "🧦"], ["Mittens", "🧤"], ["Fleece", "🧶"]],
    curveball: ["Hand Warmers", "🔥"]
  },
  sydney: {
    top: [["SPF 50+", "🧴"], ["E-Reader", "📱"]],
    bottomHeavy: [["Hiking Boots", "🥾"]],
    heavy: [["Lens Kit", "📸"]],
    fragile: [["Matcha Set", "🍵"], ["Sake Bottle", "🍶"]],
    filler: [["Board Shorts", "🩳"], ["Rash Guard", "👕"], ["Wide-Brim Hat", "👒"], ["Kangaroo Plush", "🦘"], ["Rain Shell", "🧥"]],
    curveball: ["Tim Tams", "🍫"]
  }
};

// Hand-tuned levels. Layouts are generated from the seed, so every bag has a guaranteed 100%-full solution.
export const LEVELS = [
  { id: "sfo-lax", route: "SFO ✈ LAX", dest: "LAX", subtitle: "Gate B14 • Weekend Carry-On", rows: 4, cols: 5, blocked: [], rules: { top: 1, bottomHeavy: 0, heavy: 1, fragile: 1 }, seed: 101, theme: "weekend" },
  { id: "lax-hnl", route: "LAX ✈ HNL", dest: "HNL", subtitle: "Gate 72A • Island Hopper", rows: 4, cols: 6, blocked: [], rules: { top: 1, bottomHeavy: 1, heavy: 0, fragile: 1 }, seed: 202, theme: "island" },
  { id: "jfk-lhr", route: "JFK ✈ LHR", dest: "LHR", subtitle: "Gate C22 • Red-Eye Business Trip", rows: 5, cols: 6, blocked: [[4, 0], [4, 5]], rules: { top: 2, bottomHeavy: 1, heavy: 0, fragile: 1 }, seed: 303, theme: "london" },
  { id: "lhr-rak", route: "LHR ✈ RAK", dest: "RAK", subtitle: "Gate A10 • Souk Shopping Spree", rows: 5, cols: 6, blocked: [[4, 2], [4, 3]], rules: { top: 1, bottomHeavy: 1, heavy: 1, fragile: 2 }, seed: 404, theme: "marrakech" },
  { id: "icn-cts", route: "ICN ✈ CTS", dest: "CTS", subtitle: "Gate A08 • Hokkaido Winter Escape", rows: 5, cols: 7, blocked: [[4, 0], [4, 6], [0, 3]], rules: { top: 2, bottomHeavy: 1, heavy: 1, fragile: 2 }, seed: 505, theme: "hokkaido" },
  { id: "hnd-syd", route: "HND ✈ SYD", dest: "SYD", subtitle: "Gate 110 • Down Under Long-Haul", rows: 6, cols: 7, blocked: [[5, 0], [5, 6], [0, 0], [0, 6], [2, 3]], rules: { top: 2, bottomHeavy: 1, heavy: 1, fragile: 2 }, seed: 606, theme: "sydney" }
];

const DAILY_ROUTES = [
  ["SEA ✈ ANC", "ANC", "hokkaido"], ["MIA ✈ SJU", "SJU", "island"], ["BOS ✈ DUB", "DUB", "london"],
  ["CDG ✈ CMN", "CMN", "marrakech"], ["DEN ✈ YYC", "YYC", "hokkaido"], ["SFO ✈ SEA", "SEA", "weekend"],
  ["NRT ✈ BNE", "BNE", "sydney"], ["ATL ✈ CUN", "CUN", "island"], ["ORD ✈ AUS", "AUS", "weekend"]
];

const DAILY_LAYOUTS = [
  { rows: 5, cols: 6, blocked: [[4, 0], [4, 5]] },
  { rows: 5, cols: 6, blocked: [[4, 2], [4, 3]] },
  { rows: 5, cols: 7, blocked: [[4, 0], [4, 6], [0, 3]] },
  { rows: 6, cols: 6, blocked: [[5, 0], [5, 5], [2, 2], [2, 3]] }
];

export function dailyConfig(key = todayKey()) {
  const seed = hashStr("daily-" + key);
  const rng = mulberry32(seed);
  const [route, dest, theme] = DAILY_ROUTES[Math.floor(rng() * DAILY_ROUTES.length)];
  const layout = DAILY_LAYOUTS[Math.floor(rng() * DAILY_LAYOUTS.length)];
  return {
    id: "daily-" + key, dateKey: key, route, dest, theme, seed: seed % 100000,
    subtitle: `Daily bag • ${key}`,
    ...layout,
    rules: { top: 2, bottomHeavy: 1, heavy: 1, fragile: 2 },
    isDaily: true
  };
}

/* Solvable bag generator: partition the free cells into polyominoes (= the solution),
   then dress each piece up as a themed item with a packing rule. */
function partitionGrid(rows, cols, blockedSet, rng) {
  const sizes = [2, 3, 3, 4, 4, 4, 5, 5];
  for (let tries = 0; tries < 80; tries++) {
    const owner = Array.from({ length: rows }, () => Array(cols).fill(-1));
    blockedSet.forEach(k => { const [r, c] = k.split(",").map(Number); owner[r][c] = -2; });
    const pieces = [];
    let failed = false;

    for (let r = 0; r < rows && !failed; r++) {
      for (let c = 0; c < cols && !failed; c++) {
        if (owner[r][c] !== -1) continue;
        const id = pieces.length;
        const target = sizes[Math.floor(rng() * sizes.length)];
        const cells = [[r, c]];
        owner[r][c] = id;
        while (cells.length < target) {
          const cand = [];
          for (const [cr, cc] of cells) {
            for (const [dr, dc] of DIRS) {
              const nr = cr + dr, nc = cc + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && owner[nr][nc] === -1) cand.push([nr, nc]);
            }
          }
          if (!cand.length) break;
          const [nr, nc] = cand[Math.floor(rng() * cand.length)];
          owner[nr][nc] = id;
          cells.push([nr, nc]);
        }

        if (cells.length === 1) {
          // Isolated single cell: merge into a neighbouring piece
          const opts = [];
          for (const [dr, dc] of DIRS) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && owner[nr][nc] >= 0 && owner[nr][nc] !== id && pieces[owner[nr][nc]].length < 6) {
              opts.push(owner[nr][nc]);
            }
          }
          if (!opts.length) { failed = true; break; }
          const pid = opts[Math.floor(rng() * opts.length)];
          owner[r][c] = pid;
          pieces[pid].push([r, c]);
          continue;
        }
        pieces.push(cells);
      }
    }
    if (!failed && pieces.length >= 4) return pieces;
  }
  return null;
}

function assignRoles(pieces, cfg, rng) {
  const rows = cfg.rows;
  const centerRow = (rows - 1) / 2;
  const info = pieces.map((cells, i) => ({
    i, cells, size: cells.length, role: null,
    top: cells.some(([r]) => r === 0),
    bottom: cells.some(([r]) => r === rows - 1),
    avgRow: cells.reduce((s, [r]) => s + r, 0) / cells.length
  }));
  const ownerOf = new Map();
  info.forEach(p => p.cells.forEach(([r, c]) => ownerOf.set(r + "," + c, p.i)));
  const adj = info.map(p => {
    const s = new Set();
    p.cells.forEach(([r, c]) => DIRS.forEach(([dr, dc]) => {
      const o = ownerOf.get((r + dr) + "," + (c + dc));
      if (o !== undefined && o !== p.i) s.add(o);
    }));
    return s;
  });
  const pick = (filter) => {
    const opts = info.filter(p => !p.role && filter(p));
    return opts.length ? opts[Math.floor(rng() * opts.length)] : null;
  };

  const bonus = pick(p => p.size >= 2 && p.size <= 3) || pick(p => p.size === 4);
  if (!bonus) return null;
  bonus.role = "BONUS";

  const R = cfg.rules;
  for (let k = 0; k < R.top; k++) { const p = pick(q => q.top); if (!p) return null; p.role = "TOP_ROW"; }
  for (let k = 0; k < R.bottomHeavy; k++) { const p = pick(q => q.bottom); if (!p) return null; p.role = "BOTTOM_HEAVY"; }
  for (let k = 0; k < R.heavy; k++) { const p = pick(q => q.avgRow >= centerRow); if (!p) return null; p.role = "HEAVY"; }
  const heavyRole = (p) => p.role === "HEAVY" || p.role === "BOTTOM_HEAVY";
  for (let k = 0; k < R.fragile; k++) {
    const p = pick(q => ![...adj[q.i]].some(j => heavyRole(info[j])));
    if (!p) return null;
    p.role = "FRAGILE";
  }
  info.forEach(p => { if (!p.role) p.role = "NONE"; });

  const solutionCells = info.flatMap(p => p.cells.map(([r, c]) => ({ r, c, rule: p.role === "BONUS" ? "NONE" : p.role })));
  const bal = computeBalance(rows, cfg.cols, solutionCells);
  return { info, ok: bal.abs <= 16 && !bal.topHeavy, score: bal.abs + (bal.topHeavy ? 100 : 0) };
}

function cellsToShape(cells) {
  const minR = Math.min(...cells.map(c => c[0])), maxR = Math.max(...cells.map(c => c[0]));
  const minC = Math.min(...cells.map(c => c[1])), maxC = Math.max(...cells.map(c => c[1]));
  const shape = Array.from({ length: maxR - minR + 1 }, () => Array(maxC - minC + 1).fill(0));
  cells.forEach(([r, c]) => { shape[r - minR][c - minC] = 1; });
  return shape;
}

export function generateBag(cfg) {
  const blockedSet = new Set(cfg.blocked.map(([r, c]) => r + "," + c));
  // Keep the most balanced solution so ⭐⭐⭐ stays reachable even if no attempt is perfectly balanced
  let best = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const rng = mulberry32(cfg.seed * 977 + attempt * 7919);
    const pieces = partitionGrid(cfg.rows, cfg.cols, blockedSet, rng);
    if (!pieces) continue;
    const bag = assignRoles(pieces, cfg, rng);
    if (!bag) continue;
    if (!best || bag.score < best.score) best = bag;
    if (bag.ok) break;
  }
  if (!best) {
    // Fallback with relaxed rules if custom blocked cells constrained role assignment
    const relaxedCfg = { ...cfg, rules: { top: 1, bottomHeavy: 0, heavy: 0, fragile: 0 } };
    for (let attempt = 0; attempt < 80; attempt++) {
      const rng = mulberry32(cfg.seed * 977 + attempt * 7919);
      const pieces = partitionGrid(cfg.rows, cfg.cols, blockedSet, rng);
      if (!pieces) continue;
      const bag = assignRoles(pieces, relaxedCfg, rng);
      if (bag) { best = bag; break; }
    }
  }
  // Layout can't be partitioned at all (e.g. a free cell walled in by blocked cells)
  if (!best) return null;
  return buildItems(best, cfg);
}

function buildItems(bag, cfg) {
  const theme = THEMES[cfg.theme] || THEMES.weekend;
  const rng = mulberry32(cfg.seed * 31 + 7);
  const used = new Set();
  const take = (pool, fallback) => {
    for (const src of [pool || [], fallback || [], GENERIC.filler]) {
      const avail = src.filter(([n]) => !used.has(n));
      if (avail.length) {
        const it = avail[Math.floor(rng() * avail.length)];
        used.add(it[0]);
        return it;
      }
    }
    const n = `Mystery Box ${used.size + 1}`;
    used.add(n);
    return [n, "📦"];
  };

  const colorOffset = Math.floor(rng() * PALETTE.length);
  const items = [];
  let bonus = null;

  bag.info.forEach((p, idx) => {
    let def;
    switch (p.role) {
      case "TOP_ROW": def = take(theme.top, GENERIC.top); break;
      case "BOTTOM_HEAVY": def = take(theme.bottomHeavy, GENERIC.bottomHeavy); break;
      case "HEAVY": def = take(theme.heavy, GENERIC.heavy); break;
      case "FRAGILE": def = take(theme.fragile, GENERIC.fragile); break;
      case "BONUS": def = theme.curveball; break;
      default: def = take(theme.filler, GENERIC.filler);
    }
    let shape = cellsToShape(p.cells);
    const rot = Math.floor(rng() * 4);
    for (let k = 0; k < rot; k++) shape = rotateMatrix(shape);

    const isBonus = p.role === "BONUS";
    const rule = isBonus ? "NONE" : p.role;
    const item = {
      id: isBonus ? "bonus" : `item${idx}`,
      name: def[0],
      emoji: def[1],
      color: isBonus ? BONUS_COLOR : RULE_COLORS[rule] || PALETTE[(colorOffset + idx) % PALETTE.length],
      rule,
      ruleLabel: isBonus ? "+500 MI Bonus" : RULE_META[rule].label,
      desc: isBonus ? "Gate Agent Curveball! Squeeze it in to zip the bag 100% full." : RULE_META[rule].desc,
      shape,
      solCells: p.cells.map(c => [...c]),
      isBonus
    };
    if (isBonus) bonus = item; else items.push(item);
  });

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return { items, bonus };
}
