"""CLAP encoder service — primary navigation layer.

Loads laion/larger_clap_music_and_speech once at process start. Provides
embed_text() and embed_audio() returning L2-normalised 512-dim float32 vectors.

Hard rules (anti-slop checklist enforced):
  - All returned vectors are L2-normalised (||v|| == 1.0) before they leave this module
  - Audio embeddings are 512-dim; reject any other shape at the boundary
  - Model is loaded ONCE in a process-global singleton; never per-request
  - eval() mode is set on construction; no gradient computation
"""

from __future__ import annotations

import io
import logging
import shutil
import subprocess
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Heavy imports are deferred so module import doesn't crash without torch installed
# (e.g. linting, doc generation). Resolved at CLAPService construction time.
_torch = None
_transformers = None
_librosa = None


def _lazy_import():
    """Load torch/transformers/librosa once when CLAPService is first constructed."""
    global _torch, _transformers, _librosa
    if _torch is None:
        import torch  # noqa: PLC0415
        import transformers  # noqa: PLC0415
        import librosa  # noqa: PLC0415

        _torch = torch
        _transformers = transformers
        _librosa = librosa
    return _torch, _transformers, _librosa


MODEL_ID = "laion/larger_clap_music_and_speech"
EMBEDDING_DIM = 512
CLAP_AUDIO_SR = 48_000  # CLAP processor expects 48 kHz audio


def _l2_normalise(vec: np.ndarray) -> np.ndarray:
    """Project vector onto the unit hypersphere. Required before storage."""
    norm = float(np.linalg.norm(vec))
    if norm < 1e-8:
        # Degenerate input (silent audio, empty text). Return zero vector; callers
        # treat zero-norm output as a failed embed and skip the track.
        return vec.astype(np.float32)
    return (vec / norm).astype(np.float32)


class CLAPService:
    """Singleton wrapper around laion/larger_clap_music_and_speech."""

    def __init__(self) -> None:
        torch, transformers, _ = _lazy_import()
        logger.info("CLAPService: loading %s ...", MODEL_ID)
        self.processor = transformers.ClapProcessor.from_pretrained(MODEL_ID)
        self.model = transformers.ClapModel.from_pretrained(MODEL_ID)
        self.model.eval()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        logger.info("CLAPService: ready on %s", self.device)

    def embed_text(self, text: str) -> np.ndarray:
        """Return L2-normalised 512-dim text embedding."""
        torch, _, _ = _lazy_import()
        if not text or not text.strip():
            raise ValueError("embed_text: text must be non-empty")
        inputs = self.processor(text=[text], return_tensors="pt", padding=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            features = self.model.get_text_features(**inputs)
        vec = features[0].cpu().numpy()
        out = _l2_normalise(vec)
        if out.shape != (EMBEDDING_DIM,):
            raise RuntimeError(f"embed_text: expected dim {EMBEDDING_DIM}, got {out.shape}")
        return out

    def embed_audio(self, audio_array: np.ndarray, sr: Optional[int] = None) -> np.ndarray:
        """Return L2-normalised 512-dim audio embedding.

        audio_array must be a mono float32 waveform. If sr != CLAP_AUDIO_SR
        the audio is resampled via librosa first.
        """
        torch, _, librosa = _lazy_import()
        if audio_array.ndim != 1:
            raise ValueError(f"embed_audio: expected 1-D mono waveform, got shape {audio_array.shape}")
        if sr is None:
            sr = CLAP_AUDIO_SR
        if sr != CLAP_AUDIO_SR:
            audio_array = librosa.resample(audio_array.astype(np.float32), orig_sr=sr, target_sr=CLAP_AUDIO_SR)
            sr = CLAP_AUDIO_SR

        inputs = self.processor(audios=audio_array, sampling_rate=sr, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            features = self.model.get_audio_features(**inputs)
        vec = features[0].cpu().numpy()
        out = _l2_normalise(vec)
        if out.shape != (EMBEDDING_DIM,):
            raise RuntimeError(f"embed_audio: expected dim {EMBEDDING_DIM}, got {out.shape}")
        return out

    def _decode_audio_bytes(self, audio_bytes: bytes) -> tuple[np.ndarray, int]:
        """Decode mp3/m4a/wav bytes to mono float32 @ CLAP_AUDIO_SR."""
        _, _, librosa = _lazy_import()
        buf = io.BytesIO(audio_bytes)
        try:
            audio, sr = librosa.load(buf, sr=CLAP_AUDIO_SR, mono=True, duration=30.0)
            if audio.size > 0:
                return audio.astype(np.float32), sr
        except Exception:
            pass

        # iTunes previews are AAC-in-m4a; soundfile cannot read them from BytesIO on Windows.
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            raise ValueError("embed_audio_from_bytes: ffmpeg required for m4a/aac previews")

        proc = subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                "pipe:0",
                "-f",
                "wav",
                "-acodec",
                "pcm_s16le",
                "-ar",
                str(CLAP_AUDIO_SR),
                "-ac",
                "1",
                "-t",
                "30",
                "pipe:1",
            ],
            input=audio_bytes,
            capture_output=True,
            check=True,
        )
        wav_buf = io.BytesIO(proc.stdout)
        audio, sr = librosa.load(wav_buf, sr=CLAP_AUDIO_SR, mono=True)
        if audio.size == 0:
            raise ValueError("embed_audio_from_bytes: decoded audio is empty")
        return audio.astype(np.float32), sr

    def embed_audio_from_bytes(self, audio_bytes: bytes) -> np.ndarray:
        """Decode arbitrary audio bytes (mp3/m4a/wav) then embed."""
        audio, sr = self._decode_audio_bytes(audio_bytes)
        return self.embed_audio(audio, sr=sr)


# Process-global singleton -----------------------------------------------------

_clap: Optional[CLAPService] = None


def get_clap() -> CLAPService:
    """Return the process-wide CLAPService, constructing on first call."""
    global _clap
    if _clap is None:
        _clap = CLAPService()
    return _clap


def is_clap_loaded() -> bool:
    """True if the model is in memory. Used by /health to avoid forcing a load."""
    return _clap is not None
