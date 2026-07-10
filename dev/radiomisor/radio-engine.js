/*
---------------------------------------------------------
Radiomisor
RadioEngine v1.0
---------------------------------------------------------

Broadcast Engine

✓ Load Station
✓ Compute Broadcast Position
✓ Locate Current Signal
✓ Load RSIG
✓ Decode PCM
✓ Play Signal
✓ Continuous Broadcast
✓ Prefetch Next Signal
✓ Cached Playback
✓ Error Recovery

Invariant:

Time is Truth.

Broadcast state is computed,
never stored.

---------------------------------------------------------
*/

class RadioEngine {

    constructor(statusCallback = () => {}) {

        this.station = null;

        this.audioContext = null;

        this.currentSource = null;

        this.onStatus = statusCallback;

        this.isRunning = false;

        this.nextBuffer = null;

        this.nextFile = null;

        this.prefetchPromise = null;

    }


    status(message) {

        console.log(message);

        this.onStatus(message);

    }


    async loadStation(url = "station.json") {

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Cannot load station."
            );

        }


        this.station =
            await response.json();


        this.status(
            "Station loaded."
        );


        return this.station;

    }


    async tune() {

        if (!this.station) {

            throw new Error(
                "Station not loaded."
            );

        }


        if (!this.audioContext) {

            this.audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        await this.audioContext.resume();


        this.stopSource();


        this.isRunning = true;


        await this.playCurrentBroadcast();

    }


    async playCurrentBroadcast() {

        if (!this.isRunning) {
            return;
        }


        const offset =
            this.currentOffset();


        const result =
            this.findSignal(offset);


        if (!result) {

            throw new Error(
                "No signal found."
            );

        }


        if (
            this.nextFile === result.signal.file &&
            this.nextBuffer
        ) {

            const buffer =
                this.nextBuffer;


            this.nextBuffer = null;
            this.nextFile = null;


            this.playBuffer(
                buffer,
                result.signal,
                result.second
            );


            return;

        }


        const signal =
            await this.loadSignal(
                result.signal.file
            );


        this.play(
            signal,
            result.second
        );

    }


    async prefetch(signal) {

        if (!signal) {
            return;
        }


        if (
            this.nextFile === signal.file ||
            this.prefetchPromise
        ) {

            return;

        }


        this.prefetchPromise =
            this.loadSignal(signal.file)

            .then(data => {

                this.nextBuffer =
                    this.decodeSignal(data);


                this.nextFile =
                    signal.file;


                console.log(
                    "PREFETCH READY:",
                    signal.file
                );

            })

            .catch(error => {

                console.error(
                    "Prefetch failed:",
                    error
                );

            })

            .finally(() => {

                this.prefetchPromise = null;

            });

    }


    nextSignal(currentFile) {

        const index =
            this.station.signals.findIndex(
                s => s.file === currentFile
            );


        if (index === -1) {
            return null;
        }


        return this.station.signals[
            (index + 1)
            %
            this.station.signals.length
        ];

    }


    playBuffer(
        buffer,
        metadata,
        second = 0
    ) {

        this.stopSource();


        const source =
            this.audioContext
                .createBufferSource();


        source.buffer =
            buffer;


        source.connect(
            this.audioContext.destination
        );


        source.start(
            0,
            second
        );


        this.currentSource =
            source;


        const next =
            this.nextSignal(
                metadata.file
            );


        this.prefetch(next);


        this.status(

`📡 Broadcasting (cached)

Signal:
${metadata.id}

Start:
${second.toFixed(2)} s`

        );


        source.onended =
            () => this.handleEnded();


        return source;

    }


    play(signal, second = 0) {

        this.stopSource();


        const buffer =
            this.decodeSignal(signal);


        const source =
            this.audioContext
                .createBufferSource();


        source.buffer =
            buffer;


        source.connect(
            this.audioContext.destination
        );


        source.start(
            0,
            second
        );


        this.currentSource =
            source;


        const stationSignal =
            this.findStationSignal(
                signal.id
            );


        if (stationSignal) {

            const next =
                this.nextSignal(
                    stationSignal.file
                );


            this.prefetch(next);

        }


        this.status(

`📡 Broadcasting

Signal:
${signal.id}

Start:
${second.toFixed(2)} s

Duration:
${signal.duration.toFixed(2)} s`

        );


        source.onended =
            () => this.handleEnded();


        return source;

    }


    async handleEnded() {

        if (!this.isRunning) {
            return;
        }


        try {

            await this.playCurrentBroadcast();

        }

        catch(error) {

            await this.recover(error);

        }

    }


    async recover(error) {

        console.error(error);


        this.status(
            "Recovering broadcast..."
        );


        await new Promise(
            r => setTimeout(r,1000)
        );


        if (this.isRunning) {

            try {

                await this.playCurrentBroadcast();

            }

            catch(error2) {

                console.error(error2);

            }

        }

    }


    stopSource() {

        if (!this.currentSource) {
            return;
        }


        try {

            this.currentSource.stop();

        }
        catch(e){}


        this.currentSource.disconnect();


        this.currentSource = null;

    }


    stop() {

        this.isRunning = false;


        this.stopSource();


        this.nextBuffer = null;

        this.nextFile = null;

    }


    currentOffset() {

        const epoch =
            new Date(
                this.station.station.epoch
            ).getTime();


        const elapsed =
            (
                Date.now() - epoch
            )
            /
            1000;


        return (

            (
                elapsed %
                this.station.totalDuration
            )

            +

            this.station.totalDuration

        )

        %

        this.station.totalDuration;

    }


    findSignal(offset) {

        let cursor = 0;


        for (
            const signal of this.station.signals
        ) {


            if (
                offset <
                cursor + signal.duration
            ) {


                return {

                    signal,

                    second:
                        offset - cursor

                };

            }


            cursor +=
                signal.duration;

        }


        return null;

    }


    async loadSignal(file) {

        const response =
            await fetch(
                "signals/" + file
            );


        if (!response.ok) {

            throw new Error(
                "Cannot load signal: " + file
            );

        }


        return await response.json();

    }


    decodeSignal(signal) {

        const binary =
            atob(signal.payload);


        const bytes =
            new Uint8Array(
                binary.length
            );


        for (
            let i = 0;
            i < binary.length;
            i++
        ) {

            bytes[i] =
                binary.charCodeAt(i);

        }


        const pcm =
            new Int16Array(
                bytes.buffer
            );


        const samples =
            new Float32Array(
                pcm.length
            );


        for (
            let i = 0;
            i < pcm.length;
            i++
        ) {

            samples[i] =
                pcm[i] / 32768;

        }


        const buffer =
            this.audioContext.createBuffer(

                signal.codec.channels,

                samples.length,

                signal.codec.sampleRate

            );


        buffer.copyToChannel(
            samples,
            0
        );


        return buffer;

    }


    findStationSignal(id) {

        return this.station.signals.find(
            s => s.id === id
        );

    }

}