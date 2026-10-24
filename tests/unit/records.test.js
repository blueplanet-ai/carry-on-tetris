import { test } from "node:test";
import assert from "node:assert/strict";
import { recordPack, recordTrivia, recordBoarding, formatVsPar } from "../../js/records.js";

test("pack records rank stars, then moves, then balance", () => {
  let { record, best } = recordPack(undefined, { stars: 2, moves: 12, balancePct: 80 });
  assert.deepEqual(record, { stars: 2, moves: 12, balancePct: 80 });
  assert.equal(best, false, "a first run isn't a new best");

  ({ record, best } = recordPack(record, { stars: 3, moves: 20, balancePct: 70 }));
  assert.equal(best, true);
  assert.equal(record.stars, 3);

  ({ record, best } = recordPack(record, { stars: 3, moves: 25, balancePct: 99 }));
  assert.equal(best, false);
  assert.equal(record.moves, 20);

  ({ record, best } = recordPack(record, { stars: 3, moves: 20, balancePct: 75 }));
  assert.equal(best, true, "same stars and moves, better balance");
});

test("pack records keep extra fields like the daily mask", () => {
  const { record } = recordPack({ stars: 2, moves: 9, balancePct: 90, mask: 5 }, { stars: 3, moves: 9, balancePct: 90, mask: 7 });
  assert.equal(record.mask, 7);
});

test("trivia records rank score, then wrong guesses", () => {
  let { record, best } = recordTrivia(undefined, { score: 350, wrong: 1 });
  assert.equal(best, false);
  ({ record, best } = recordTrivia(record, { score: 200, wrong: 0 }));
  assert.equal(best, false);
  assert.deepEqual(record, { score: 350, wrong: 1 });
  ({ record, best } = recordTrivia(record, { score: 500, wrong: 0 }));
  assert.equal(best, true);
  assert.deepEqual(record, { score: 500, wrong: 0 });
});

test("boarding records count line-ups and keep the best result against par", () => {
  let { record, best } = recordBoarding(undefined, { moves: 30, par: 26 });
  assert.deepEqual(record, { solved: 1, atPar: 0, vsPar: 4, moves: 30, par: 26 });
  assert.equal(best, false);

  ({ record, best } = recordBoarding(record, { moves: 20, par: 22 }));
  assert.deepEqual(record, { solved: 2, atPar: 1, vsPar: -2, moves: 20, par: 22 });
  assert.equal(best, true);

  ({ record, best } = recordBoarding(record, { moves: 24, par: 24 }));
  assert.deepEqual(record, { solved: 3, atPar: 2, vsPar: -2, moves: 20, par: 22 });
  assert.equal(best, false);
});

test("vs-par labels", () => {
  assert.equal(formatVsPar(0), "par");
  assert.equal(formatVsPar(-3), "−3");
  assert.equal(formatVsPar(2), "+2");
});
