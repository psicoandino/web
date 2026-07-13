import os
from dataclasses import dataclass


@dataclass
class AudioComponent:

    filename: str
    format_id: str
    sha256: str


@dataclass
class Acquisition:

    acquisition_hash: str
    directory: str
    components: list[AudioComponent]
    acta: dict

    @property
    def audio_path(self) -> str:

        return os.path.join(self.directory, self.components[0].filename)
