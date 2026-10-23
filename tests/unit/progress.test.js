import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS } from "../../js/generator.js";
import { TRIVIA_ROUNDS } from "../../js/data/trivia-rounds.js";
import { canSkipLevel, isLevelUnlocked, isPerfect, isRoundUnlocked, roundsUnlockedBy } from "../../js/progress.js";

const progress = (over = {}) => ({ bagStars: {}, skippedBags: {}, triviaSolved: {}, ...over });

test("bags open in order once the previous bag is packed or skipped", () => {
  assert.equal(isLevelUnlocked(LEVELS, 0, progress()), true);
  assert.equal(isLevelUnlocked(LEVELS, 1, progress()), false);
  assert.equal(isLevelUnlocked(LEVELS, 1, progress({ bagStars: { "sfo-lax": 1 } })), true);
  assert.equal(isLevelUnlocked(LEVELS, 1, progress({ bagStars: { "sfo-lax": 2 } })), false); // balance alone isn't packing
  assert.equal(isLevelUnlocked(LEVELS, 1, progress({ skippedBags: { "sfo-lax": true } })), true);
});

test("only unpacked, unskipped bags with a next bag can be skipped", () => {
  assert.equal(canSkipLevel(LEVELS, 0, progress()), true);
  assert.equal(canSkipLevel(LEVELS, 0, progress({ bagStars: { "sfo-lax": 1 } })), false);
  assert.equal(canSkipLevel(LEVELS, 0, progress({ skippedBags: { "sfo-lax": true } })), false);
  assert.equal(canSkipLevel(LEVELS, LEVELS.length - 1, progress()), false); // nothing after the last bag
});

test("perfect means all three stars", () => {
  assert.equal(isPerfect(7), true);
  assert.equal(isPerfect(5), false);
  assert.equal(isPerfect(0), false);
});

test("flights open when their bag is packed — not skipped — and routed flights stay open", () => {
  const lax = TRIVIA_ROUNDS.find(r => r.id === "lax-mex");
  assert.equal(isRoundUnlocked(lax, progress()), false);
  assert.equal(isRoundUnlocked(lax, progress({ skippedBags: { "sfo-lax": true } })), false);
  assert.equal(isRoundUnlocked(lax, progress({ bagStars: { "sfo-lax": 1 } })), true);
  assert.equal(isRoundUnlocked(lax, progress({ triviaSolved: { "lax-mex": true } })), true);
});

test("trivia unlock data is consistent with the bags", () => {
  const ids = new Set(LEVELS.map(lv => lv.id));
  const starters = TRIVIA_ROUNDS.filter(r => !r.unlockBag);
  assert.ok(starters.length >= 2, "need at least two flights open from the start");
  for (const r of TRIVIA_ROUNDS) if (r.unlockBag) assert.ok(ids.has(r.unlockBag), `${r.id} unlocks from unknown bag ${r.unlockBag}`);
  for (const lv of LEVELS) {
    // a connected trip continues with the flight leaving this bag's destination, so packing it must open that flight
    const onward = TRIVIA_ROUNDS.find(r => r.origin === lv.dest);
    assert.ok(onward, `no trivia flight leaves ${lv.dest}`);
    assert.equal(onward.unlockBag, lv.id, `${onward.id} should unlock with ${lv.id}`);
    assert.ok(roundsUnlockedBy(TRIVIA_ROUNDS, lv.id).length >= 1);
  }
});
