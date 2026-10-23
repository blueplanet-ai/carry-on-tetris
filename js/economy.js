// Frequent-flyer miles, status tiers and the suitcase-skin shop.
import { $, toast } from "./util.js";
import { save, persist } from "./save.js";
import { fx } from "./audio.js";

export const TIERS = [
  { name: "Economy", min: 0 },
  { name: "Premium Economy", min: 2500 },
  { name: "Business", min: 6000 },
  { name: "First Class", min: 12000 }
];

// Suitcase shell colours (the ids are stored in saves, so they stay as they were)
export const SKINS = [
  { id: "classic", name: "Deep Teal", price: 0, shell: "#2F4A4F" },
  { id: "coral", name: "Sunset Clay", price: 800, shell: "#8C4A2E" },
  { id: "leather", name: "Aviator Leather", price: 1500, shell: "#5E4632" },
  { id: "neon", name: "Night Jetset", price: 2500, shell: "#2B3A5C" },
  { id: "gold", name: "First Class Gold", price: 4000, shell: "#7A6331" }
];

export const tierFor = (lifetime) => [...TIERS].reverse().find(t => lifetime >= t.min);

export function updateMilesDisplay() {
  $("milesCount").textContent = save.miles.toLocaleString();
  const tier = tierFor(save.lifetime);
  $("milesBadge").title = `Frequent flyer miles · ${tier.name}`;
  persist();
}

export function addMiles(amount) {
  if (amount <= 0) return;
  const before = tierFor(save.lifetime);
  save.miles += amount;
  save.lifetime += amount;
  updateMilesDisplay();
  const badge = $("milesBadge");
  badge.classList.remove("bump");
  void badge.offsetWidth;
  badge.classList.add("bump");
  fx.coin();
  const after = tierFor(save.lifetime);
  if (after.name !== before.name) setTimeout(() => toast(`Upgraded to ${after.name}!`), 600);
}

export function spendMiles(amount) {
  if (save.miles < amount) return false;
  save.miles -= amount;
  updateMilesDisplay();
  return true;
}

export function applySkin() {
  const skin = SKINS.find(s => s.id === save.skin) || SKINS[0];
  document.documentElement.style.setProperty("--shell", skin.shell);
}

export function openShop() {
  renderShop();
  $("shopModal").classList.add("show");
  fx.tap();
}

export function closeShop() {
  $("shopModal").classList.remove("show");
}

function renderShop() {
  const tier = tierFor(save.lifetime);
  const idx = TIERS.indexOf(tier);
  const next = TIERS[idx + 1];
  $("tierName").textContent = tier.name;
  if (next) {
    const pct = ((save.lifetime - tier.min) / (next.min - tier.min)) * 100;
    $("tierSub").textContent = `${save.lifetime.toLocaleString()} lifetime miles · ${(next.min - save.lifetime).toLocaleString()} to ${next.name}`;
    $("tierFill").style.width = `${Math.min(100, pct)}%`;
  } else {
    $("tierSub").textContent = `${save.lifetime.toLocaleString()} lifetime miles · Top tier reached!`;
    $("tierFill").style.width = "100%";
  }

  const list = $("skinList");
  list.innerHTML = "";
  SKINS.forEach(skin => {
    const owned = save.ownedSkins.includes(skin.id);
    const equipped = save.skin === skin.id;
    const row = document.createElement("div");
    row.className = "skin-row" + (equipped ? " equipped" : "");
    row.innerHTML = `
      <div class="skin-swatch" style="--shell:${skin.shell};"></div>
      <div class="skin-info">${skin.name}<small>${owned ? "Owned" : `${skin.price.toLocaleString()} MI`}</small></div>`;
    const btn = document.createElement("button");
    btn.id = `btnSkin-${skin.id}`;
    btn.className = "btn btn-xs" + (equipped ? "" : owned ? "" : " btn-primary");
    btn.textContent = equipped ? "Equipped" : owned ? "Equip" : "Buy";
    btn.disabled = equipped || (!owned && save.miles < skin.price);
    btn.onclick = () => buySkin(skin.id);
    row.appendChild(btn);
    list.appendChild(row);
  });
}

function buySkin(id) {
  const skin = SKINS.find(s => s.id === id);
  if (!save.ownedSkins.includes(id)) {
    if (!spendMiles(skin.price)) { fx.error(); toast("Not enough miles yet"); return; }
    save.ownedSkins.push(id);
    toast(`${skin.name} shell unlocked!`);
    fx.coin();
  } else {
    fx.tap();
  }
  save.skin = id;
  persist();
  applySkin();
  renderShop();
}
