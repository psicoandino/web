import os
import tempfile

import static_ffmpeg
import yt_dlp
from pydub import AudioSegment

from .exceptions import DownloadError
from .models import Signal, TrackMetadata

_FFMPEG_EXE, _FFPROBE_EXE = static_ffmpeg.run.get_or_fetch_platform_executables_else_raise()
AudioSegment.converter = _FFMPEG_EXE
AudioSegment.ffmpeg = _FFMPEG_EXE
AudioSegment.ffprobe = _FFPROBE_EXE
os.environ["PATH"] = os.path.dirname(_FFMPEG_EXE) + os.pathsep + os.environ.get("PATH", "")

SAMPLE_RATE = 22050
CHANNELS = 1
MAX_SECONDS = 10


class AudioPipeline:

    def normalize(self, signal: Signal) -> tuple[AudioSegment, TrackMetadata]:

        with tempfile.TemporaryDirectory() as temp:

            source = os.path.join(temp, "audio")

            info = self._download(signal.id, source)

            pcm = self._convert(source)

            return pcm, self._extract_metadata(info)

    def _download(self, youtube_id: str, output_path: str) -> dict:

        url = f"https://www.youtube.com/watch?v={youtube_id}"

        options = {
            "format": "bestaudio/best",
            "outtmpl": output_path,
            "quiet": True,
            "noplaylist": True,
            "extractor_args": {"youtube": {"player_client": ["android"]}}
        }

        try:
            with yt_dlp.YoutubeDL(options) as ydl:
                return ydl.extract_info(url, download=True)
        except yt_dlp.utils.DownloadError as e:
            raise DownloadError(f"Failed to download {youtube_id}: {e}") from e

    def _extract_metadata(self, info: dict) -> TrackMetadata:

        year = info.get("release_year")
        if not year:
            date = info.get("release_date") or info.get("upload_date")
            year = date[:4] if date else None

        return TrackMetadata(
            title=info.get("track") or info.get("title"),
            artist=info.get("artist") or info.get("uploader"),
            album=info.get("album"),
            year=year
        )

    def _convert(self, input_file: str) -> AudioSegment:

        audio = AudioSegment.from_file(input_file)

        audio = (
            audio
            .set_channels(CHANNELS)
            .set_frame_rate(SAMPLE_RATE)
            .set_sample_width(2)
        )

        return audio[:MAX_SECONDS * 1000]
