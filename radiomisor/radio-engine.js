/*
---------------------------------------------------------
Radiomisor
RadioEngine v2.6 — True Radio Station Engine & Atmospheric Announcer
---------------------------------------------------------

✓ "Time is Truth" Deterministic Broadcast Synchronization
✓ Cycle-based Seeded Shuffle (Mulberry32 PRNG)
✓ Real Audio FFT Analyser Integration (AnalyserNode)
✓ Tuning Sweep Analog Sound FX (Dial Frequency Lock)
✓ Atmospheric Station Voice Identifiers (Radio Drops & Chimes)
✓ Analog Tone Presets (Puro, Cassette, Radio AM)
✓ Native MediaSession API (Lockscreen & Mobile OS controls)
✓ Robust RFC 3986 URL Encoding & Safe Seeking
✓ Instant Transition Prefetching

---------------------------------------------------------
*/

function mulberry32(seed) {
    return function() {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffleSignals(signals, cycleIndex) {
    const arr = [...signals];
    const prng = mulberry32(cycleIndex * 9973 + 1337);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function encodePath(path) {
    if (!path) return "";
    return path
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");
}

class RadioEngine {
    constructor(statusCallback = () => {}) {
        this.station = null;
        this.onStatus = statusCallback;
        this.isRunning = false;
        this.audioElement = null;
        this.volume = 0.8;
        this.currentSignal = null;
        this.prefetchAudio = null;

        // Web Audio routing & FFT Analyser
        this.audioCtx = null;
        this.analyser = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.toneFilterLow = null;
        this.toneFilterHigh = null;

        // Station Voice & Interludes
        this.voiceEnabled = true;
        this.lastStationIdTrack = -1;
        this.tonePreset = 'puro'; // 'puro', 'cassette', 'radio-am'

        this._cachedCycle = null;
        this._activeSignals = null;
    }

    status(message) {
        console.log("[RadioEngine]", message);
        if (typeof this.onStatus === 'function') {
            this.onStatus(message);
        }
    }

    async loadStation(url = "station.json") {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("HTTP " + response.status + " al cargar " + url);
            }
            this.station = await response.json();
            this._cachedCycle = null;
            this._activeSignals = null;
            this.status(`ESTACIÓN CARGADA: ${this.station.station?.name || "PSICOANDINO"} (${this.station.signals.length} PISTAS)`);
            return this.station;
        } catch (err) {
            this.status("ERROR CARGANDO ESTACIÓN: " + err.message);
            throw err;
        }
    }

    initWebAudioGraph() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (!this.analyser) {
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 128;
            this.analyser.smoothingTimeConstant = 0.8;

            this.gainNode = this.audioCtx.createGain();
            this.gainNode.gain.value = this.volume;

            // Tone Filters
            this.toneFilterLow = this.audioCtx.createBiquadFilter();
            this.toneFilterLow.type = 'lowshelf';
            this.toneFilterLow.frequency.value = 320;
            this.toneFilterLow.gain.value = 0;

            this.toneFilterHigh = this.audioCtx.createBiquadFilter();
            this.toneFilterHigh.type = 'highshelf';
            this.toneFilterHigh.frequency.value = 4500;
            this.toneFilterHigh.gain.value = 0;

            if (this.audioElement && !this.sourceNode) {
                this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
                this.sourceNode.connect(this.toneFilterLow);
                this.toneFilterLow.connect(this.toneFilterHigh);
                this.toneFilterHigh.connect(this.analyser);
                this.analyser.connect(this.gainNode);
                this.gainNode.connect(this.audioCtx.destination);
            }

            this.applyTonePreset(this.tonePreset);
        }
    }

    applyTonePreset(preset) {
        this.tonePreset = preset;
        if (!this.toneFilterLow || !this.toneFilterHigh) return;

        if (preset === 'cassette') {
            // Warm lows, subtle high roll-off
            this.toneFilterLow.gain.value = 3.5;
            this.toneFilterHigh.gain.value = -4.0;
        } else if (preset === 'radio-am') {
            // Cut extreme lows and highs, boost mids
            this.toneFilterLow.gain.value = -6.0;
            this.toneFilterHigh.gain.value = -12.0;
        } else {
            // Puro / Flat
            this.toneFilterLow.gain.value = 0;
            this.toneFilterHigh.gain.value = 0;
        }
    }

    playTuningSweepFX() {
        try {
            if (!this.audioCtx) return;
            const now = this.audioCtx.currentTime;

            // Noise burst
            const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.35);
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseSource = this.audioCtx.createBufferSource();
            noiseSource.buffer = buffer;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.value = 3.5;
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.exponentialRampToValueAtTime(2800, now + 0.18);
            filter.frequency.exponentialRampToValueAtTime(700, now + 0.33);

            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
            osc.frequency.exponentialRampToValueAtTime(480, now + 0.33);

            const oscGain = this.audioCtx.createGain();
            oscGain.gain.setValueAtTime(0.04, now);
            oscGain.gain.linearRampToValueAtTime(0, now + 0.32);
            osc.connect(oscGain);
            oscGain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.34);

            const noiseGain = this.audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.18, now);
            noiseGain.gain.linearRampToValueAtTime(0.22, now + 0.15);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

            noiseSource.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.audioCtx.destination);

            noiseSource.start(now);
            noiseSource.stop(now + 0.35);
        } catch(e) {
            console.warn("Tuning FX skipped", e);
        }
    }

    playStationChime() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.04, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.6);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.7);
        });
    }

    speakStationId(customText = null) {
        if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const cycle = this.currentCycle();
            const phrases = [
                `Estás en sintonía de Psicoandino Radio. Transmisión continua en el bloque número ${cycle}.`,
                `Psicoandino Radio. Frecuencia cósmica activa.`,
                `Emisora Psicoandina. Música para vivir el viaje.`,
                `Transmitiendo desde los Andes. Psicoandino Radio, veinticuatro horas.`
            ];
            const text = customText || phrases[Math.floor(Math.random() * phrases.length)];
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.pitch = 0.82; // Deep, atmospheric radio voice
            utterance.rate = 0.92;
            utterance.volume = 0.65;

            this.playStationChime();
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
                this.status(`🎙️ IDENTIFICADOR DE ESTACIÓN: "${text}"`);
            }, 300);
        } catch(e) {
            console.warn("SpeechSynthesis error", e);
        }
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
    }

    currentCycle() {
        if (!this.station || !this.station.totalDuration) return 0;
        const epoch = new Date(this.station.station.epoch).getTime();
        const elapsed = (Date.now() - epoch) / 1000;
        return Math.floor(elapsed / this.station.totalDuration);
    }

    currentOffset() {
        if (!this.station || !this.station.totalDuration) return 0;
        const epoch = new Date(this.station.station.epoch).getTime();
        const elapsed = (Date.now() - epoch) / 1000;
        return ((elapsed % this.station.totalDuration) + this.station.totalDuration) % this.station.totalDuration;
    }

    getActiveSignals() {
        if (!this.station || !this.station.signals) return [];
        const cycle = this.currentCycle();
        if (this._cachedCycle !== cycle || !this._activeSignals) {
            this._cachedCycle = cycle;
            this._activeSignals = shuffleSignals(this.station.signals, cycle);
        }
        return this._activeSignals;
    }

    findSignal(offset) {
        const signals = this.getActiveSignals();
        if (!signals || signals.length === 0) return null;

        let cursor = 0;
        for (let i = 0; i < signals.length; i++) {
            const sig = signals[i];
            if (offset < cursor + sig.duration) {
                return {
                    signal: sig,
                    index: i,
                    second: offset - cursor
                };
            }
            cursor += sig.duration;
        }
        return {
            signal: signals[0],
            index: 0,
            second: 0
        };
    }

    nextSignal(currentFile) {
        const signals = this.getActiveSignals();
        if (!signals || signals.length === 0) return null;
        const index = signals.findIndex(s => s.file === currentFile);
        if (index === -1) return null;

        if (index + 1 < signals.length) {
            return signals[index + 1];
        } else {
            const nextCycleSignals = shuffleSignals(this.station.signals, this.currentCycle() + 1);
            return nextCycleSignals[0] || null;
        }
    }

    _initAudioElement() {
        if (!this.audioElement) {
            this.audioElement = new Audio();
            this.audioElement.preload = "auto";
            this.audioElement.crossOrigin = "anonymous";
            this.audioElement.volume = this.volume;
            this.audioElement.muted = false;

            this.audioElement.addEventListener("ended", () => {
                this.handleTrackEnded();
            });

            this.audioElement.addEventListener("error", () => {
                const code = this.audioElement.error ? this.audioElement.error.code : "N/A";
                const msg = this.audioElement.error ? this.audioElement.error.message : "";
                this.status(`REAJUSTANDO FRECUENCIA (${code})...`);
                if (this.isRunning) {
                    setTimeout(() => this.playCurrentBroadcast(), 1000);
                }
            });
        }
    }

    async tune(playFX = true) {
        if (!this.station) {
            await this.loadStation("station.json");
        }

        this._initAudioElement();
        this.initWebAudioGraph();

        if (playFX) {
            this.playTuningSweepFX();
        }

        this.isRunning = true;
        await this.playCurrentBroadcast();
    }

    async playCurrentBroadcast() {
        if (!this.isRunning) return;

        const offset = this.currentOffset();
        const result = this.findSignal(offset);

        if (!result || !result.signal) {
            throw new Error("No se encontró señal activa.");
        }

        this.currentSignal = result.signal;
        const rawFile = result.signal.file;
        const encodedUrl = encodePath(rawFile);
        const startSecond = Math.max(0, result.second);

        this.status(`📡 SINTONIZANDO: ${result.signal.title} (OFFSET ${startSecond.toFixed(1)}s / ${result.signal.duration.toFixed(1)}s)`);

        const audio = this.audioElement;
        const isSameFile = audio.src && (audio.src.endsWith(encodedUrl) || audio.src.endsWith(rawFile));

        if (isSameFile && !audio.paused && audio.readyState >= 2) {
            if (Math.abs(audio.currentTime - startSecond) > 3) {
                audio.currentTime = startSecond;
            }
            return;
        }

        audio.src = encodedUrl;
        audio.volume = this.volume;

        const startPlayback = async () => {
            try {
                if (startSecond > 0 && startSecond < (audio.duration || result.signal.duration)) {
                    audio.currentTime = startSecond;
                }
                await audio.play();
                this.status(`▶ AL AIRE: ${result.signal.title} [BLOQUE #${this.currentCycle()} // ${result.index + 1}/${this.station.signals.length}]`);
                this.updateOSMediaSession();

                // Announce station ID every 5 tracks if starting near beginning of track
                if (result.index % 5 === 0 && result.index !== this.lastStationIdTrack && startSecond < 6) {
                    this.lastStationIdTrack = result.index;
                    this.speakStationId();
                }
            } catch (err) {
                console.error("[RadioEngine] Error iniciando play():", err);
                this.status("AVISO: Haz clic en [SINTONIZAR] para permitir audio (" + err.message + ")");
            }
        };

        if (audio.readyState >= 1) {
            await startPlayback();
        } else {
            audio.addEventListener("loadedmetadata", startPlayback, { once: true });
            audio.load();
        }

        const next = this.nextSignal(result.signal.file);
        if (next) {
            this.prefetch(next);
        }
    }

    updateOSMediaSession() {
        if (!('mediaSession' in navigator) || !this.currentSignal) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: this.currentSignal.title,
                artist: "Psicoandino",
                album: `Psicoandino Radio (Bloque #${this.currentCycle()})`,
                artwork: [
                    { src: 'psico-cover.png', sizes: '512x512', type: 'image/png' }
                ]
            });
            navigator.mediaSession.playbackState = this.isRunning ? "playing" : "paused";

            navigator.mediaSession.setActionHandler('play', () => this.tune(false));
            navigator.mediaSession.setActionHandler('pause', () => this.stop());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.skipNext());
        } catch(e) {
            console.warn("MediaSession error", e);
        }
    }

    skipNext() {
        if (!this.currentSignal) return;
        const next = this.nextSignal(this.currentSignal.file);
        if (next) {
            this.status(`SALTANDO A: ${next.title.toUpperCase()}`);
            this._initAudioElement();
            this.currentSignal = next;
            this.audioElement.src = encodePath(next.file);
            this.audioElement.currentTime = 0;
            this.audioElement.play().catch(() => {});
            this.updateOSMediaSession();
        }
    }

    prefetch(signal) {
        if (!signal) return;
        if (!this.prefetchAudio) {
            this.prefetchAudio = new Audio();
            this.prefetchAudio.preload = "auto";
        }
        this.prefetchAudio.src = encodePath(signal.file);
    }

    async handleTrackEnded() {
        if (!this.isRunning) return;
        this.status("FIN DE PISTA. ENTRANDO A LA SIGUIENTE CANCIÓN...");
        await this.playCurrentBroadcast();
    }

    stop() {
        this.isRunning = false;
        if (this.audioElement) {
            this.audioElement.pause();
        }
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = "paused";
        }
        this.status("EMISORA DETENIDA (STANDBY).");
    }
}
