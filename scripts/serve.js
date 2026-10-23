// Zero-dependency static server for local play and the e2e tests: `npm start` → http://localhost:8080
// (ES modules don't load from file://, so the game needs to be served over http.)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json", ".md": "text/markdown"
};

export function startServer(port = 8080) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = normalize(join(ROOT, path.endsWith("/") ? path + "index.html" : path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" }).end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  startServer(port).then(() => console.log(`Gate Games at http://localhost:${port}`));
}
