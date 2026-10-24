// Builds js/data/route-maps.js: a small regional map per trivia flight for the "Route map" tip.
// Run after adding or changing a flight: `npm run build:maps` (needs the world-atlas dev dependency).
// Each map frames the route the first clue describes (heading + flight time), not the answer city.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { TRIVIA_ROUNDS } from "../js/data/trivia-rounds.js";

const require = createRequire(import.meta.url);
const land = (() => { const t = require("world-atlas/land-50m.json"); return feature(t, t.objects.land); })();
const OUT = new URL("../js/data/route-maps.js", import.meta.url);

// Origin airports [lat, lon]
const AIRPORTS = {
  SFO: [37.62, -122.38], JFK: [40.64, -73.78], LAX: [33.94, -118.41], LHR: [51.47, -0.45],
  FRA: [50.04, 8.56], SIN: [1.36, 103.99], HNL: [21.32, -157.92], CTS: [42.78, 141.69],
  RAK: [31.61, -8.04], SYD: [-33.94, 151.18], DXB: [25.25, 55.36], GRU: [-23.43, -46.47]
};

const W = 280, H = 140, KM_PER_HOUR = 800, TAXI_HOURS = 0.5, D = Math.PI / 180;

// Point reached from [lat, lon] flying `km` along a great circle with initial bearing `hdg`
function travel([lat, lon], hdg, km) {
  const d = km / 6371, t = hdg * D, p1 = lat * D;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t));
  const l2 = lon * D + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [p2 / D, l2 / D];
}

// Sutherland–Hodgman: clip a ring to a slightly padded viewBox so the file only holds what's on screen
function clip(ring) {
  const edges = [
    [(p) => p[0] >= -4, (a, b) => cut(a, b, 0, -4)], [(p) => p[0] <= W + 4, (a, b) => cut(a, b, 0, W + 4)],
    [(p) => p[1] >= -4, (a, b) => cut(a, b, 1, -4)], [(p) => p[1] <= H + 4, (a, b) => cut(a, b, 1, H + 4)]
  ];
  function cut(a, b, axis, v) {
    const t = (v - a[axis]) / (b[axis] - a[axis]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  let pts = ring;
  for (const [inside, meet] of edges) {
    const next = [];
    pts.forEach((p, i) => {
      const prev = pts[(i + pts.length - 1) % pts.length];
      if (inside(p)) { if (!inside(prev)) next.push(meet(prev, p)); next.push(p); }
      else if (inside(prev)) next.push(meet(prev, p));
    });
    pts = next;
    if (!pts.length) break;
  }
  return pts;
}

// Douglas–Peucker: keep only points that bend the line by more than `tol` viewBox units
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b], len = Math.hypot(bx - ax, by - ay);
    let far = -1, max = tol;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i];
      const dist = len ? Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / len : Math.hypot(x - ax, y - ay);
      if (dist > max) { max = dist; far = i; }
    }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// Compact SVG path: absolute start, then relative steps rounded to a tenth of a unit
function toPath(pts, close) {
  const r = (v) => Math.round(v * 10) / 10;
  let [px, py] = [r(pts[0][0]), r(pts[0][1])];
  let out = `M${px} ${py}l`;
  for (const [x, y] of pts.slice(1)) {
    const [nx, ny] = [r(x), r(y)];
    if (nx === px && ny === py) continue;
    out += ` ${r(nx - px)} ${r(ny - py)}`.replace(/(^|[^\d])0\./g, "$1.").replace(/-0\./g, "-.");
    [px, py] = [nx, ny];
  }
  return out.replace(/l /, "l").replace(/ -/g, "-") + (close ? "z" : "");
}

const area = (pts) => pts.reduce((sum, [x, y], i) => { const [nx, ny] = pts[(i + 1) % pts.length]; return sum + (x * ny - nx * y) / 2; }, 0);

function buildMap(round) {
  const from = AIRPORTS[round.origin];
  if (!from) throw new Error(`No coordinates for ${round.origin}; add it to AIRPORTS`);
  const km = (round.hours - TAXI_HOURS) * KM_PER_HOUR;
  const STEPS = 24;
  const route = Array.from({ length: STEPS + 1 }, (_, i) => travel(from, round.hdg, (km * i) / STEPS));
  const to = route[STEPS];

  // Equirectangular around the route's midpoint, scaled so the route fills under half the frame
  const lat0 = (from[0] + to[0]) / 2, lon0 = (from[1] + to[1]) / 2, c = Math.cos(lat0 * D);
  const k = Math.min((W * 0.42) / Math.max(Math.abs(to[1] - from[1]) * c, 1), (H * 0.5) / Math.max(Math.abs(to[0] - from[0]), 1), W / 30);
  const proj = ([lat, lon]) => [W / 2 + (lon - lon0) * c * k, H / 2 - (lat - lat0) * k];

  let landPath = "";
  for (const f of land.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) for (const ring of poly) {
      const pts = simplify(clip(ring.map(([lon, lat]) => proj([lat, lon]))), 0.45);
      // Skip specks: islands under ~0.15 square units don't read at this size
      if (pts.length > 2 && Math.abs(area(pts)) > 0.15) landPath += toPath(pts, true);
    }
  }
  const at = (p) => proj(p).map((v) => Math.round(v * 10) / 10);
  return { land: landPath, route: toPath(route.map(proj), false), from: at(from), to: at(to) };
}

const maps = Object.fromEntries(TRIVIA_ROUNDS.map((r) => [r.id, buildMap(r)]));
const body = Object.entries(maps).map(([id, m]) =>
  `  ${JSON.stringify(id)}: {\n    from: ${JSON.stringify(m.from)}, to: ${JSON.stringify(m.to)},\n    route: ${JSON.stringify(m.route)},\n    land: ${JSON.stringify(m.land)}\n  }`).join(",\n");
const src = `// Generated by scripts/build-route-maps.js — don't edit by hand; run \`npm run build:maps\`.
// Regional map per trivia flight in the flight plot's 280×140 viewBox (land: Natural Earth via world-atlas).
// from/to: origin and where the heading + flight time lead; route: the great-circle path between them.
export const ROUTE_MAPS = {
${body}
};
`;
const prev = (() => { try { return readFileSync(OUT, "utf8"); } catch { return ""; } })();
if (prev !== src) writeFileSync(OUT, src);
console.log(`route-maps.js: ${TRIVIA_ROUNDS.length} maps, ${(src.length / 1024).toFixed(1)} KB${prev === src ? " (unchanged)" : ""}`);
