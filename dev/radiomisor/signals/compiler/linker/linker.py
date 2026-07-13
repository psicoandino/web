import json
from pathlib import Path
from typing import Optional

from ..backends.pcm_backend import PCMBackend
from ..backends.spectrum_backend import SpectrumBackend
from ..frontend.frontend import Frontend
from ..metadata.resolver import extract_from_raw_metadata, resolve_metadata
from ..origin_store.store import OriginStore

STATION_FILENAME = "station.json"
SIGNALS_DIRNAME = "signals"
STATION_FORMAT = "RM-STATION-1"

# Tolerancia entre la duración declarada por el backend de audio (CAR) y la
# duración real del binario emitido, decodificado de vuelta por el backend
# de espectro (ADR-007). Por encima de esto es refutación, no se parchea
# (riesgo anotado en Milestone 5, MODEL_REFUTATIONS.md).
DURATION_MISMATCH_TOLERANCE_SECONDS = 0.05


class Linker:
    """Linker mínimo (Milestone 3, extendido en Milestone 4). Consume
    señales del pipeline nuevo (OriginStore -> Frontend -> backend) y emite
    station.json + signals/. Dueño de orden, epoch declarado e índice de la
    estación (CONTRACTS.md, sección Linker). No recompila señales.

    El backend es inyectable (PCMBackend por defecto, RSIG-1); un backend
    que además emita un binario adyacente (p.ej. AACBackend, RSIG-2,
    ADR-011) es soportado sin que el linker conozca códecs.

    El epoch es un dato declarado por quien invoca el linker (ADR-008):
    nunca se calcula aquí con now()."""

    def __init__(
        self,
        store: Optional[OriginStore] = None,
        frontend: Optional[Frontend] = None,
        backend: Optional[PCMBackend] = None,
        spectrum_backend: Optional[SpectrumBackend] = None,
    ):
        self.store = store or OriginStore()
        self.frontend = frontend or Frontend()
        self.backend = backend or PCMBackend()
        self.spectrum_backend = spectrum_backend or SpectrumBackend()
        # Refutaciones de duración detectadas en el último link() — ver
        # DURATION_MISMATCH_TOLERANCE_SECONDS. No se parchea aquí: se
        # expone para que quien invoque el linker las registre.
        self.duration_mismatches: list[dict] = []

    def link(
        self,
        youtube_ids: list[str],
        epoch: str,
        name: str,
        output_dir: Path,
        declared_metadata: Optional[dict] = None,
    ) -> Path:

        declared_metadata = declared_metadata or {}
        self.duration_mismatches = []

        signals_dir = output_dir / SIGNALS_DIRNAME
        signals_dir.mkdir(parents=True, exist_ok=True)

        signal_refs = [
            self._link_signal(
                youtube_id, index, signals_dir, declared_metadata.get(youtube_id)
            )
            for index, youtube_id in enumerate(youtube_ids, start=1)
        ]

        total_duration = sum(ref["duration"] for ref in signal_refs)

        station_doc = {
            "format": STATION_FORMAT,
            "station": {
                "name": name,
                "epoch": epoch,
            },
            "totalDuration": total_duration,
            "signals": signal_refs,
        }

        station_path = output_dir / STATION_FILENAME
        station_path.write_text(
            json.dumps(station_doc, sort_keys=True, indent=2),
            encoding="utf-8",
        )

        return station_path

    def _link_signal(
        self,
        youtube_id: str,
        index: int,
        signals_dir: Path,
        declared: Optional[dict],
    ) -> dict:

        acquisition = self.store.acquire(youtube_id)
        car = self.frontend.decode(acquisition)
        rsig = self.backend.encode(car, signal_id=youtube_id, provider="youtube")

        # RSIG-2 (ADR-011): el backend devuelve el binario aparte del
        # manifiesto bajo claves privadas; el linker lo escribe como archivo
        # adyacente y referencia su nombre en el manifiesto. RSIG-1 no las
        # produce, así que este bloque es un no-op para PCMBackend.
        audio_bytes = rsig.pop("_binary", None)
        audio_ext = rsig.pop("_binary_ext", None)

        if audio_bytes is not None:
            audio_filename = f"signal_{index:03}.{audio_ext}"
            (signals_dir / audio_filename).write_bytes(audio_bytes)
            rsig["audioFile"] = audio_filename

            # Espectro como backend de datos (ADR-007): deriva del binario
            # ya emitido, no de la CAR. De paso, la duración real decodificada
            # permite contrastar contra la duración declarada por el backend
            # de audio (riesgo de priming/padding AAC, Milestone 5).
            frames, decoded_duration = self.spectrum_backend.analyze(audio_bytes, audio_ext)
            spectrum_path = signals_dir / f"{youtube_id}.json"
            spectrum_path.write_text(json.dumps(frames), encoding="utf-8")

            if abs(decoded_duration - rsig["duration"]) > DURATION_MISMATCH_TOLERANCE_SECONDS:
                self.duration_mismatches.append({
                    "id": youtube_id,
                    "declared_duration": rsig["duration"],
                    "decoded_duration": decoded_duration,
                })

        filename = f"signal_{index:03}.rsig"
        data = json.dumps(rsig, sort_keys=True).encode("utf-8")
        (signals_dir / filename).write_bytes(data)

        extracted = extract_from_raw_metadata(acquisition.acta.get("raw_metadata", {}))
        metadata = resolve_metadata(declared, extracted)

        return {
            "file": filename,
            "id": rsig["id"],
            "duration": rsig["duration"],
            **metadata,
        }
