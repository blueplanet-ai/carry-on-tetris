// Frequent-flyer miles, status tiers and the suitcase-skin shop.
import { $, toast } from "./util.js";
import { save, persist } from "./save.js";
import { fx } from "./audio.js";

export const TIERS = [
  { name: "Economy", emoji: "💺", min: 0 },
  { name: "Premium Economy", emoji: "🛋️", min: 2500 },
  { name: "Business", emoji: "🥂", min: 6000 },
  { name: "First Class", emoji: "👑", min: 12000 }
];

export const SKINS = [
  { id: "classic", name: "Classic Slate", price: 0, rim: "#475569", lining: "#1e293b", empty: "#334155" },
  { id: "coral", name: "Sunset Coral", price: 800, rim: "#fb7185", lining: "#2d1622", empty: "#4a2536" },
  { id: "leather", name: "Aviator Leather", price: 1500, rim: "#b45309", lining: "#24190f", empty: "#3d2b1a" },
  { id: "neon", name: "Neon Jetset", price: 2500, rim: "#22d3ee", lining: "#0a1430", empty: "#1c2b52" },
  { id: "gold", name: "First Class Gold", price: 4000, rim: "#fbbf24", lining: "#1c170b", empty: "#3a3016" }
];

export const tierFor = (lifetime) => [...TIERS].reverse().find(t => lifetime >= t.min);

export function updateMilesDisplay() {
  $("milesCount").textContent = save.miles.toLocaleString();
  const tier = tierFor(save.lifetime);
  $("milesBadge").title = `Frequent Flyer Miles • ${tier.emoji} ${tier.name}`;
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
  if (after.name !== before.name) setTimeout(() => toast(`🎉 Upgraded to ${after.emoji} ${after.name}!`), 600);
}

export function spendMiles(amount) {
  if (save.miles < amount) return false;
  save.miles -= amount;
  updateMilesDisplay();
  return true;
}

export function applySkin() {
  const skin = SKINS.find(s => s.id === save.skin) || SKINS[0];
  const root = document.documentElement.style;
  root.setProperty("--suitcase-rim", skin.rim);
  root.setProperty("--suitcase-lining", skin.lining);
  root.setProperty("--cell-empty", skin.empty);
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
  $("tierName").textContent = `${tier.emoji} ${tier.name}`;
  if (next) {
    const pct = ((save.lifetime - tier.min) / (next.min - tier.min)) * 100;
    $("tierSub").textContent = `${save.lifetime.toLocaleString()} lifetime miles • ${(next.min - save.lifetime).toLocaleString()} to ${next.emoji} ${next.name}`;
    $("tierFill").style.width = `${Math.min(100, pct)}%`;
  } else {
    $("tierSub").textContent = `${save.lifetime.toLocaleString()} lifetime miles • Top tier reached!`;
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
      <div class="skin-swatch" style="background:${skin.lining}; border-color:${skin.rim};"></div>
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
    if (!spendMiles(skin.price)) { fx.error(); toast("Not enough miles yet ✈️"); return; }
    save.ownedSkins.push(id);
    toast(`🧳 ${skin.name} unlocked!`);
    fx.coin();
  } else {
    fx.tap();
  }
  save.skin = id;
  persist();
  applySkin();
  renderShop();
}
