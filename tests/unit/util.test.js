import { test } from "node:test";
import assert from "node:assert/strict";
import { hashStr, mulberry32, rotateMatrix, starString, todayKey } from "../../js/util.js";

test("rotating four times returns the original shape", () => {
  const shape = [[1, 0, 0], [1, 1, 1]];
  assert.deepEqual(rotateMatrix(shape), [[1, 1], [1, 0], [1, 0]]);
  assert.deepEqual(rotateMatrix(rotateMatrix(rotateMatrix(rotateMatrix(shape)))), shape);
});

test("seeded randomness is repeatable", () => {
  const a = mulberry32(99), b = mulberry32(99);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
  assert.equal(hashStr("daily-2026-10-23"), hashStr("daily-2026-10-23"));
  assert.notEqual(hashStr("daily-2026-10-23"), hashStr("daily-2026-10-24"));
});

test("dates and stars format as shown in the game", () => {
  assert.equal(todayKey(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(starString(0), "☆☆☆");
  assert.equal(starString(5), "★★☆");
  assert.equal(starString(7), "★★★");
});
