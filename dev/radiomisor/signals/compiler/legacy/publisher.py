import json
import os
from datetime import datetime, timezone
from pathlib import Path

from .models import StationDefinition, TrackMetadata

SIGNALS_FOLDER = "signals"
STATION_FILE = "station.json"


class Publisher:

    def publish(
        self,
        station: StationDefinition,
        rsigs: list[dict],
        metadatas: list[TrackMetadata],
        spectrums: list[list[list[int]]]
    ) -> None:

        os.makedirs(SIGNALS_FOLDER, exist_ok=True)

        signal_refs = []

        for index, (rsig, metadata, spectrum) in enumerate(zip(rsigs, metadatas, spectrums), start=1):

            filename = f"signal_{index:03}.rsig"

            path = os.path.join(SIGNALS_FOLDER, filename)

            with open(path, "w", encoding="utf-8") as f:
                json.dump(rsig, f)

            spectrum_path = os.path.join(SIGNALS_FOLDER, f"{rsig['id']}.json")

            with open(spectrum_path, "w", encoding="utf-8") as f:
                json.dump(spectrum, f)

            signal_refs.append({
                "file": filename,
                "id": rsig["id"],
                "duration": rsig["duration"],
                "title": metadata.title,
                "artist": metadata.artist,
                "album": metadata.album,
                "year": metadata.year
            })

        total_duration = sum(ref["duration"] for ref in signal_refs)

        now = datetime.now(timezone.utc).isoformat()

        station_doc = {
            "format": "RM-STATION-1",
            "station": {
                "name": station.name,
                "epoch": now,
                "created": now
            },
            "totalDuration": total_duration,
            "signals": signal_refs
        }

        with open(STATION_FILE, "w", encoding="utf-8") as f:
            json.dump(station_doc, f, indent=2)

    def publish_directory(self, directory: Path) -> None:

        raise NotImplementedError(
            "publish_directory is reserved for a future milestone"
        )
