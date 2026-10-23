// Light / dark theme. With no saved choice the system setting applies; the toggle saves one.
// Uses the same storage key as blueplanet-ai.github.io, so the choice carries over on that origin.
import { $ } from "./util.js";

const KEY = "bp-theme";
const media = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
let choice = null; // "light" | "dark" | null (follow the system)

try { choice = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }

export const currentTheme = () => choice || (media && media.matches ? "dark" : "light");

export function applyTheme() {
  if (choice) document.documentElement.dataset.theme = choice;
  else delete document.documentElement.dataset.theme;
  const dark = currentTheme() === "dark";
  const btn = $("btnTheme");
  if (btn) {
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = dark ? "Light mode" : "Dark mode";
    btn.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#i-${dark ? "sun" : "moon"}"/></svg>`;
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? "#0D1213" : "#EBF0E6";
}

export function toggleTheme() {
  choice = currentTheme() === "dark" ? "light" : "dark";
  try { localStorage.setItem(KEY, choice); } catch (e) { /* storage blocked: switch for this visit only */ }
  applyTheme();
}

if (media && media.addEventListener) media.addEventListener("change", () => { if (!choice) applyTheme(); });
