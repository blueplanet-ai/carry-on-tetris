import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const swSource = readFileSync(join(root, "sw.js"), "utf8");
const assets = JSON.parse(swSource.match(/const ASSETS = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));

const listJs = (dir) => readdirSync(join(root, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? listJs(join(dir, e.name)) : e.name.endsWith(".js") ? [`./${join(dir, e.name)}`] : []));

test("every file the service worker caches exists", () => {
  for (const a of assets) if (a !== "./") assert.ok(existsSync(join(root, a)), `${a} is cached but missing`);
});

test("every game module is cached for offline play", () => {
  for (const file of listJs("js")) assert.ok(assets.includes(file), `${file} isn't in sw.js ASSETS`);
  assert.ok(assets.includes("./css/styles.css"));
});
