(function (root) {
  "use strict";
  // The station's shared clock for the picture (the director, 2026-10-22): every listener sees the same world at the
  // same moment, because the visual engine is deterministic from its reset and its 240 s cycle is read from the
  // station's epoch. Written by Claude (the thinker), 2026-10-22.
  const TICKS_PER_SECOND = 60;
  const FRAME_BUDGET_MS = 12; // catching up never takes more than this per frame: the world fast-forwards to the shared moment

  function targetTick(nowMs, epochMs, cycleSeconds) {
    const cycle = cycleSeconds || 240;
    const elapsed = (nowMs - epochMs) / 1000;
    const phase = ((elapsed % cycle) + cycle) % cycle;
    return Math.min(Math.floor(phase * TICKS_PER_SECOND), Math.round(cycle * TICKS_PER_SECOND) - 1);
  }

  function syncEngine(engine, want, budgetMs, now) {
    const clock = now || (() => (root.performance ? root.performance.now() : Date.now()));
    if (engine.tick > want) engine.reset(); // the cycle wrapped: the world starts again from its origin
    const start = clock();
    while (engine.tick < want && clock() - start < budgetMs) engine.step();
    return engine.tick === want;
  }

  function dbToGain(db) {
    return Math.pow(10, (Number(db) || 0) / 20);
  }

  const api = { TICKS_PER_SECOND, FRAME_BUDGET_MS, targetTick, syncEngine, dbToGain };
  root.PsicoSharedClock = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
