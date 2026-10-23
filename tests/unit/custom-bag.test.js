import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeCustomHash, isPackable, makeCustomConfig, maxBlockedFor, parseCustomHash } from "../../js/custom-bag.js";

const base = { origin: "sfo", dest: "nrt", rows: 5, cols: 6, theme: "island", ruleKey: "strict", seed: 4242, blocked: [[4, 0], [4, 5]] };

test("share links round-trip", () => {
  const cfg = makeCustomConfig(base);
  const back = parseCustomHash(encodeCustomHash(cfg));
  for (const k of ["id", "origin", "dest", "rows", "cols", "theme", "ruleKey", "seed", "blocked", "rules"]) {
    assert.deepEqual(back[k], cfg[k], k);
  }
  assert.equal(cfg.route, "SFO ✈ NRT");
});

test("other hashes aren't custom bags", () => {
  assert.equal(parseCustomHash(""), null);
  assert.equal(parseCustomHash("#"), null);
  assert.equal(parseCustomHash("#section-2"), null);
  assert.equal(parseCustomHash("#custom=0&o=SFO"), null);
});

test("bad link values are clamped or replaced with defaults", () => {
  const cfg = parseCustomHash("#custom=1&o=<b>x&d=&r=99&c=-3&t=mars&k=evil&s=abc");
  assert.equal(cfg.origin, "BX");          // letters only
  assert.equal(cfg.dest, "NRT");
  assert.equal(cfg.rows, 6);
  assert.equal(cfg.cols, 5);
  assert.equal(cfg.theme, "weekend");
  assert.equal(cfg.ruleKey, "normal");
  assert.equal(cfg.seed, 777);
});

test("blocked cells are de-duplicated, kept in bounds, and capped", () => {
  const cfg = parseCustomHash("#custom=1&r=4&c=5&b=0.0_0.0_9.9_1.x_1.1");
  assert.deepEqual(cfg.blocked, [[0, 0], [1, 1]]);
  const all = Array.from({ length: 20 }, (_, i) => `${Math.floor(i / 5)}.${i % 5}`).join("_");
  assert.equal(parseCustomHash(`#custom=1&r=4&c=5&b=${all}`).blocked.length, maxBlockedFor(4, 5));
});

test("isPackable rejects layouts with a walled-in cell", () => {
  assert.equal(isPackable(makeCustomConfig(base)), true);
  assert.equal(isPackable(makeCustomConfig({ ...base, ruleKey: "light", blocked: [[0, 1], [1, 0]] })), false);
});
