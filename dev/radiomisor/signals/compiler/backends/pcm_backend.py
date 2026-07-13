import base64

from ..frontend.car import CAR
from .exceptions import BackendError


class PCMBackend:
    """CAR -> artefacto publicado (RSIG-1, PCM_INT16_BASE64). Único lugar
    del sistema donde se decide códec, sample rate y canales de salida —
    en este backend mínimo, iguales a los de la CAR de entrada, sin
    resample ni downmix adicionales."""

    def encode(self, car: CAR, signal_id: str, provider: str) -> dict:

        if car.sample_width != 2:
            raise BackendError(
                f"PCMBackend requires 16-bit PCM, got sample_width={car.sample_width}"
            )

        payload = base64.b64encode(car.pcm).decode("ascii")

        frame_count = len(car.pcm) // (car.sample_width * car.channels)
        duration = frame_count / car.sample_rate

        return {
            "format": "RSIG-1",
            "id": signal_id,
            "provider": provider,
            "codec": {
                "type": "PCM_INT16_BASE64",
                "sampleRate": car.sample_rate,
                "channels": car.channels,
                "sampleWidth": car.sample_width * 8,
            },
            "duration": duration,
            "payload": payload,
        }
