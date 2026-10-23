// Mode 2 flights: each round's clues, answer and multiple-choice options.
export const TRIVIA_ROUNDS = [
  {
    id: "sfo-yvr", origin: "SFO", hdg: 352, dur: "2h 15m", hours: 2.25,
    clue1: "2 hrs 15 mins due north up the Pacific coast from SFO — crossing an international border.",
    clue2: "12°C & light rain • Passengers packing waterproof shells, umbrellas, and craving poutine.",
    clue3: "Ringed by coastal mountains; famous for Stanley Park & Granville Island.",
    answer: "YVR",
    options: [["YVR", "Vancouver, Canada"], ["ANC", "Anchorage, USA"], ["SEA", "Seattle, USA"], ["DEN", "Denver, USA"]]
  },
  {
    id: "jfk-kef", origin: "JFK", hdg: 48, dur: "5h 10m", hours: 5.2,
    clue1: "5 hrs 10 mins northeast across the North Atlantic from JFK, skirting Greenland.",
    clue2: "4°C & gusty • Manifest shows thermal swimsuits, wool sweaters, and camera tripods.",
    clue3: "Geothermal blue lagoons, black-sand beaches, and the Northern Lights.",
    answer: "KEF",
    options: [["KEF", "Reykjavik, Iceland"], ["DUB", "Dublin, Ireland"], ["LIS", "Lisbon, Portugal"], ["OSL", "Oslo, Norway"]]
  },
  {
    id: "lax-mex", origin: "LAX", hdg: 125, dur: "3h 35m", hours: 3.6,
    clue1: "3 hrs 35 mins southeast from LAX, landing at 2,240 m above sea level.",
    clue2: "23°C & sunny • Passengers carrying light jackets for chilly evenings and a taco-crawl itinerary.",
    clue3: "Built on the lakebed of the Aztec capital Tenochtitlan; home of Frida Kahlo's Casa Azul.",
    answer: "MEX",
    options: [["MEX", "Mexico City, Mexico"], ["PHX", "Phoenix, USA"], ["HAV", "Havana, Cuba"], ["BOG", "Bogotá, Colombia"]]
  },
  {
    id: "lhr-rak", origin: "LHR", hdg: 195, dur: "3h 35m", hours: 3.6,
    clue1: "3 hrs 35 mins south-southwest from London Heathrow, crossing the Strait of Gibraltar.",
    clue2: "26°C & sunny • Passengers carrying linen shirts, mint tea tins, and leather duffels.",
    clue3: "Known as the 'Red City' at the foothills of the Atlas Mountains.",
    answer: "RAK",
    options: [["RAK", "Marrakech, Morocco"], ["LIS", "Lisbon, Portugal"], ["CAI", "Cairo, Egypt"], ["ATH", "Athens, Greece"]]
  },
  {
    id: "fra-ist", origin: "FRA", hdg: 120, dur: "3h 00m", hours: 3,
    clue1: "3 hrs southeast from Frankfurt, crossing the Balkans.",
    clue2: "15°C & breezy • Passengers packing scarves, comfy walking shoes, and room for baklava.",
    clue3: "A city straddling two continents — home of Hagia Sophia and the Grand Bazaar.",
    answer: "IST",
    options: [["IST", "Istanbul, Türkiye"], ["ATH", "Athens, Greece"], ["SOF", "Sofia, Bulgaria"], ["BUD", "Budapest, Hungary"]]
  },
  {
    id: "sin-dps", origin: "SIN", hdg: 125, dur: "2h 35m", hours: 2.6,
    clue1: "2 hrs 35 mins southeast from Singapore, crossing the equator.",
    clue2: "29°C & humid • Surfboard bags, yoga mats, and sarongs on the manifest.",
    clue3: "Terraced rice paddies of Ubud and cliffside sea temples.",
    answer: "DPS",
    options: [["DPS", "Bali, Indonesia"], ["CGK", "Jakarta, Indonesia"], ["KUL", "Kuala Lumpur, Malaysia"], ["MNL", "Manila, Philippines"]]
  },
  {
    id: "hnl-ppt", origin: "HNL", hdg: 168, dur: "5h 45m", hours: 5.75,
    clue1: "5 hrs 45 mins almost due south from Honolulu, across the equator.",
    clue2: "28°C & tropical • Reef-safe sunscreen, snorkel masks, and honeymoon luggage tags.",
    clue3: "Overwater bungalows, black pearls, and Bora Bora day-trips.",
    answer: "PPT",
    options: [["PPT", "Papeete, Tahiti"], ["NAN", "Nadi, Fiji"], ["AKL", "Auckland, New Zealand"], ["GUM", "Hagåtña, Guam"]]
  },
  {
    id: "cts-tpe", origin: "CTS", hdg: 225, dur: "4h 10m", hours: 4.2,
    clue1: "4 hrs 10 mins southwest from Sapporo, flying past Okinawa.",
    clue2: "30°C & muggy • Passengers packing rain jackets and an empty stomach for bubble tea.",
    clue3: "Famous night markets and a 508-metre skyscraper shaped like bamboo.",
    answer: "TPE",
    options: [["TPE", "Taipei, Taiwan"], ["HKG", "Hong Kong"], ["MNL", "Manila, Philippines"], ["OKA", "Naha, Okinawa"]]
  },
  {
    id: "rak-cai", origin: "RAK", hdg: 88, dur: "5h 05m", hours: 5.1,
    clue1: "5 hrs 05 mins due east from Marrakech, tracing the North African coast.",
    clue2: "33°C & dry • Linen, wide sun hats, and a felucca river-cruise booking.",
    clue3: "The last surviving Wonder of the Ancient World stands at the city's edge.",
    answer: "CAI",
    options: [["CAI", "Cairo, Egypt"], ["TUN", "Tunis, Tunisia"], ["AMM", "Amman, Jordan"], ["IST", "Istanbul, Türkiye"]]
  },
  {
    id: "syd-akl", origin: "SYD", hdg: 105, dur: "3h 05m", hours: 3.1,
    clue1: "3 hrs 05 mins east-southeast across the Tasman Sea from Sydney.",
    clue2: "17°C & windy • Hiking boots, rain shells, and Middle-earth film-location tour bookings.",
    clue3: "The 'City of Sails', topped by the 328-m Sky Tower.",
    answer: "AKL",
    options: [["AKL", "Auckland, New Zealand"], ["NAN", "Nadi, Fiji"], ["MEL", "Melbourne, Australia"], ["NOU", "Nouméa, New Caledonia"]]
  },
  {
    id: "dxb-mle", origin: "DXB", hdg: 145, dur: "4h 15m", hours: 4.25,
    clue1: "4 hrs 15 mins south-southeast from Dubai over the Arabian Sea.",
    clue2: "30°C & sunny • Underwater cameras, reef shoes, and seaplane transfer vouchers.",
    clue3: "1,000+ coral islands where the highest natural point is just 2.4 m above sea level.",
    answer: "MLE",
    options: [["MLE", "Malé, Maldives"], ["CMB", "Colombo, Sri Lanka"], ["SEZ", "Mahé, Seychelles"], ["BOM", "Mumbai, India"]]
  },
  {
    id: "gru-eze", origin: "GRU", hdg: 220, dur: "2h 50m", hours: 2.8,
    clue1: "2 hrs 50 mins southwest from São Paulo, following the Atlantic coast.",
    clue2: "18°C & crisp • Tango shoes, a mate gourd, and steakhouse reservations.",
    clue3: "Known as the 'Paris of South America' — Teatro Colón and Recoleta.",
    answer: "EZE",
    options: [["EZE", "Buenos Aires, Argentina"], ["MVD", "Montevideo, Uruguay"], ["SCL", "Santiago, Chile"], ["LIM", "Lima, Peru"]]
  }
];
