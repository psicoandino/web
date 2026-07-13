from pathlib import Path

from .audio_pipeline import AudioPipeline
from .frequency_analyzer import FrequencyAnalyzer
from .publisher import Publisher
from .signal_encoder import SignalEncoder
from .station_builder import StationBuilder
from .validator import Validator


class Compiler:

    def __init__(self):

        self.audio = AudioPipeline()
        self.encoder = SignalEncoder()
        self.frequency = FrequencyAnalyzer()
        self.builder = StationBuilder()
        self.validator = Validator()
        self.publisher = Publisher()

    def compile(self, config: Path) -> None:

        station = self.builder.build(config)

        compiled = []
        metadatas = []
        spectrums = []

        for signal in station.signals:

            print("Downloading:", signal.id)

            pcm, metadata = self.audio.normalize(signal)

            rsig = self.encoder.encode(pcm, signal)
            spectrum = self.frequency.analyze(pcm)

            compiled.append(rsig)
            metadatas.append(metadata)
            spectrums.append(spectrum)

            print("Encoded:", signal.id, rsig["duration"], "seconds", "-", metadata.title or "(sin titulo)")

        self.validator.validate_station(station, compiled)

        self.publisher.publish(station, compiled, metadatas, spectrums)

        print("\nRADIO CREATED")
        print("----------------")
        print("Signals:", len(compiled))
        print("Duration:", sum(r["duration"] for r in compiled), "seconds")

    def validate(self, station: Path) -> None:

        self.validator.validate_file(station)

    def publish(self, build: Path) -> None:

        self.publisher.publish_directory(build)
