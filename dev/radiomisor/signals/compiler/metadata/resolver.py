import json
from pathlib import Path
from typing import Optional

FIELDS = ("title", "artist", "album", "year")


def extract_from_raw_metadata(raw_metadata: dict) -> dict:
    """Metadata extraída (acta del Origin Store). Misma resolución que el
    pipeline legado (audio_pipeline.AudioPipeline._extract_metadata),
    aplicada sobre raw_metadata en vez de sobre el `info` de yt_dlp en vivo."""

    year = raw_metadata.get("release_year")
    if not year:
        date = raw_metadata.get("release_date") or raw_metadata.get("upload_date")
        year = date[:4] if date else None

    return {
        "title": raw_metadata.get("track") or raw_metadata.get("title"),
        "artist": raw_metadata.get("artist") or raw_metadata.get("uploader"),
        "album": raw_metadata.get("album"),
        "year": year,
    }


def resolve_metadata(declared: Optional[dict], extracted: Optional[dict]) -> dict:
    """Precedencia declarada-sobre-extraída, campo a campo (CONTRACTS.md,
    sección Metadata; Refutación #7: la resolución ocurre en la compilación
    de señal, el linker solo copia el resultado al índice)."""

    declared = declared or {}
    extracted = extracted or {}

    resolved = {}
    for field in FIELDS:
        value = declared.get(field)
        if value in (None, ""):
            value = extracted.get(field)
        resolved[field] = value

    return resolved


def load_declared_metadata(path: Path) -> dict:
    """Lee un station.json existente (formato RM-STATION-1) y devuelve
    title/artist/album/year declarados, indexados por id de señal."""

    data = json.loads(Path(path).read_text(encoding="utf-8"))

    return {
        signal["id"]: {field: signal.get(field) for field in FIELDS}
        for signal in data.get("signals", [])
    }
