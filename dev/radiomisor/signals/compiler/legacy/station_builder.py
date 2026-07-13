from pathlib import Path

from .models import Signal, StationDefinition

DEFAULT_STATION_NAME = "Psicoandino Experimental Radio"


class StationBuilder:

    def build(self, config: Path) -> StationDefinition:

        ids = [
            line.strip()
            for line in config.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]

        signals = [Signal(id=video_id, source="youtube") for video_id in ids]

        return StationDefinition(name=DEFAULT_STATION_NAME, signals=signals)
