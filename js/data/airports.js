// City names for the airport codes the game uses, shown above the codes on the boarding pass.
// Trivia answers come from each round's options; this covers origins, bag routes and daily routes.
export const AIRPORT_CITIES = {
  ANC: "Anchorage", ATL: "Atlanta", AUS: "Austin", BNE: "Brisbane", BOS: "Boston", CDG: "Paris",
  CMN: "Casablanca", CTS: "Sapporo", CUN: "Cancún", DEN: "Denver", DUB: "Dublin", DXB: "Dubai",
  FRA: "Frankfurt", GRU: "São Paulo", HND: "Tokyo Haneda", HNL: "Honolulu", ICN: "Seoul Incheon",
  JFK: "New York", LAX: "Los Angeles", LHR: "London", MIA: "Miami", NRT: "Tokyo Narita",
  ORD: "Chicago", RAK: "Marrakech", SEA: "Seattle", SFO: "San Francisco", SIN: "Singapore",
  SJU: "San Juan", SYD: "Sydney", YYC: "Calgary"
};

// "Vancouver, Canada" -> "Vancouver"
export const cityOf = (code, fallback = "") => AIRPORT_CITIES[code] || fallback;
export const shortCity = (label) => String(label).split(",")[0];
