(function () {
  "use strict";
  // acousticOS screen (the director, 2026-10-22): the visual world is the radio's main screen, on the station's shared
  // clock; one tap tunes in. Uses the visual engine and the radio engine as they are. Written by Claude (the thinker).
  const S = window.PsicoSharedClock;
  const config = JSON.parse(JSON.stringify(window.PSICO_CONFIG));
  config.metadata = { enabled: false };
  config.glyphFont = "'Newsreader', serif"; // the canon's fonts (the director, 2026-10-22)
  config.audio = Object.assign({}, config.audio, { mode: "none" });
  const params = new URLSearchParams(location.search);
  if (params.get("quality")) config.quality = params.get("quality");
  else if (Math.min(innerWidth, innerHeight) < 700) config.quality = "medium"; // phones draw a lighter world so they keep up with the shared clock
  const mode = params.get("mode") === "oled" ? "oled" : "hueso"; // the site's mode, passed in by its radio pill
  document.body.dataset.mode = mode;
  config.background = mode;
  config.fit = "cover"; // the whole viewport, never stretched
  addEventListener("message", e => {
    if (e.origin === location.origin && (e.data === "oled" || e.data === "hueso")) { document.body.dataset.mode = e.data; config.background = e.data; }
  }); // the site tells the radio when its mode changes
  if (window.top !== window) document.getElementById("home").hidden = true; // inside the site, its own footer leads home

  const canvas = document.getElementById("field");
  const line = document.getElementById("track-line");
  const button = document.getElementById("tune-in");
  let vinylState = { on: false };
  try { vinylState = JSON.parse(localStorage.getItem("psico_radio_vinyl")) || vinylState; } catch (e) {}
  function applyVinyl() {
    if (vinylState.radioVolume != null) radio.setVolume(vinylState.radioVolume / 100);
    if (!radio.audioCtx) return;
    radio.setVinyl(!!vinylState.on && radio.isRunning);
    if (radio.vinyl) Object.keys(vinylState).forEach(k => { if (k !== "on" && k !== "radioVolume") radio.vinyl.set(k, k === "volume" ? vinylState[k] / 100 : vinylState[k]); });
  }
  addEventListener("message", e => {
    if (e.origin !== location.origin || !e.data || !e.data.vinyl) return;
    Object.assign(vinylState, e.data.vinyl);
    try { localStorage.setItem("psico_radio_vinyl", JSON.stringify(vinylState)); } catch (err) {}
    applyVinyl();
  }); // the site's Settings hold the vinyl (the director, 2026-10-22)
  const probe = new PsicoAudio.AudioProbe(config.audio);
  const engine = new PsicoEngine.FieldEngine(canvas, config, probe);
  window.__PSICO_ENGINE__ = engine; // to look inside from the browser console
  let fontReady = false;
  (document.fonts ? document.fonts.load("16px 'Newsreader'") : Promise.resolve()).then(() => { fontReady = true; }, () => { config.glyphFont = "serif"; fontReady = true; });
  setTimeout(() => { if (!fontReady) { config.glyphFont = "serif"; fontReady = true; } }, 3000); // never wait forever for a font
  const radio = new RadioEngine(() => {});
  radio.voiceEnabled = false;
  let epochMs = null;

  function clock(s) {
    return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  }

  function showNow() {
    const found = radio.station && radio.findSignal(radio.currentOffset());
    if (!found || !found.signal) return;
    line.textContent = found.signal.title;
    document.getElementById("on-air").textContent = `on air · ${clock(found.second)} / ${clock(found.signal.duration)}`;
  }

  function frame() {
    if (canvas.clientWidth && (Math.round(canvas.clientWidth) !== engine.width || Math.round(canvas.clientHeight) !== engine.height)) engine.resize(); // measure every frame: the site may show the radio after it started
    if (epochMs != null && fontReady) {
      if (S.syncEngine(engine, S.targetTick(Date.now(), epochMs, config.cycleSeconds), S.FRAME_BUDGET_MS)) canvas.classList.add("ready"); // the world appears softly once it has reached the shared moment
      engine.advanceTicks(0);
    }
    requestAnimationFrame(frame);
  }

  button.addEventListener("click", async () => {
    if (radio.isRunning) { // tune out: the clock keeps running; tuning in again lands on the shared moment
      radio.stop();
      probe.mode = "none";
      button.textContent = "tune in";
      return;
    }
    button.disabled = true;
    try {
      await radio.tune(true);
      probe.ctx = radio.audioCtx;
      probe.analyser = radio.analyser;
      probe.freq = new Uint8Array(radio.analyser.frequencyBinCount);
      probe.mode = "url";
      applyVinyl();
      button.textContent = "tune out";
    } catch (e) {}
    button.disabled = false;
  });

  addEventListener("resize", () => engine.resize(), { passive: true });
  addEventListener("keydown", e => { if (e.key.toLowerCase() === "v") radio.setVinyl(!(radio.vinyl && radio.vinyl.active)); }); // preview only: V toggles the vinyl; the site's card will hold the switch
  radio.loadStation("station.json").then(station => {
    epochMs = Date.parse(station.station.epoch);
    showNow();
    setInterval(showNow, 1000);
  });
  setTimeout(() => canvas.classList.add("ready"), 4000); // a slow device still shows the world after 4 s
  requestAnimationFrame(frame);
})();
