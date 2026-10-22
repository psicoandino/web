(function (root) {
  "use strict";
  const C = root.PsicoCore;

  class AudioProbe {
    constructor(config) {
      this.config = config || {};
      this.mode = this.config.mode || "synthetic";
      this.ctx = null;
      this.analyser = null;
      this.source = null;
      this.freq = null;
      this.audio = null;
      this.stream = null;
      this.values = { bass: 0, mid: 0, treble: 0, rms: 0 };
      this.error = null;
    }

    synthetic(t) {
      // Deterministic stand-in: slow musical envelopes, not random flicker.
      const bass = 0.30 + 0.20 * Math.sin(t * 1.43) + 0.10 * Math.sin(t * 0.31 + 1.2);
      const mid = 0.28 + 0.16 * Math.sin(t * 2.11 + 0.8) + 0.08 * Math.sin(t * 0.47);
      const treble = 0.22 + 0.12 * Math.sin(t * 4.91 + 2.1) + 0.06 * Math.sin(t * 0.83);
      return {
        bass: C.clamp(bass, 0, 1), mid: C.clamp(mid, 0, 1),
        treble: C.clamp(treble, 0, 1), rms: C.clamp((bass + mid + treble) / 3, 0, 1)
      };
    }

    async setupAnalyser() {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) throw new Error("Web Audio API unavailable");
      this.ctx = this.ctx || new AC();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = this.config.fftSize || 1024;
      this.analyser.smoothingTimeConstant = this.config.smoothing == null ? 0.86 : this.config.smoothing;
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    }

    async useMicrophone() {
      await this.setupAnalyser();
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.source = this.ctx.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      if (this.ctx.state === "suspended") await this.ctx.resume();
      this.mode = "microphone";
    }

    async useUrl(url) {
      await this.setupAnalyser();
      this.audio = new Audio();
      this.audio.crossOrigin = "anonymous";
      this.audio.preload = "auto";
      this.audio.src = url;
      this.source = this.ctx.createMediaElementSource(this.audio);
      this.source.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      await this.audio.play();
      if (this.ctx.state === "suspended") await this.ctx.resume();
      this.mode = "url";
    }

    update(t) {
      if (this.mode === "none") return (this.values = { bass: 0, mid: 0, treble: 0, rms: 0 });
      if (this.mode === "synthetic" || !this.analyser || !this.freq) return (this.values = this.synthetic(t));

      this.analyser.getByteFrequencyData(this.freq);
      const sr = this.ctx.sampleRate;
      const nyquist = sr / 2;
      const binHz = nyquist / this.freq.length;
      const band = (lo, hi) => {
        const a = Math.max(0, Math.floor(lo / binHz));
        const b = Math.min(this.freq.length - 1, Math.ceil(hi / binHz));
        let sum = 0, n = 0;
        for (let i = a; i <= b; i++) { sum += this.freq[i] / 255; n++; }
        return n ? sum / n : 0;
      };
      const bass = band(40, 180), mid = band(180, 2200), treble = band(2200, 10000);
      this.values = { bass, mid, treble, rms: (bass + mid + treble) / 3 };
      return this.values;
    }
  }

  root.PsicoAudio = { AudioProbe };
})(globalThis);
