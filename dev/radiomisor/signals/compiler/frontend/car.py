import hashlib
from dataclasses import dataclass

HASHING_FORM = "car-hashing-form-v1"


@dataclass
class CAR:
    """D1-B: representación canónica del audio decodificado. Ver
    compiler/docs/CONTRACTS.md. Es un valor, no una unidad de trabajo."""

    pcm: bytes
    sample_rate: int
    channels: int
    sample_width: int
    acta: dict

    def identity(self) -> str:
        """Hash sobre la forma normal versionada (hashing_form), no sobre
        el acta: dos decodificaciones bit-idénticas comparten identidad
        aunque sus actas difieran en metadata de derivación."""

        header = "|".join([
            HASHING_FORM,
            str(self.sample_rate),
            str(self.channels),
            str(self.sample_width),
        ]).encode("utf-8")

        return hashlib.sha256(header + self.pcm).hexdigest()
