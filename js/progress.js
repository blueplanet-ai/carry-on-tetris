// Progress rules: which bags and trivia flights are open, and what counts as packed or perfect.
// Pure: takes the save's maps as arguments so the rules are unit-tested.

const PACKED = 1, PERFECT = 7; // star bitmask: 1 packed, 2 balanced, 4 full

export const isBagPacked = (bagStars, id) => ((bagStars[id] || 0) & PACKED) === PACKED;
export const isPerfect = (mask) => (mask & PERFECT) === PERFECT;

// Bag i opens once the bag before it is packed or skipped
export function isLevelUnlocked(levels, i, { bagStars, skippedBags }) {
  if (i === 0) return true;
  const prev = levels[i - 1].id;
  return isBagPacked(bagStars, prev) || !!skippedBags[prev];
}

// A bag can be skipped while it's unpacked and the next bag is still locked behind it
export function canSkipLevel(levels, i, progress) {
  const lv = levels[i];
  return !!lv && i + 1 < levels.length && !isBagPacked(progress.bagStars, lv.id) && !progress.skippedBags[lv.id];
}

// A flight opens when its unlock bag is packed (skipping doesn't count). Flights already routed stay open.
export function isRoundUnlocked(round, { bagStars, triviaSolved }) {
  return !round.unlockBag || isBagPacked(bagStars, round.unlockBag) || !!triviaSolved[round.id];
}

export const roundsUnlockedBy = (rounds, bagId) => rounds.filter(r => r.unlockBag === bagId);
