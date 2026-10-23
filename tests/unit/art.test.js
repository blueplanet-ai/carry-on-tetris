import { test } from "node:test";
import assert from "node:assert/strict";
import { GENERIC, THEMES } from "../../js/generator.js";
import { hasArt, itemArt, paxArt } from "../../js/art.js";

test("every packing item has its own drawing", () => {
  const names = [
    ...Object.values(GENERIC).flat().map(([name]) => name),
    ...Object.values(THEMES).flatMap(t => [...t.top, ...t.bottomHeavy, ...t.heavy, ...t.fragile, ...t.filler, t.curveball]).map(([name]) => name)
  ];
  const missing = [...new Set(names)].filter(n => !hasArt(n));
  assert.deepEqual(missing, []);
  assert.match(itemArt("Mystery Box 3"), /<svg/, "unknown items fall back to a drawing");
});

test("all 15 boarding groups have a passenger drawing", () => {
  for (let g = 1; g <= 15; g++) assert.match(paxArt(g), /^<svg class="pax-art shirt-\d"/);
});
