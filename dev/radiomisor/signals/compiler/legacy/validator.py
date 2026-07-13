import json
from pathlib import Path

from .exceptions import ValidationError
from .models import StationDefinition


class Validator:

    def validate_station(self, station: StationDefinition, rsigs: list[dict]) -> None:

        if len(rsigs) != len(station.signals):
            raise ValidationError(
                f"Expected {len(station.signals)} encoded signals, got {len(rsigs)}"
            )

        for rsig in rsigs:

            if rsig.get("format") != "RSIG-1":
                raise ValidationError(f"Invalid signal format: {rsig.get('format')}")

        # TODO: checksums, broken references, stricter schema checks (future milestone)

    def validate_file(self, station_file: Path) -> None:

        data = json.loads(station_file.read_text(encoding="utf-8"))

        if data.get("format") != "RM-STATION-1":
            raise ValidationError(f"Invalid station format: {data.get('format')}")

        for ref in data.get("signals", []):
            signal_path = station_file.parent / "signals" / ref["file"]
            if not signal_path.exists():
                raise ValidationError(f"Missing signal file: {ref['file']}")
