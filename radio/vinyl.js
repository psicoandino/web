/*
 Vinyl — acousticOS (the director, 2026-10-22: release 1 keeps v1's vinyl emulator).
 Taken from radiomisor v1 (refs/imports/radiomisor-v1:radiomisor.app.js, initVinylNoise) without changing its sound:
 four looped noise layers (pink hiss, Poisson crackle, Brownian rumble, 33 1/3 RPM thump), summed, wobbled by wow and
 flutter, saturated, band-limited, and laid over the music. As in v1, it never processes the music itself.
 One flutter depth (v1's start value, 0.0003) instead of v1's two. Moved into a module by Claude (the thinker), 2026-10-22.
*/
(function (root) {
    "use strict";

    const DEFAULTS = { hiss: 30, crackle: 25, thump: 40, rumble: 20, wow: 15, flutter: 10, sat: 14, cutoff: 8500, volume: 0.8 };
    const LAYER_GAIN = { hiss: 0.6, crackle: 0.5, rumble: 0.4, thump: 0.7 };
    const THUMP_PERIOD = 1.8; // seconds per revolution at 33 1/3 RPM

    function layerGain(key, value) {
        return (value / 100) * LAYER_GAIN[key];
    }

    function depthFor(key, value) {
        return (value / 100) * (key === "wow" ? 0.003 : 0.0003);
    }

    function saturationCurve(amount) {
        const n = 2048, curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            curve[i] = x !== 0 ? Math.sign(x) * Math.pow(Math.abs(x), 1 / amount) : 0;
        }
        return curve;
    }

    function makeBuffers(ctx) {
        const sr = ctx.sampleRate;

        // 1. Pink noise (Paul Kellet 6-pole approximation, 4 s)
        const hiss = ctx.createBuffer(2, sr * 4, sr);
        for (let ch = 0; ch < 2; ch++) {
            const d = hiss.getChannelData(ch), b = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i < d.length; i++) {
                const w = Math.random() * 2 - 1;
                b[0] = 0.99886 * b[0] + w * 0.0555179;
                b[1] = 0.99332 * b[1] + w * 0.0750759;
                b[2] = 0.96900 * b[2] + w * 0.1538520;
                b[3] = 0.86650 * b[3] + w * 0.3104856;
                b[4] = 0.55000 * b[4] + w * 0.5329522;
                b[5] = -0.7616 * b[5] - w * 0.0168980;
                b[6] = 0.115926 * w;
                d[i] = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + 0.5362 * w) * 0.11;
            }
        }

        // 2. Poisson crackle (exponential inter-arrival times, about 18 clicks per second, 4 s)
        const crackle = ctx.createBuffer(1, sr * 4, sr), c = crackle.getChannelData(0), lambda = 18;
        let i = 0;
        while (i < c.length) {
            i += Math.max(1, Math.floor(-Math.log(Math.random() + 1e-9) / lambda * sr));
            if (i < c.length) {
                const amp = (Math.random() * 0.7 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
                const alpha = 2000 + Math.random() * 4000, fc = 1500 + Math.random() * 3000;
                const decay = Math.min(Math.floor(sr * 0.004), c.length - i);
                for (let k = 0; k < decay; k++) {
                    const t = k / sr;
                    c[i + k] += amp * Math.exp(-alpha * t) * Math.cos(2 * Math.PI * fc * t);
                }
            }
        }

        // 3. Turntable rumble (Brownian noise, low-passed at about 45 Hz, 4 s)
        const rumble = ctx.createBuffer(1, sr * 4, sr), r = rumble.getChannelData(0);
        let running = 0, prev = 0;
        for (let k = 0; k < r.length; k++) {
            running += (Math.random() * 2 - 1) * 0.005;
            running *= 0.998;
            r[k] = running;
        }
        const a45 = 2 * Math.PI * 45 / sr;
        for (let k = 0; k < r.length; k++) {
            prev += a45 * (r[k] - prev);
            r[k] = prev;
        }

        // 4. Scratch thump, one per revolution (two revolutions per loop)
        const len = Math.round(sr * THUMP_PERIOD * 2), thump = ctx.createBuffer(1, len, sr), t = thump.getChannelData(0);
        for (let rep = 0; rep < 2; rep++) {
            const onset = Math.round(rep * THUMP_PERIOD * sr), tLen = Math.min(Math.round(sr * 0.15), len - onset);
            for (let k = 0; k < tLen; k++) {
                const s = k / sr;
                t[onset + k] = 0.55 * Math.exp(-s / 0.08) * Math.sin(2 * Math.PI * 9 * s); // tone-arm resonance about 9 Hz, 80 ms
            }
            if (onset < len) t[onset] += 0.8 * (Math.random() > 0.5 ? 1 : -1);
        }

        return { hiss, crackle, rumble, thump };
    }

    class Vinyl {
        constructor(ctx, output, settings) {
            this.ctx = ctx;
            this.s = Object.assign({}, DEFAULTS, settings || {});
            this.active = false;
            const buffers = makeBuffers(ctx);

            this.master = ctx.createGain();
            this.master.gain.value = 0;
            this.delay = ctx.createDelay(0.1);
            this.delay.delayTime.value = 0.02;
            this.saturation = ctx.createWaveShaper();
            this.saturation.oversample = "4x";
            this.saturation.curve = saturationCurve(this.s.sat / 10);
            this.lowpass = ctx.createBiquadFilter();
            this.lowpass.type = "lowpass";
            this.lowpass.frequency.value = this.s.cutoff;
            this.lowpass.Q.value = 0.7;
            this.highpass = ctx.createBiquadFilter();
            this.highpass.type = "highpass";
            this.highpass.frequency.value = 22;
            this.highpass.Q.value = 0.5;

            this.depth = {};
            [["wow", "sine", 0.56], ["flutter", "sawtooth", 15.0]].forEach(([key, type, hz]) => {
                const lfo = ctx.createOscillator(), depth = ctx.createGain();
                lfo.type = type;
                lfo.frequency.value = hz;
                depth.gain.value = depthFor(key, this.s[key]);
                lfo.connect(depth);
                depth.connect(this.delay.delayTime);
                lfo.start(0);
                this.depth[key] = depth;
            });

            this.master.connect(this.delay);
            this.delay.connect(this.saturation);
            this.saturation.connect(this.lowpass);
            this.lowpass.connect(this.highpass);
            this.highpass.connect(output);

            this.layers = {};
            Object.keys(LAYER_GAIN).forEach(key => {
                const gain = ctx.createGain(), src = ctx.createBufferSource();
                gain.gain.value = layerGain(key, this.s[key]);
                src.buffer = buffers[key];
                src.loop = true;
                src.connect(gain);
                gain.connect(this.master);
                src.start(0);
                this.layers[key] = gain;
            });
        }

        setActive(on) {
            this.active = !!on;
            this.master.gain.setTargetAtTime(this.active ? this.s.volume : 0, this.ctx.currentTime, 0.05);
        }

        set(key, value) {
            this.s[key] = value;
            if (key in LAYER_GAIN) this.layers[key].gain.value = layerGain(key, value);
            else if (key === "wow" || key === "flutter") this.depth[key].gain.value = depthFor(key, value);
            else if (key === "sat") this.saturation.curve = saturationCurve(value / 10);
            else if (key === "cutoff") this.lowpass.frequency.value = value;
            else if (key === "volume" && this.active) this.master.gain.value = value;
        }
    }

    const api = { Vinyl, DEFAULTS, THUMP_PERIOD, layerGain, depthFor, saturationCurve, makeBuffers };
    root.PsicoVinyl = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
