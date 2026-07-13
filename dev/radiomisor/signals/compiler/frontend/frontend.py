import os
import subprocess

import static_ffmpeg
from pydub import AudioSegment

from ..origin_store.models import Acquisition
from .car import CAR
from .exceptions import DecodeError

_FFMPEG_EXE, _FFPROBE_EXE = static_ffmpeg.run.get_or_fetch_platform_executables_else_raise()
AudioSegment.converter = _FFMPEG_EXE
AudioSegment.ffmpeg = _FFMPEG_EXE
AudioSegment.ffprobe = _FFPROBE_EXE
os.environ["PATH"] = os.path.dirname(_FFMPEG_EXE) + os.pathsep + os.environ.get("PATH", "")


class Frontend:
    """Origin Store -> CAR inicial. Decodificación declarada, sin
    transformaciones irreversibles. Ver compiler/docs/CONTRACTS.md."""

    def decode(self, acquisition: Acquisition) -> CAR:

        if not os.path.exists(acquisition.audio_path):
            raise DecodeError(f"Audio component not found: {acquisition.audio_path}")

        # Sin set_channels / set_frame_rate / set_sample_width: la CAR del
        # frontend preserva íntegramente lo que el decodificador produce a
        # partir del origen, sin resample ni downmix.
        audio = AudioSegment.from_file(acquisition.audio_path)

        pcm = audio.raw_data

        acta = {
            "derived_from": acquisition.acquisition_hash,
            "transformation": "decode",
            "tool": "ffmpeg",
            "tool_version": self._ffmpeg_version(),
            "component": os.path.basename(acquisition.audio_path),
        }

        return CAR(
            pcm=pcm,
            sample_rate=audio.frame_rate,
            channels=audio.channels,
            sample_width=audio.sample_width,
            acta=acta,
        )

    def _ffmpeg_version(self) -> str:

        result = subprocess.run(
            [_FFMPEG_EXE, "-version"],
            capture_output=True,
            text=True,
            check=True,
        )

        return result.stdout.splitlines()[0]
