/*
 * Emisora Psicoandina — receptor temporal sobre YouTube.
 *
 * El programa declara orden, duraciones y epoch. YouTube aporta el transporte.
 * El presente nunca se almacena: se recalcula desde programa + Date.now().
 */
class YouTubeBroadcastEngine {
    constructor(getPlayer, statusCallback = () => {}, now = () => Date.now()) {
        this.getPlayer = getPlayer;
        this.onStatus = statusCallback;
        this.now = now;
        this.station = null;
        this.isRunning = false;
        this.volume = 1;
        this.boundaryTimer = null;
    }

    status(message) {
        console.log(message);
        this.onStatus(message);
    }

    loadProgram(program) {
        YouTubeBroadcastEngine.validateProgram(program);
        this.station = program;
        this.status("Station program loaded.");
        return this.station;
    }

    static validateProgram(program) {
        if (!program || !program.station || !program.station.epoch) {
            throw new Error("Station program requires an epoch.");
        }
        if (!Array.isArray(program.signals) || program.signals.length === 0) {
            throw new Error("Station program requires signals.");
        }
        const total = program.signals.reduce((sum, signal) => {
            if (!signal.id || !Number.isFinite(signal.duration) || signal.duration <= 0) {
                throw new Error("Every signal requires a YouTube id and positive duration.");
            }
            return sum + signal.duration;
        }, 0);
        if (!Number.isFinite(program.totalDuration) || Math.abs(program.totalDuration - total) > 0.001) {
            throw new Error("Station totalDuration does not match its signals.");
        }
        if (!Number.isFinite(new Date(program.station.epoch).getTime())) {
            throw new Error("Station epoch is invalid.");
        }
    }

    setVolume(value) {
        this.volume = Math.min(1, Math.max(0, value));
        const player = this.getPlayer();
        if (player && typeof player.setVolume === "function") {
            player.setVolume(this.volume * 100);
        }
    }

    currentOffset(atMilliseconds = this.now()) {
        const epoch = new Date(this.station.station.epoch).getTime();
        const elapsed = (atMilliseconds - epoch) / 1000;
        return ((elapsed % this.station.totalDuration) + this.station.totalDuration) % this.station.totalDuration;
    }

    findSignal(offset) {
        let cursor = 0;
        for (const signal of this.station.signals) {
            if (offset < cursor + signal.duration) {
                return { signal, second: offset - cursor };
            }
            cursor += signal.duration;
        }
        return null;
    }

    nextSignal(currentFile) {
        const index = this.station.signals.findIndex(signal => signal.file === currentFile);
        if (index === -1) return null;
        return this.station.signals[(index + 1) % this.station.signals.length];
    }

    async tune() {
        if (!this.station) throw new Error("Station program not loaded.");
        const player = this.getPlayer();
        if (!player || typeof player.loadVideoById !== "function") {
            throw new Error("YouTube player is not ready.");
        }
        this.isRunning = true;
        this.setVolume(this.volume);
        this.resync();
    }

    resync() {
        if (!this.isRunning) return;
        const player = this.getPlayer();
        if (!player || typeof player.loadVideoById !== "function") return;
        const result = this.findSignal(this.currentOffset());
        if (!result) throw new Error("No signal found in station program.");

        player.loadVideoById({
            videoId: result.signal.id,
            startSeconds: Math.max(0, result.second)
        });
        this.status(`Broadcasting YouTube ${result.signal.id} at ${result.second.toFixed(2)} s`);

        if (this.boundaryTimer) clearTimeout(this.boundaryTimer);
        const remainingMilliseconds = Math.max(250, (result.signal.duration - result.second) * 1000 + 100);
        this.boundaryTimer = setTimeout(() => this.resync(), remainingMilliseconds);
    }

    stop() {
        this.isRunning = false;
        if (this.boundaryTimer) clearTimeout(this.boundaryTimer);
        this.boundaryTimer = null;
        const player = this.getPlayer();
        if (player && typeof player.pauseVideo === "function") player.pauseVideo();
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = YouTubeBroadcastEngine;
}
