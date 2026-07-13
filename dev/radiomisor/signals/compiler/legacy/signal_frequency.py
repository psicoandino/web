# !pip install yt-dlp numpy

import os
os.makedirs('signals', exist_ok=True)
print("Directory 'signals' is ready.")

import sys
import os
import subprocess
import json
import wave
import numpy as np

def download_audio(video_id, output_path):
    print(f"Downloading audio for {video_id}...")
    # Call yt-dlp to download and convert to wav
    cmd = [
        "yt-dlp",
        "-x",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "-o", output_path,
        f"https://www.youtube.com/watch?v={video_id}"
    ]
    subprocess.run(cmd, check=True)

def analyze_wav(wav_path, output_json_path):
    print(f"Analyzing {wav_path}...")
    with wave.open(wav_path, 'rb') as w:
        params = w.getparams()
        nchannels, sampwidth, framerate, nframes = params[:4]

        # Read entire file as raw data
        raw_data = w.readframes(nframes)

        # Convert to numpy array
        if sampwidth == 2:
            data = np.frombuffer(raw_data, dtype=np.int16)
        elif sampwidth == 1:
            data = np.frombuffer(raw_data, dtype=np.uint8) - 128
        else:
            raise ValueError("Unsupported sample width")

        # Convert stereo to mono
        if nchannels == 2:
            data = (data[0::2] + data[1::2]) // 2

    # Window size: 100ms
    window_duration = 0.1  # 100ms
    window_samples = int(framerate * window_duration)

    # 32 log-spaced frequency bins from 20Hz to 16000Hz
    freq_bins = np.logspace(np.log10(20), np.log10(16000), 33)

    # Determine the frequency index mapping
    fft_size = int(2 ** np.ceil(np.log2(window_samples)))
    freqs = np.fft.rfftfreq(fft_size, d=1.0/framerate)

    # Bin indices for grouping (1 to 32)
    bin_indices = np.digitize(freqs, freq_bins) - 1

    raw_frames = []

    # Iterate through chunks and calculate raw spectral band magnitudes
    for start in range(0, len(data) - window_samples, window_samples):
        chunk = data[start:start + window_samples]

        # Apply Hanning window to reduce spectral leakage
        windowed_chunk = chunk * np.hanning(len(chunk))

        # FFT
        fft_data = np.fft.rfft(windowed_chunk, n=fft_size)
        magnitudes = np.abs(fft_data)

        # Group into 32 bands
        bands = np.zeros(32)
        for i in range(32):
            mask = (bin_indices == i)
            if np.any(mask):
                bands[i] = np.mean(magnitudes[mask])
            else:
                bands[i] = 0
        raw_frames.append(bands)

    all_values = [v for frame in raw_frames for v in frame if v > 0]
    if all_values:
        peak_limit = np.percentile(all_values, 95)
    else:
        peak_limit = 1.0

    normalized_frames = []
    for frame in raw_frames:
        norm_frame = []
        for val in frame:
            if val <= 0:
                norm_frame.append(0)
            else:
                ratio = val / peak_limit
                scaled = int(np.sqrt(ratio) * 7.5)
                scaled = max(0, min(7, scaled))
                norm_frame.append(scaled)
        normalized_frames.append(norm_frame)

    with open(output_json_path, 'w') as f:
        json.dump(normalized_frames, f)

    print(f"Saved analysis to {output_json_path} ({len(normalized_frames)} frames)")

def process_video(video_id):
    temp_wav = f"temp_{video_id}.wav"
    output_json = f"signals/{video_id}.json"

    try:
        download_audio(video_id, temp_wav)
        analyze_wav(temp_wav, output_json)
    except Exception as e:
        print(f"Error processing {video_id}: {e}")
    finally:
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
            print("Cleaned up temp wav file.")


video_id = 'nfk6sCzRTbM'
process_video(video_id)