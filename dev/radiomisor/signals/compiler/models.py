from dataclasses import dataclass
from typing import Optional


@dataclass
class Signal:

    id: str
    source: str


@dataclass
class StationDefinition:

    name: str
    signals: list[Signal]


@dataclass
class TrackMetadata:

    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    year: Optional[str] = None
