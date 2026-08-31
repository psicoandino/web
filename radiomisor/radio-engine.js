/*
---------------------------------------------------------
Radiomisor
RadioEngine v2.2 — Robust True Radio Station Engine
---------------------------------------------------------

Broadcast Engine for Psicoandino Radio

✓ Load Station (station.json)
✓ Safe URL encoding (RFC 3986 with brackets & spaces)
✓ Bulletproof HTML5 Audio with loadedmetadata seek handling
✓ Deterministic Cycle-based Seeded Shuffle (Mulberry32 PRNG)
✓ Prefetch & Auto-advance
✓ Real-time telemetry & drift compensation

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

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
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
            this.audioElement.volume = this.volume;
            this.audioElement.muted = false;

            this.audioElement.addEventListener("ended", () => {
                this.handleTrackEnded();
            });

            this.audioElement.addEventListener("error", (e) => {
                console.error("[RadioEngine] Error en audio:", e, this.audioElement.error);
                const code = this.audioElement.error ? this.audioElement.error.code : "N/A";
                const msg = this.audioElement.error ? this.audioElement.error.message : "";
                this.status(`ERROR DE AUDIO (${code}): ${msg}. REINTENTANDO EN 1S...`);
                if (this.isRunning) {
                    setTimeout(() => this.playCurrentBroadcast(), 1000);
                }
            });
        }
    }

    async tune() {
        if (!this.station) {
            await this.loadStation("station.json");
        }

        this._initAudioElement();
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
            // Ya está sonando el archivo actual; sincronizamos si hay desfase
            if (Math.abs(audio.currentTime - startSecond) > 3) {
                audio.currentTime = startSecond;
            }
            return;
        }

        // Asignamos nueva fuente
        audio.src = encodedUrl;
        audio.volume = this.volume;

        const startPlayback = async () => {
            try {
                if (startSecond > 0 && startSecond < (audio.duration || result.signal.duration)) {
                    audio.currentTime = startSecond;
                }
                await audio.play();
                this.status(`▶ AL AIRE: ${result.signal.title} [BLOQUE #${this.currentCycle()} // ${result.index + 1}/${this.station.signals.length}]`);
            } catch (err) {
                console.error("[RadioEngine] Error iniciando play():", err);
                this.status("AVISO: Haz clic en [SINTONIZAR] para permitir audio en el navegador (" + err.message + ")");
            }
        };

        if (audio.readyState >= 1) {
            await startPlayback();
        } else {
            audio.addEventListener("loadedmetadata", startPlayback, { once: true });
            audio.load();
        }

        // Prefetch de la siguiente canción
        const next = this.nextSignal(result.signal.file);
        if (next) {
            this.prefetch(next);
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
        this.status("EMISORA DETENIDA (STANDBY).");
    }
}
