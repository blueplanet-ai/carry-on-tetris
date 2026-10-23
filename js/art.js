// Flat line drawings used in place of emoji: packing items, rule badges and boarding passengers.
// Each drawing is SVG markup; colours come from CSS (stroke = currentColor, .f = the light fill).

const svg = (body, cls = "art", box = "0 0 24 24") =>
  `<svg class="${cls}" viewBox="${box}" aria-hidden="true" focusable="false">${body}</svg>`;

// 24 × 24 drawings, one per kind of object
const DRAWINGS = {
  bottle: `<rect class="f" x="8" y="8" width="8" height="13" rx="2.5"/><rect x="9.5" y="3.5" width="5" height="4.5" rx="1"/><path d="M10.5 13h3M10.5 16h3"/>`,
  laptop: `<rect class="f" x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 18h18l-1.5 2h-15z"/>`,
  phone: `<rect class="f" x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>`,
  kit: `<rect class="f" x="4" y="9" width="16" height="10" rx="3"/><path d="M9 9V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16"/>`,
  camera: `<rect class="f" x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7l1.5-2.5h5L16 7"/><circle cx="12" cy="13" r="3.5"/>`,
  boot: `<path class="f" d="M6 3h7v9l5.5 2.5a2 2 0 0 1 1.5 1.9V19H6z"/><path d="M6 19v2h14v-2M9 7h3M9 10h3"/>`,
  sneaker: `<path class="f" d="M3 17v-6l4-.5 3 2.5 4 1 6 1.5a1.5 1.5 0 0 1 1 1.4V17z"/><path d="M3 17v2h18v-2M9 13.5l1-1.5M12 14.5l1-1.5"/>`,
  books: `<rect class="f" x="4" y="15" width="16" height="5" rx="1"/><rect class="f" x="5" y="10" width="14" height="5" rx="1"/><rect class="f" x="6" y="5" width="12" height="5" rx="1"/>`,
  book: `<path class="f" d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M8 4v16M11 9h5M11 12h3"/>`,
  dryer: `<path class="f" d="M4 6h9a4 4 0 0 1 0 8H8"/><path d="M4 6v8h4l-1.5 7h3L12 14"/><circle cx="13" cy="10" r="1.5"/><path d="M18.5 8h2.5M18.5 12h2.5"/>`,
  battery: `<rect class="f" x="6" y="4" width="12" height="17" rx="2"/><path d="M10 2.5h4M12.5 8l-2 4h3l-2 4"/>`,
  iron: `<path class="f" d="M3 18h17a1 1 0 0 0 1-1c0-4-3-7-8-7H9a6 6 0 0 0-6 6z"/><path d="M9 10c0-2.5 1.5-4.5 4.5-4.5H18"/>`,
  glasses: `<path class="f" d="M2.5 10h8v2a4 4 0 0 1-8 0zM13.5 10h8v2a4 4 0 0 1-8 0z"/><path d="M10.5 11c1-.8 2-.8 3 0"/>`,
  goggles: `<rect class="f" x="3" y="8" width="18" height="8" rx="4"/><path d="M12 10v4M3 12H1.5M21 12h1.5"/>`,
  perfume: `<rect class="f" x="6" y="9" width="12" height="12" rx="3"/><rect x="10" y="5" width="4" height="4"/><path d="M12 5V3h3"/>`,
  globe: `<circle class="f" cx="12" cy="10" r="7"/><path d="M6.5 21h11l-1.5-4h-8zM9 11.5l3-3 3 3M12 8.5v4.5"/>`,
  wineglass: `<path class="f" d="M7 3h10l-1 6a4 4 0 0 1-8 0z"/><path d="M12 13v7M8.5 20.5h7"/>`,
  cup: `<path class="f" d="M5 8h12v5a6 6 0 0 1-12 0z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5h-2M4 21h14"/>`,
  tagine: `<path class="f" d="M12 3c2 3 7 6 7 11H5c0-5 5-8 7-11z"/><path class="f" d="M3 14h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,
  shirt: `<path class="f" d="M8 4L3 7l2 4 2-1v10h10V10l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z"/>`,
  pants: `<path class="f" d="M7 3h10l1 18h-4l-2-11-2 11H6z"/><path d="M7 6h10"/>`,
  shorts: `<path class="f" d="M5 5h14l1 11h-6l-2-5-2 5H4z"/><path d="M5 8h14"/>`,
  socks: `<path class="f" d="M9 3h6v9l-4 6a3 3 0 0 1-5-3l3-4z"/><path d="M9 6h6"/>`,
  jacket: `<path class="f" d="M8 3L4 6v15h6V9.5L12 7l2 2.5V21h6V6l-4-3-4 4z"/><path d="M12 7v14"/>`,
  scarf: `<path class="f" d="M5 6c4 3 10 3 14 0v4c-4 3-10 3-14 0z"/><path class="f" d="M14 11.5V20l3-1v-8.5"/>`,
  cap: `<path class="f" d="M4 15a8 8 0 0 1 16 0z"/><path d="M4 15h18M12 7V6"/>`,
  hat: `<ellipse class="f" cx="12" cy="16" rx="10" ry="3.5"/><path class="f" d="M7 15.5c0-5 2.5-8.5 5-8.5s5 3.5 5 8.5"/><path d="M7 13h10"/>`,
  snack: `<path class="f" d="M6 4h12l-1 3 1 13H6l1-13z"/><path d="M7 7h10"/><circle cx="12" cy="13" r="2.5"/>`,
  chocolate: `<path class="f" d="M2.5 16L12 7l9.5 9z"/><path d="M2.5 16v3h19v-3M8.5 11.5l3.5 4.5 3.5-4.5"/>`,
  jar: `<rect class="f" x="7" y="8" width="10" height="13" rx="2"/><rect x="6" y="4.5" width="12" height="3.5" rx="1"/><path d="M10 13h4"/>`,
  headphones: `<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect class="f" x="3" y="14" width="4.5" height="7" rx="1.5"/><rect class="f" x="16.5" y="14" width="4.5" height="7" rx="1.5"/>`,
  cable: `<rect class="f" x="8" y="3" width="8" height="7" rx="1.5"/><path d="M10 3V1.5M14 3V1.5M12 10v4a4 4 0 0 0 4 4h3"/>`,
  mask: `<path class="f" d="M3 9c3-2 15-2 18 0v4c-1.5 3-6 3-9 1-3 2-7.5 2-9-1z"/><path d="M3 10H1.5M21 10h1.5"/>`,
  mitten: `<path class="f" d="M7 21V9a5 5 0 0 1 10 0v12z"/><path d="M7 13.5L5 11.5a1.6 1.6 0 0 1 2.2-2.3M7 18h10"/>`,
  skate: `<path d="M2.5 11h19"/><path class="f" d="M8 11l2 4h4l2-4"/><circle class="f" cx="5" cy="15.5" r="2.5"/><circle class="f" cx="19" cy="15.5" r="2.5"/>`,
  board: `<rect class="f" x="2" y="11" width="20" height="5" rx="2.5"/><path d="M6.5 11V8.5h3.5V11M14 11V8.5h3.5V11"/>`,
  coconut: `<circle class="f" cx="12" cy="13" r="8"/><path d="M9.5 9.5h.01M14.5 9.5h.01M12 13h.01"/>`,
  shell: `<path class="f" d="M12 4c5 0 9 4 9 9l-9 7-9-7c0-5 4-9 9-9z"/><path d="M12 20V7M8 18L6 9.5M16 18l2-8.5"/>`,
  towel: `<rect class="f" x="5" y="4" width="14" height="16" rx="2"/><path d="M5 15h14M5 17.5h14"/>`,
  flipflop: `<path class="f" d="M12 3c3 0 4 3 4 7s-1 11-4 11-4-7-4-11 1-7 4-7z"/><path d="M9 9.5l3 2 3-2"/>`,
  fins: `<path class="f" d="M8 3h8l3 16-3 2-4-3-4 3-3-2z"/><path d="M8 3v6h8V3"/>`,
  ukulele: `<circle class="f" cx="9" cy="15.5" r="5.5"/><path class="f" d="M12.5 11l6.5-6.5 2 2-6.5 6.5"/><circle cx="9" cy="15.5" r="1.5"/>`,
  umbrella: `<path class="f" d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 1-4 0M12 3V2"/>`,
  shopbag: `<path class="f" d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
  lantern: `<path d="M12 2v2"/><path class="f" d="M8 4h8l2 4v9l-2 4H8l-2-4V8z"/><path d="M6 8h12M6 17h12M12 8v9"/>`,
  yarn: `<circle class="f" cx="12" cy="12" r="8"/><path d="M5 9c4 1 10 1 14 0M4.5 14c5 1.5 10 1.5 15 0M9 4.5c2 4 2 11 0 15"/>`,
  teapot: `<path class="f" d="M5 10h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 11.5L21 8.5M5 12H3.5a1.5 1.5 0 0 0 0 3H5M10 10V8h2v2M8.5 7h5"/>`,
  bowl: `<path class="f" d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 20.5h8M14 11l5-8M16.5 11l4.5-6"/>`,
  flame: `<path class="f" d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 2 3 2 0-3-1-5 0-7z"/>`,
  lens: `<circle class="f" cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.5"/>`,
  sake: `<path class="f" d="M10 3h4v3l2 4v11H8V10l2-4z"/><path d="M8 14h8"/>`,
  plush: `<circle class="f" cx="8" cy="7" r="2.5"/><circle class="f" cx="16" cy="7" r="2.5"/><circle class="f" cx="12" cy="14" r="6.5"/><path d="M10 13h.01M14 13h.01M11 16.5h2"/>`,
  pillow: `<path class="f" d="M12 4a8 8 0 0 0-7 12c1 2 3 2 4 0a3.5 3.5 0 0 1 6 0c1 2 3 2 4 0A8 8 0 0 0 12 4z"/>`,
  box: `<path class="f" d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>`
};

// Every item name in generator.js, mapped to a drawing (unknown names fall back to a box)
const ITEM_ART = {
  "3-1-1 Liquids": "bottle", "Laptop": "laptop", "Tablet": "phone", "Toiletry Kit": "kit", "Camera": "camera",
  "Hiking Boots": "boot", "Sneakers": "sneaker", "Book Stack": "books",
  "Hair Dryer": "dryer", "Power Bank": "battery", "Travel Iron": "iron",
  "Sunglasses": "glasses", "Perfume": "perfume", "Snowglobe": "globe", "Wine Glass": "wineglass",
  "Rolled Tees": "shirt", "Jeans": "pants", "Socks": "socks", "Hoodie": "jacket", "Pajamas": "shorts", "Scarf": "scarf",
  "Cap": "cap", "Snacks": "snack", "Headphones": "headphones", "Charger Cables": "cable", "Sleep Mask": "mask",
  "Paperback": "book", "Gloves": "mitten",
  "Sunscreen": "bottle", "Skate Trucks": "skate", "Denim Jeans": "pants", "Giant Toblerone": "chocolate", "Neck Pillow": "pillow",
  "Reef Sunscreen": "bottle", "GoPro": "camera", "Snorkel Fins": "fins", "Coconut Haul": "coconut", "Seashell Lei": "shell",
  "Mai Tai Glasses": "wineglass", "Aloha Shirt": "shirt", "Swim Trunks": "shorts", "Beach Towel": "towel", "Flip-Flops": "flipflop",
  "Sun Hat": "hat", "Ukulele": "ukulele",
  "Work Laptop": "laptop", "Cologne Bag": "bottle", "Dress Boots": "boot", "Hardcover Books": "books", "Fine Porcelain": "cup",
  "Folded Blazer": "jacket", "London Umbrella": "umbrella", "Dress Shirt": "shirt", "Bagels": "snack", "Duty-Free Bag": "shopbag",
  "Argan Oil": "bottle", "Phone Kit": "phone", "Leather Boots": "boot", "Brass Lantern": "lantern", "Tea Glasses": "cup",
  "Ceramic Tagine": "tagine", "Linen Shirt": "shirt", "Silk Scarf": "scarf", "Babouches": "sneaker", "Spice Tins": "jar",
  "Woven Rug": "yarn", "Mint Tea Tin": "teapot",
  "K-Beauty Kit": "kit", "Hand Cream": "bottle", "Ski Boots": "boot", "Snowboard Bindings": "board", "Snow Goggles": "goggles",
  "Cup Ramen x4": "bowl", "Down Puffer": "jacket", "Thermal Socks": "socks", "Mittens": "mitten", "Fleece": "shirt", "Hand Warmers": "flame",
  "SPF 50+": "bottle", "E-Reader": "phone", "Lens Kit": "lens", "Matcha Set": "cup", "Sake Bottle": "sake",
  "Board Shorts": "shorts", "Rash Guard": "shirt", "Wide-Brim Hat": "hat", "Kangaroo Plush": "plush", "Rain Shell": "jacket", "Tim Tams": "chocolate"
};

export const artKeyFor = (name) => ITEM_ART[name] || "box";
export const hasArt = (name) => name in ITEM_ART;
export const itemArt = (name) => svg(DRAWINGS[artKeyFor(name)]);

// Small badges for the packing rule, drawn in the corner of a packed item
const BADGES = {
  TOP_ROW: `<path d="M5 6h14M12 20V10M8 13.5l4-4 4 4"/>`,
  BOTTOM_HEAVY: `<path class="f" d="M7 9h10l2.5 11h-15z"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0"/>`,
  HEAVY: `<path class="f" d="M7 9h10l2.5 11h-15z"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0"/>`,
  FRAGILE: `<path class="f" d="M7 3h10l-1 6a4 4 0 0 1-8 0z"/><path d="M12 13v7M8.5 20.5h7"/>`,
  BONUS: `<path class="f" d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>`
};
export const ruleBadge = (rule) => (BADGES[rule] ? svg(BADGES[rule], "badge-art") : "");

/* Boarding passengers: a standing figure (60 × 56) plus what each group carries */
const FIGURE = `<path class="sh" d="M17 55V39a13 13 0 0 1 26 0v16z"/><circle class="sk" cx="30" cy="15" r="8.5"/>`;
const PAX_PROPS = {
  cane: { front: `<path class="ln" d="M50 55V33a4 4 0 0 0-8 0"/>` },
  glass: { front: `<path class="pr" d="M45 30h11l-2 9a3.5 3.5 0 0 1-7 0z"/><path class="ln" d="M50.5 42.5v7M46.5 49.5h8"/>` },
  briefcase: { front: `<path class="ln" d="M48 41v-3h6v3"/><rect class="pd" x="44" y="41" width="14" height="11" rx="2"/>` },
  card: { front: `<rect class="pr" x="44" y="32" width="14" height="10" rx="1.5"/><path class="ln" d="M44 35.5h14"/>` },
  child: { front: `<path class="pr" d="M43 55v-9a7 7 0 0 1 14 0v9z"/><circle class="sk" cx="50" cy="34" r="5"/>` },
  roller: { front: `<path class="ln" d="M47 35v-9h7v9"/><rect class="pd" x="44" y="35" width="13" height="16" rx="2.5"/><circle class="dot" cx="47" cy="53.5" r="1.8"/><circle class="dot" cx="54" cy="53.5" r="1.8"/>` },
  backpack: { back: `<rect class="pd" x="8" y="30" width="11" height="18" rx="3.5"/>` },
  tote: { front: `<path class="ln" d="M47 42a4 4 0 0 1 8 0"/><path class="pr" d="M44.5 42h13L56 53H46z"/>` },
  headphones: { front: `<path class="ln" d="M20.5 15a9.5 9.5 0 0 1 19 0"/><rect class="pd" x="18.5" y="12.5" width="4" height="7" rx="1.5"/><rect class="pd" x="37.5" y="12.5" width="4" height="7" rx="1.5"/>` },
  laptop: { front: `<rect class="pr" x="42" y="36" width="16" height="11" rx="1.5"/><path class="ln" d="M40 49h20"/>` },
  balloon: { figure: `<path class="sh" d="M22 55V44a8 8 0 0 1 16 0v11z"/><circle class="sk" cx="30" cy="30" r="6.5"/>`,
    front: `<path class="ln" d="M47 19q-1 10-9 19"/><circle class="pr" cx="47" cy="12" r="6.5"/>` },
  dog: { front: `<path class="ln" d="M41 41q9 0 14 3"/><ellipse class="pd" cx="50" cy="49.5" rx="7" ry="4"/><circle class="pd" cx="56.5" cy="44.5" r="3.5"/><path class="ln" d="M45.5 53v2.5M54 53v2.5"/>` },
  gradcap: { front: `<path class="pd" d="M18 8l12-5 12 5-12 5z"/><path class="ln" d="M39 9v5.5"/>` },
  clock: { front: `<circle class="pr" cx="50" cy="36" r="7.5"/><path class="ln" d="M50 31.5V36h3.5"/>` },
  dash: { back: `<path class="ln" d="M3 31h9M1.5 38h10M4 45h8"/>` }
};
const PAX_KIND = [null, "cane", "glass", "briefcase", "card", "child", "roller", "backpack", "tote",
  "headphones", "laptop", "balloon", "dog", "gradcap", "clock", "dash"];

export function paxArt(group) {
  const p = PAX_PROPS[PAX_KIND[group]] || {};
  return `<svg class="pax-art shirt-${group % 4}" viewBox="0 0 60 56" aria-hidden="true" focusable="false">${p.back || ""}${p.figure || FIGURE}${p.front || ""}</svg>`;
}
