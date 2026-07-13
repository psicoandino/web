import numpy as np
from pydub import AudioSegment

from .audio_pipeline import SAMPLE_RATE

WINDOW_DURATION = 0.1  # 100ms
NUM_BANDS = 32
MIN_FREQ = 20
MAX_FREQ = 16000
MAX_LEVEL = 7


class FrequencyAnalyzer:

    def analyze(self, pcm: AudioSegment) -> list[list[int]]:

        data = np.array(pcm.get_array_of_samples(), dtype=np.int16)

        window_samples = int(SAMPLE_RATE * WINDOW_DURATION)

        freq_bins = np.logspace(np.log10(MIN_FREQ), np.log10(MAX_FREQ), NUM_BANDS + 1)

        fft_size = int(2 ** np.ceil(np.log2(window_samples)))
        freqs = np.fft.rfftfreq(fft_size, d=1.0 / SAMPLE_RATE)
        bin_indices = np.digitize(freqs, freq_bins) - 1

        raw_frames = []

        for start in range(0, len(data) - window_samples, window_samples):

            chunk = data[start:start + window_samples]
            windowed_chunk = chunk * np.hanning(len(chunk))

            fft_data = np.fft.rfft(windowed_chunk, n=fft_size)
            magnitudes = np.abs(fft_data)

            bands = np.zeros(NUM_BANDS)
            for i in range(NUM_BANDS):
                mask = (bin_indices == i)
                if np.any(mask):
                    bands[i] = np.mean(magnitudes[mask])
            raw_frames.append(bands)

        all_values = [v for frame in raw_frames for v in frame if v > 0]
        peak_limit = np.percentile(all_values, 95) if all_values else 1.0

        normalized_frames = []
        for frame in raw_frames:
            norm_frame = []
            for val in frame:
                if val <= 0:
                    norm_frame.append(0)
                else:
                    ratio = val / peak_limit
                    scaled = int(np.sqrt(ratio) * (MAX_LEVEL + 0.5))
                    norm_frame.append(max(0, min(MAX_LEVEL, scaled)))
            normalized_frames.append(norm_frame)

        return normalized_frames
