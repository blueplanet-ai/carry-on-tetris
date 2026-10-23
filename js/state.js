// State shared across modes. Each mode keeps its own puzzle state privately.
export const app = {
  mode: "tetris",       // "tetris" | "trivia" | "shuffle"
  itinerary: null,      // { levelIdx, bagId, origin, dest, nextDest, step: 1|2|3|4 } while a connected trip is active
  customBagCfg: null    // the custom / shared bag config, once one has been loaded
};
