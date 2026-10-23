# Carry-On Tetris — Gate Edition

A cozy, one-thumb airport gate game suite: pack a carry-on under TSA rules, guess where the flight is headed, and line up boarding groups. Works offline as an installable web app, with no runtime dependencies or build step.

## Play locally

The game is plain ES modules, which browsers won't load from `file://`, so serve the folder:

```bash
npm start            # http://localhost:8080 (zero-dependency static server)
# or: python3 -m http.server 8080
```

## Develop

```bash
npm install          # dev tools only: ESLint and Playwright
npm run lint
npm test             # unit tests (Node's built-in runner, no browser)
npx playwright install chromium   # once, for the end-to-end tests
npm run test:e2e     # plays through the real UI in headless Chromium
```

CI runs all of these on every pull request (`.github/workflows/ci.yml`).

## Layout

| Path | What's there |
|---|---|
| `index.html` | Page markup. Buttons use `data-action="…"`, wired up in `js/main.js`. |
| `css/styles.css` | All styles. |
| `js/main.js` | Entry point: button actions, keyboard shortcuts, boot. |
| `js/modes/pack.js`, `trivia.js`, `boarding.js` | The three game modes (UI and per-mode state). |
| `js/generator.js` | Levels, themes and the solvable-bag generator. **Pure** (no DOM). |
| `js/packing.js` | Placement rules and weight balance. **Pure.** |
| `js/boarding-logic.js` | Sliding-puzzle rules and the shortest-solution solver. **Pure.** |
| `js/custom-bag.js` | Custom bag configs and share-link parsing. **Pure.** |
| `js/save.js` | Save data in `localStorage`, with versioned migrations. |
| `js/economy.js`, `audio.js`, `shell.js`, `builder.js`, `state.js`, `util.js` | Miles and shop, sound, header and mode tabs, the 🛠️ window, shared state, helpers. |
| `js/data/trivia-rounds.js` | Trivia flights and clues. |
| `sw.js` | Offline service worker. **Add new files to its `ASSETS` list** (a unit test checks this). |
| `tests/unit/`, `tests/e2e/` | Unit and end-to-end tests. |

See `HANDOVER.md` for the full design notes and history.
