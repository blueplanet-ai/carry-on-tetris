import { test } from "node:test";
import assert from "node:assert/strict";
import { SAVE_VERSION, defaultSave, parseSave } from "../../js/save.js";

const defaults = () => defaultSave(1200);

test("missing or corrupted saves start fresh", () => {
  for (const text of [null, "", "not json", "[1,2]", "42", "null"]) {
    assert.deepEqual(parseSave(text, defaults()), defaults(), String(text));
  }
});

test("v0 saves (no version) are upgraded and repaired", () => {
  const s = parseSave(JSON.stringify({ miles: 5000, lifetime: 9000, bagStars: null, ownedSkins: "gold", triviaSolved: { "sfo-yvr": true } }), defaults());
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.miles, 5000);
  assert.equal(s.lifetime, 9000);
  assert.deepEqual(s.bagStars, {});
  assert.deepEqual(s.ownedSkins, ["classic"]);
  assert.deepEqual(s.triviaSolved, { "sfo-yvr": true });
  assert.equal(s.shuffleRewardDay, null); // new field filled in
});

test("current saves keep all their fields", () => {
  const saved = { ...defaults(), miles: 321, skin: "neon", ownedSkins: ["classic", "neon"], bagStars: { "sfo-lax": 7 } };
  assert.deepEqual(parseSave(JSON.stringify(saved), defaults()), saved);
});

test("v1 saves gain skippedBags", () => {
  const v1 = { ...defaults(), version: 1 };
  delete v1.skippedBags;
  const s = parseSave(JSON.stringify(v1), defaults());
  assert.equal(s.version, SAVE_VERSION);
  assert.deepEqual(s.skippedBags, {});
});

test("v2 saves gain empty records and keep their daily results", () => {
  const v2 = { ...defaults(), version: 2, dailyStats: { "2026-10-22": { moves: 8, balancePct: 94, stars: 3, mask: 7 } } };
  delete v2.bagRecords; delete v2.triviaRecords; delete v2.boardingRecords;
  const s = parseSave(JSON.stringify(v2), defaults());
  assert.equal(s.version, 3);
  assert.deepEqual(s.bagRecords, {});
  assert.deepEqual(s.triviaRecords, {});
  assert.deepEqual(s.boardingRecords, {});
  assert.deepEqual(s.dailyStats, v2.dailyStats);
});
