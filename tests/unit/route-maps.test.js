import { test } from "node:test";
import assert from "node:assert/strict";
import { TRIVIA_ROUNDS } from "../../js/data/trivia-rounds.js";
import { ROUTE_MAPS } from "../../js/data/route-maps.js";

const inView = ([x, y]) => x >= 0 && x <= 280 && y >= 0 && y <= 140;

test("every trivia flight has a route map (run `npm run build:maps` after changing flights)", () => {
  for (const round of TRIVIA_ROUNDS) {
    const map = ROUTE_MAPS[round.id];
    assert.ok(map, `${round.id} has no route map`);
    assert.ok(map.land.length > 0, `${round.id} map has no land`);
    assert.match(map.route, /^M[\d.]+ [\d.]+l/);
  }
  assert.equal(Object.keys(ROUTE_MAPS).length, TRIVIA_ROUNDS.length, "route-maps.js has maps for flights that no longer exist");
});

test("each route starts and ends inside the plot", () => {
  for (const [id, map] of Object.entries(ROUTE_MAPS)) {
    assert.ok(inView(map.from), `${id} origin is off the map`);
    assert.ok(inView(map.to), `${id} landing zone is off the map`);
  }
});
