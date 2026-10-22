window.PSICO_CONFIG = {
  seed: "psicoandino-radiomisor-field-002",
  cycleSeconds: 240,
  quality: "high", // low | medium | high
  profile: "refined", // refined | legacy (exact v0.2 behavior path)
  background: "hueso",
  audio: {
    mode: "synthetic", // synthetic | none | microphone | url
    url: "",
    gain: 0.18,
    fftSize: 1024,
    smoothing: 0.86
  },
  metadata: {
    enabled: true,
    url: "now-playing.json",
    pollMs: 5000,
    fallback: "PSICOANDINO — radiomisor"
  }
};
