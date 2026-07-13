import base64

import numpy as np
from pydub import AudioSegment

from .audio_pipeline import CHANNELS, SAMPLE_RATE
from .models import Signal


class SignalEncoder:

    def encode(self, pcm: AudioSegment, signal: Signal) -> dict:

        samples = np.array(pcm.get_array_of_samples(), dtype=np.int16)

        raw = samples.tobytes()

        payload = base64.b64encode(raw).decode("ascii")

        duration = len(samples) / SAMPLE_RATE

        return {
            "format": "RSIG-1",
            "id": signal.id,
            "provider": signal.source,
            "codec": {
                "type": "PCM_INT16_BASE64",
                "sampleRate": SAMPLE_RATE,
                "channels": CHANNELS,
                "sampleWidth": 16
            },
            "duration": duration,
            "payload": payload
        }
