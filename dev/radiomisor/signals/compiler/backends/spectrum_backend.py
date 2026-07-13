import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
import static_ffmpeg

from .exceptions import BackendError

_FFMPEG_EXE, _FFPROBE_EXE = static_ffmpeg.run.get_or_fetch_platform_executables_else_raise()

WINDOW_DURATION = 0.1  # 100ms
NUM_BANDS = 32
MIN_FREQ = 20
MAX_FREQ = 16000
MAX_LEVEL = 7


class SpectrumBackend:
    """Espectro como backend de datos (ADR-007). Deriva de la señal EMITIDA
    — el binario ya codificado por el backend de audio (AAC) — no de la CAR
    de máxima fidelidad: decodifica ese binario de vuelta a PCM mono y
    calcula bandas log-espaciadas. Mismo formato que los `<id>.json` que
    `index.html` ya consume (lista de frames de 32 bandas, niveles 0-7)."""

    def analyze(self, audio_bytes: bytes, container_ext: str) -> tuple:
        """Devuelve (frames, decoded_duration_seconds). decoded_duration es
        la duración real del audio decodificado, para contrastar contra la
        duración declarada por el backend de audio (CAR) — ver riesgo de
        gaps por priming/padding AAC, MILESTONES.md Milestone 5."""

        pcm, sample_rate = self._decode(audio_bytes, container_ext)
        frames = self._compute_bands(pcm, sample_rate)
        decoded_duration = len(pcm) / sample_rate if sample_rate else 0.0

        return frames, decoded_duration

    def _decode(self, audio_bytes: bytes, container_ext: str):

        with tempfile.TemporaryDirectory() as temp:

            input_path = Path(temp) / f"in.{container_ext}"
            output_path = Path(temp) / "out.wav"
            input_path.write_bytes(audio_bytes)

            command = [
                _FFMPEG_EXE, "-y",
                "-i", str(input_path),
                "-ac", "1",
                str(output_path),
            ]

            result = subprocess.run(command, capture_output=True)

            if result.returncode != 0:
                raise BackendError(
                    "ffmpeg failed decoding emitted audio for spectrum: "
                    + result.stderr.decode("utf-8", errors="replace")
                )

            with wave.open(str(output_path), "rb") as w:
                sample_rate = w.getframerate()
                raw = w.readframes(w.getnframes())

        pcm = np.frombuffer(raw, dtype=np.int16)
        return pcm, sample_rate

    def _compute_bands(self, data: np.ndarray, sample_rate: int) -> list:

        window_samples = int(sample_rate * WINDOW_DURATION)

        if window_samples <= 0 or len(data) < window_samples:
            return []

        freq_bins = np.logspace(np.log10(MIN_FREQ), np.log10(MAX_FREQ), NUM_BANDS + 1)
        fft_size = int(2 ** np.ceil(np.log2(window_samples)))
        freqs = np.fft.rfftfreq(fft_size, d=1.0 / sample_rate)
        bin_indices = np.digitize(freqs, freq_bins) - 1

        raw_frames = []

        for start in range(0, len(data) - window_samples, window_samples):

            chunk = data[start:start + window_samples]
            windowed_chunk = chunk * np.hanning(len(chunk))

            fft_data = np.fft.rfft(windowed_chunk, n=fft_size)
            magnitudes = np.abs(fft_data)

            bands = np.zeros(NUM_BANDS)
            for i in range(NUM_BANDS):
                mask = bin_indices == i
                if np.any(mask):
                    bands[i] = np.mean(magnitudes[mask])
            raw_frames.append(bands)

        all_values = [v for frame in raw_frames for v in frame if v > 0]
        peak_limit = np.percentile(all_values, 95) if all_values else 1.0

        normalized_frames = []
        for frame in raw_frames:
            norm_frame = []
            for val in frame:
                if val <= 0:
                    norm_frame.append(0)
                else:
                    ratio = val / peak_limit
                    scaled = int(np.sqrt(ratio) * (MAX_LEVEL + 0.5))
                    norm_frame.append(max(0, min(MAX_LEVEL, scaled)))
            normalized_frames.append(norm_frame)

        return normalized_frames
