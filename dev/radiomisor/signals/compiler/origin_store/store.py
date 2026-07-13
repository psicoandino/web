import hashlib
import json
import os
import shutil
import tempfile
from datetime import datetime, timezone
from typing import Optional

import yt_dlp

from .exceptions import AcquisitionError, VerificationError
from .models import Acquisition, AudioComponent

DEFAULT_ROOT = "compiler/origin_store/store"
ACTA_FILENAME = "acta.json"

# Descriptive fields kept from the extractor's raw metadata. Everything else
# is dropped: signed/expiring URLs, per-request tokens and volatile counters
# (views, likes, subscribers) are not provenance, they are noise that would
# make two acquisitions of the same content compare as different.
_DESCRIPTIVE_METADATA_KEYS = (
    "title", "track", "artist", "uploader", "uploader_id", "channel",
    "channel_id", "album", "release_year", "release_date", "upload_date",
    "duration", "description", "tags", "categories", "thumbnail",
    "webpage_url", "id", "ext",
)


class OriginStore:
    """D1-A: captura inmutable, append-only, content-addressed de una fuente
    externa. Ver compiler/docs/CONTRACTS.md."""

    def __init__(self, root: str = DEFAULT_ROOT):

        self.root = root

    def acquire(self, youtube_id: str) -> Acquisition:

        source_url = f"https://www.youtube.com/watch?v={youtube_id}"

        with tempfile.TemporaryDirectory() as temp:

            options = {
                "format": "bestaudio/best",
                "outtmpl": os.path.join(temp, "%(id)s.%(ext)s"),
                "writethumbnail": True,
                "quiet": True,
                "noplaylist": True,
                "extractor_args": {"youtube": {"player_client": ["android"]}},
            }

            declared_options = json.loads(json.dumps({k: v for k, v in options.items() if k != "outtmpl"}))

            info = self._download(source_url, options)

            audio_file = self._locate_audio(temp, info)
            thumbnail_file = self._locate_thumbnail(temp, audio_file)

            audio_hash = self._hash_file(audio_file)

            component = AudioComponent(
                filename=os.path.basename(audio_file),
                format_id=info.get("format_id", ""),
                sha256=audio_hash,
            )

            # v1: un solo componente de audio. La identidad de la
            # adquisición es el hash de su contenido capturado.
            acquisition_hash = audio_hash

            directory = self._directory_for(acquisition_hash)

            if os.path.exists(os.path.join(directory, ACTA_FILENAME)):
                # Mismo contenido ya capturado: append-only no significa
                # duplicar bytes idénticos, significa nunca sobrescribir.
                return self._load(acquisition_hash, directory)

            os.makedirs(directory, exist_ok=True)

            shutil.copy2(audio_file, os.path.join(directory, component.filename))

            thumbnail_name = None
            if thumbnail_file:
                thumbnail_name = os.path.basename(thumbnail_file)
                shutil.copy2(thumbnail_file, os.path.join(directory, thumbnail_name))

            acta = self._build_acta(
                youtube_id=youtube_id,
                source_url=source_url,
                info=info,
                options=declared_options,
                component=component,
                thumbnail_name=thumbnail_name,
            )

            with open(os.path.join(directory, ACTA_FILENAME), "w", encoding="utf-8") as f:
                json.dump(acta, f, indent=2, sort_keys=True)

            return Acquisition(
                acquisition_hash=acquisition_hash,
                directory=directory,
                components=[component],
                acta=acta,
            )

    def verify(self, acquisition_hash: str) -> bool:
        """Un registro cuyos hashes no cierran es inválido."""

        directory = self._directory_for(acquisition_hash)
        acta_path = os.path.join(directory, ACTA_FILENAME)

        if not os.path.exists(acta_path):
            raise VerificationError(f"No acquisition record for {acquisition_hash}")

        with open(acta_path, encoding="utf-8") as f:
            acta = json.load(f)

        for component in acta["components"]:
            path = os.path.join(directory, component["filename"])
            if self._hash_file(path) != component["sha256"]:
                return False

        return acta["components"][0]["sha256"] == acquisition_hash

    def _load(self, acquisition_hash: str, directory: str) -> Acquisition:

        with open(os.path.join(directory, ACTA_FILENAME), encoding="utf-8") as f:
            acta = json.load(f)

        components = [
            AudioComponent(filename=c["filename"], format_id=c["format_id"], sha256=c["sha256"])
            for c in acta["components"]
        ]

        return Acquisition(
            acquisition_hash=acquisition_hash,
            directory=directory,
            components=components,
            acta=acta,
        )

    def _download(self, url: str, options: dict) -> dict:

        try:
            with yt_dlp.YoutubeDL(options) as ydl:
                return ydl.extract_info(url, download=True)
        except yt_dlp.utils.DownloadError as e:
            raise AcquisitionError(f"Failed to acquire {url}: {e}") from e

    def _locate_audio(self, temp: str, info: dict) -> str:

        expected = f"{info['id']}.{info['ext']}"
        path = os.path.join(temp, expected)

        if os.path.exists(path):
            return path

        raise AcquisitionError(f"Expected downloaded audio at {path}, not found")

    def _locate_thumbnail(self, temp: str, audio_file: str) -> Optional[str]:

        audio_name = os.path.basename(audio_file)

        for name in os.listdir(temp):
            if name != audio_name and not name.endswith(".part"):
                return os.path.join(temp, name)

        return None

    def _hash_file(self, path: str) -> str:

        digest = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                digest.update(chunk)

        return digest.hexdigest()

    def _directory_for(self, acquisition_hash: str) -> str:

        return os.path.join(self.root, acquisition_hash[:2], acquisition_hash)

    def _build_acta(self, youtube_id, source_url, info, options, component, thumbnail_name) -> dict:

        available_formats = [
            {
                "format_id": f.get("format_id"),
                "ext": f.get("ext"),
                "acodec": f.get("acodec"),
                "abr": f.get("abr"),
                "asr": f.get("asr"),
            }
            for f in info.get("formats", [])
        ]

        raw_metadata = {k: info.get(k) for k in _DESCRIPTIVE_METADATA_KEYS if k in info}

        return {
            "provenance": {
                "source": "youtube",
                "source_id": youtube_id,
                "source_url": source_url,
                "resolved_url": info.get("webpage_url", source_url),
            },
            "format_id": info.get("format_id", ""),
            "available_formats": available_formats,
            "extractor": "yt_dlp",
            "extractor_version": yt_dlp.version.__version__,
            "extractor_options": options,
            "acquired_at": datetime.now(timezone.utc).isoformat(),
            "components": [
                {
                    "filename": component.filename,
                    "format_id": component.format_id,
                    "sha256": component.sha256,
                }
            ],
            "thumbnail": thumbnail_name,
            "raw_metadata": raw_metadata,
        }
