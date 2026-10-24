// Personal bests for each game, kept in the save on this device. Pure functions so they can be unit-tested.
// Each record* function returns { record, best }: the record to store, and whether it beat an earlier one.

// Pack: more stars, then fewer moves, then better balance
export function recordPack(prev, run) {
  const better = !prev ||
    run.stars > prev.stars ||
    (run.stars === prev.stars && (run.moves < prev.moves ||
      (run.moves === prev.moves && run.balancePct > prev.balancePct)));
  return better ? { record: { ...prev, ...run }, best: !!prev } : { record: prev, best: false };
}

// Trivia: a higher score (the miles the round would pay), then fewer wrong guesses. Practice rounds count too.
export function recordTrivia(prev, run) {
  const better = !prev || run.score > prev.score || (run.score === prev.score && run.wrong < prev.wrong);
  return better ? { record: { score: run.score, wrong: run.wrong }, best: !!prev } : { record: prev, best: false };
}

// Boarding, per cabin size: line-ups are scrambled differently every time, so the best is the fewest moves
// relative to par. Also counts line-ups solved and how many finished at or under par.
export function recordBoarding(prev, run) {
  const vsPar = run.moves - run.par;
  const solved = (prev ? prev.solved : 0) + 1;
  const atPar = (prev ? prev.atPar : 0) + (vsPar <= 0 ? 1 : 0);
  const better = !prev || vsPar < prev.vsPar;
  const bestRun = better ? { vsPar, moves: run.moves, par: run.par } : { vsPar: prev.vsPar, moves: prev.moves, par: prev.par };
  return { record: { solved, atPar, ...bestRun }, best: better && !!prev };
}

// "−3", "par", "+2"
export function formatVsPar(vsPar) {
  return vsPar === 0 ? "par" : vsPar < 0 ? `−${-vsPar}` : `+${vsPar}`;
}

export function starsText(stars) {
  return "★".repeat(stars) + "☆".repeat(3 - stars);
}
