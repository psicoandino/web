import subprocess
import tempfile
from pathlib import Path

import static_ffmpeg

from ..frontend.car import CAR
from .exceptions import BackendError

_FFMPEG_EXE, _FFPROBE_EXE = static_ffmpeg.run.get_or_fetch_platform_executables_else_raise()

OUTPUT_SAMPLE_RATE = 44100
OUTPUT_CHANNELS = 2
OUTPUT_BITRATE_KBPS = 96
CONTAINER = "m4a"


class AACBackend:
    """CAR -> artefacto publicado (RSIG-2, ADR-011). Perfil nivel-cero
    (Milestone 4): AAC-LC 96 kbps, 44100 Hz, estéreo, contenedor M4A, vía
    ffmpeg de la toolchain existente (static_ffmpeg, misma fijación que el
    frontend). Único lugar del sistema donde se decide códec, bitrate,
    sample rate y canales de salida para este perfil. El manifiesto no
    embebe el binario (D2/ADR-011): `encode()` devuelve el manifiesto más
    los bytes del audio bajo claves privadas (`_binary`, `_binary_ext`) que
    el linker extrae para escribir el archivo adyacente."""

    def encode(self, car: CAR, signal_id: str, provider: str) -> dict:

        if car.sample_width != 2:
            raise BackendError(
                f"AACBackend requires 16-bit PCM, got sample_width={car.sample_width}"
            )

        frame_count = len(car.pcm) // (car.sample_width * car.channels)
        duration = frame_count / car.sample_rate

        audio_bytes = self._transcode(car)

        return {
            "format": "RSIG-2",
            "id": signal_id,
            "provider": provider,
            "codec": {
                "type": "AAC-LC",
                "sampleRate": OUTPUT_SAMPLE_RATE,
                "channels": OUTPUT_CHANNELS,
                "bitrate": OUTPUT_BITRATE_KBPS * 1000,
            },
            "duration": duration,
            "_binary": audio_bytes,
            "_binary_ext": CONTAINER,
        }

    def _transcode(self, car: CAR) -> bytes:

        with tempfile.TemporaryDirectory() as temp:

            output_path = Path(temp) / f"out.{CONTAINER}"

            command = [
                _FFMPEG_EXE,
                "-y",
                "-f", "s16le",
                "-ar", str(car.sample_rate),
                "-ac", str(car.channels),
                "-i", "pipe:0",
                "-ar", str(OUTPUT_SAMPLE_RATE),
                "-ac", str(OUTPUT_CHANNELS),
                "-c:a", "aac",
                "-b:a", f"{OUTPUT_BITRATE_KBPS}k",
                str(output_path),
            ]

            result = subprocess.run(
                command,
                input=car.pcm,
                capture_output=True,
            )

            if result.returncode != 0:
                raise BackendError(
                    "ffmpeg failed encoding AAC: "
                    + result.stderr.decode("utf-8", errors="replace")
                )

            return output_path.read_bytes()

    def ffmpeg_version(self) -> str:

        result = subprocess.run(
            [_FFMPEG_EXE, "-version"],
            capture_output=True,
            text=True,
            check=True,
        )

        return result.stdout.splitlines()[0]
