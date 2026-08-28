"""Local aspect-analysis lab for user-supplied audio.

This script never fetches or records Spotify audio. It consumes a Woody browser
research export plus an explicit track-id -> local-file mapping.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Iterable, Optional

import librosa
import numpy as np

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from db.embeddings import pack_embedding, unpack_embedding  # noqa: E402
from services.clap_service import get_clap  # noqa: E402

ANALYSIS_VERSION = "aspect-lab-v1"
TARGET_SAMPLE_RATE = 48_000
STEMS = ("full", "drums", "bass", "vocals", "other")


def initialise_database(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS aspect_assets (
            track_id TEXT PRIMARY KEY,
            file_hash TEXT NOT NULL,
            source_path TEXT NOT NULL,
            duration_ms INTEGER NOT NULL,
            sample_rate INTEGER NOT NULL,
            analyzed_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS aspect_segments (
            capture_id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            track_id TEXT NOT NULL,
            track_name TEXT NOT NULL,
            artist TEXT NOT NULL,
            label TEXT,
            user_text TEXT,
            window_start_ms INTEGER NOT NULL,
            window_end_ms INTEGER NOT NULL,
            status TEXT NOT NULL,
            error TEXT,
            analysis_version TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS aspect_vectors (
            capture_id TEXT NOT NULL,
            stem TEXT NOT NULL,
            clap_vec BLOB NOT NULL,
            rhythm_json TEXT NOT NULL,
            melody_json TEXT NOT NULL,
            timbre_json TEXT NOT NULL,
            PRIMARY KEY (capture_id, stem)
        );
        """
    )
    connection.commit()


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def fixed_sequence(values: np.ndarray, size: int) -> np.ndarray:
    flattened = np.nan_to_num(np.asarray(values, dtype=np.float32).reshape(-1))
    if flattened.size == 0:
        return np.zeros(size, dtype=np.float32)
    if flattened.size == 1:
        return np.repeat(flattened, size).astype(np.float32)
    source = np.linspace(0.0, 1.0, flattened.size)
    target = np.linspace(0.0, 1.0, size)
    return np.interp(target, source, flattened).astype(np.float32)


def normalise_features(values: np.ndarray) -> np.ndarray:
    vector = np.nan_to_num(np.asarray(values, dtype=np.float32).reshape(-1))
    norm = float(np.linalg.norm(vector))
    return vector if norm < 1e-8 else vector / norm


def extract_features(audio: np.ndarray, sample_rate: int) -> dict[str, list[float]]:
    hop_length = 512
    onset = librosa.onset.onset_strength(y=audio, sr=sample_rate, hop_length=hop_length)
    tempogram = librosa.feature.tempogram(onset_envelope=onset, sr=sample_rate, hop_length=hop_length)
    _, beat_frames = librosa.beat.beat_track(onset_envelope=onset, sr=sample_rate, hop_length=hop_length)
    beat_times = librosa.frames_to_time(beat_frames, sr=sample_rate, hop_length=hop_length)
    beat_intervals = np.diff(beat_times)
    rhythm = normalise_features(np.concatenate([
        fixed_sequence(onset, 64),
        fixed_sequence(np.mean(tempogram, axis=1), 64),
        fixed_sequence(beat_intervals, 16),
        np.array([len(beat_frames) / max(1.0, len(audio) / sample_rate)], dtype=np.float32),
    ]))

    chroma = librosa.feature.chroma_cqt(y=audio, sr=sample_rate, hop_length=hop_length)
    chroma_temporal = np.concatenate([fixed_sequence(row, 8) for row in chroma])
    try:
        pitch, _, _ = librosa.pyin(
            audio,
            fmin=float(librosa.note_to_hz("C2")),
            fmax=float(librosa.note_to_hz("C7")),
            sr=sample_rate,
            hop_length=hop_length,
        )
        pitch_values = np.nan_to_num(pitch, nan=0.0)
    except Exception:
        pitch_values = np.zeros(1, dtype=np.float32)
    melody = normalise_features(np.concatenate([
        np.mean(chroma, axis=1),
        np.std(chroma, axis=1),
        chroma_temporal,
        fixed_sequence(pitch_values, 32),
    ]))

    mfcc = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=20)
    spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=sample_rate)
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=audio, sr=sample_rate)
    spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sample_rate)
    timbre = normalise_features(np.concatenate([
        np.mean(mfcc, axis=1),
        np.std(mfcc, axis=1),
        np.array([
            np.mean(spectral_centroid), np.std(spectral_centroid),
            np.mean(spectral_bandwidth), np.std(spectral_bandwidth),
            np.mean(spectral_rolloff), np.std(spectral_rolloff),
        ], dtype=np.float32),
    ]))
    return {"rhythm": rhythm.tolist(), "melody": melody.tolist(), "timbre": timbre.tolist()}


def load_audio(path: Path) -> tuple[np.ndarray, int]:
    audio, sample_rate = librosa.load(path, sr=TARGET_SAMPLE_RATE, mono=True)
    if audio.size == 0:
        raise ValueError(f"Decoded audio is empty: {path}")
    return audio.astype(np.float32), sample_rate


def separate_stems(audio_path: Path, output_root: Path) -> dict[str, Path]:
    command = [
        sys.executable,
        "-m",
        "demucs.separate",
        "-n",
        "htdemucs",
        "-o",
        str(output_root),
        str(audio_path),
    ]
    subprocess.run(command, check=True, capture_output=True, text=True)
    track_directory = output_root / "htdemucs" / audio_path.stem
    paths = {stem: track_directory / f"{stem}.wav" for stem in STEMS if stem != "full"}
    missing = [stem for stem, path in paths.items() if not path.exists()]
    if missing:
        raise RuntimeError(f"Stem separation missing outputs: {', '.join(missing)}")
    return paths


def extract_window(audio: np.ndarray, sample_rate: int, start_ms: int, end_ms: int) -> np.ndarray:
    start_sample = max(0, int(start_ms / 1000 * sample_rate))
    end_sample = min(audio.size, int(end_ms / 1000 * sample_rate))
    segment = audio[start_sample:end_sample]
    if segment.size < sample_rate:
        raise ValueError("Marked window contains less than one second of audio")
    return segment.astype(np.float32)


def exported_captures(export_path: Path) -> list[dict]:
    payload = json.loads(export_path.read_text(encoding="utf-8"))
    captures: list[dict] = []
    for session in payload.get("sessions", []):
        if session.get("version") != 2:
            continue
        captures.extend(session.get("aspectCaptures", []))
    return captures


def load_mapping(mapping_path: Path) -> dict[str, Path]:
    raw = json.loads(mapping_path.read_text(encoding="utf-8"))
    base = mapping_path.parent
    return {
        track_id: (Path(path) if Path(path).is_absolute() else base / path).resolve()
        for track_id, path in raw.items()
    }


def store_vector(
    connection: sqlite3.Connection,
    capture_id: str,
    stem: str,
    clap_vector: np.ndarray,
    features: dict[str, list[float]],
) -> None:
    connection.execute(
        """INSERT OR REPLACE INTO aspect_vectors
              (capture_id, stem, clap_vec, rhythm_json, melody_json, timbre_json)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            capture_id,
            stem,
            pack_embedding(clap_vector),
            json.dumps(features["rhythm"]),
            json.dumps(features["melody"]),
            json.dumps(features["timbre"]),
        ),
    )


def analyze_export(export_path: Path, mapping_path: Path, database_path: Path) -> None:
    mapping = load_mapping(mapping_path)
    captures = exported_captures(export_path)
    connection = sqlite3.connect(database_path)
    initialise_database(connection)
    clap = get_clap()
    captures_by_track: dict[str, list[dict]] = {}
    for capture in captures:
        captures_by_track.setdefault(capture["track"]["id"], []).append(capture)

    for track_id, track_captures in captures_by_track.items():
        audio_path = mapping.get(track_id)
        if not audio_path or not audio_path.exists():
            for capture in track_captures:
                connection.execute(
                    """INSERT OR REPLACE INTO aspect_segments
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'failed', ?, ?)""",
                    (
                        capture["id"], capture["sessionId"], track_id, capture["track"]["name"],
                        capture["track"]["artist"], capture.get("label"), capture.get("userText"),
                        capture["provisionalWindowStartMs"], capture["provisionalWindowEndMs"],
                        "audio_mapping_missing", ANALYSIS_VERSION,
                    ),
                )
            continue
        try:
            full_audio, sample_rate = load_audio(audio_path)
            with tempfile.TemporaryDirectory(prefix="woody-aspect-") as temporary:
                stem_paths = separate_stems(audio_path, Path(temporary))
                stem_audio = {"full": full_audio}
                for stem, path in stem_paths.items():
                    stem_audio[stem] = load_audio(path)[0]
            connection.execute(
                """INSERT OR REPLACE INTO aspect_assets
                   (track_id, file_hash, source_path, duration_ms, sample_rate)
                   VALUES (?, ?, ?, ?, ?)""",
                (track_id, file_hash(audio_path), str(audio_path), round(full_audio.size / sample_rate * 1000), sample_rate),
            )
            for capture in track_captures:
                start_ms = int(capture["provisionalWindowStartMs"])
                end_ms = int(capture["provisionalWindowEndMs"])
                connection.execute(
                    """INSERT OR REPLACE INTO aspect_segments
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'analyzed', NULL, ?)""",
                    (
                        capture["id"], capture["sessionId"], track_id, capture["track"]["name"],
                        capture["track"]["artist"], capture.get("label"), capture.get("userText"),
                        start_ms, end_ms, ANALYSIS_VERSION,
                    ),
                )
                for stem in STEMS:
                    segment = extract_window(stem_audio[stem], sample_rate, start_ms, end_ms)
                    store_vector(connection, capture["id"], stem, clap.embed_audio(segment, sample_rate), extract_features(segment, sample_rate))
                connection.commit()
        except Exception as error:
            for capture in track_captures:
                connection.execute(
                    """INSERT OR REPLACE INTO aspect_segments
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'failed', ?, ?)""",
                    (
                        capture["id"], capture["sessionId"], track_id, capture["track"]["name"],
                        capture["track"]["artist"], capture.get("label"), capture.get("userText"),
                        capture["provisionalWindowStartMs"], capture["provisionalWindowEndMs"],
                        f"{type(error).__name__}: {error}", ANALYSIS_VERSION,
                    ),
                )
            connection.commit()
    connection.close()


def cosine_distance(left: np.ndarray, right: np.ndarray) -> float:
    denominator = float(np.linalg.norm(left) * np.linalg.norm(right))
    return 1.0 if denominator < 1e-8 else float(1.0 - np.dot(left, right) / denominator)


def percentile_ranks(values: dict[str, float]) -> dict[str, float]:
    ordered = sorted(values.items(), key=lambda item: (item[1], item[0]))
    denominator = max(1, len(ordered) - 1)
    return {capture_id: rank / denominator for rank, (capture_id, _) in enumerate(ordered)}


def mean_percentile_rank(channels: Iterable[dict[str, float]]) -> dict[str, float]:
    ranked = [percentile_ranks(channel) for channel in channels]
    common = set.intersection(*(set(channel) for channel in ranked)) if ranked else set()
    return {capture_id: float(np.mean([channel[capture_id] for channel in ranked])) for capture_id in common}


def vector_rows(connection: sqlite3.Connection, stem: str) -> dict[str, dict[str, np.ndarray]]:
    rows = connection.execute(
        "SELECT capture_id, clap_vec, rhythm_json, melody_json, timbre_json FROM aspect_vectors WHERE stem = ?",
        (stem,),
    ).fetchall()
    return {
        row[0]: {
            "clap": unpack_embedding(row[1]),
            "rhythm": np.asarray(json.loads(row[2]), dtype=np.float32),
            "melody": np.asarray(json.loads(row[3]), dtype=np.float32),
            "timbre": np.asarray(json.loads(row[4]), dtype=np.float32),
        }
        for row in rows
    }


def distances(query: np.ndarray, candidates: dict[str, dict[str, np.ndarray]], feature: str, excluded_id: str) -> dict[str, float]:
    return {
        capture_id: cosine_distance(query, values[feature])
        for capture_id, values in candidates.items()
        if capture_id != excluded_id
    }


def compare_capture(database_path: Path, capture_id: str) -> dict:
    connection = sqlite3.connect(database_path)
    segment = connection.execute(
        "SELECT label, user_text FROM aspect_segments WHERE capture_id = ? AND status = 'analyzed'",
        (capture_id,),
    ).fetchone()
    if not segment:
        raise ValueError("Capture is not analyzed")
    label = segment[0] or "other"
    full = vector_rows(connection, "full")
    if capture_id not in full:
        raise ValueError("Capture has no full-segment vector")
    baseline = distances(full[capture_id]["clap"], full, "clap", capture_id)

    stem = {"beat": "drums", "bass": "bass", "melody": "other", "vocal": "vocals"}.get(label, "other")
    stem_vectors = vector_rows(connection, stem)
    if capture_id not in stem_vectors:
        raise ValueError(f"Capture has no {stem} vector")
    clap_channel = distances(stem_vectors[capture_id]["clap"], stem_vectors, "clap", capture_id)
    feature_name: Optional[str] = {
        "beat": "rhythm",
        "bass": "rhythm",
        "melody": "melody",
        "instrument_sound": "timbre",
    }.get(label)
    channels = [clap_channel]
    if feature_name:
        channels.append(distances(stem_vectors[capture_id][feature_name], stem_vectors, feature_name, capture_id))
    aspect_scores = mean_percentile_rank(channels)
    baseline_id = min(baseline, key=baseline.get) if baseline else None
    aspect_id = min(aspect_scores, key=aspect_scores.get) if aspect_scores else None

    metadata_rows = connection.execute(
        "SELECT capture_id, track_id, track_name, artist, window_start_ms, window_end_ms FROM aspect_segments"
    ).fetchall()
    metadata = {row[0]: {"captureId": row[0], "trackId": row[1], "trackName": row[2], "artist": row[3], "windowStartMs": row[4], "windowEndMs": row[5]} for row in metadata_rows}
    connection.close()
    return {
        "queryCaptureId": capture_id,
        "requestedAspect": label,
        "baseline": metadata.get(baseline_id) if baseline_id else None,
        "aspectAware": {
            **(metadata.get(aspect_id) or {}),
            "matchedStem": stem,
            "meanPercentileRank": aspect_scores.get(aspect_id) if aspect_id else None,
            "analysisVersion": ANALYSIS_VERSION,
        } if aspect_id else None,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subcommands = parser.add_subparsers(dest="command", required=True)
    analyze = subcommands.add_parser("analyze", help="Analyze exported captures against mapped local files")
    analyze.add_argument("--export", type=Path, required=True)
    analyze.add_argument("--mapping", type=Path, required=True)
    analyze.add_argument("--db", type=Path, default=SERVICE_ROOT / "data" / "aspect_lab.db")
    compare = subcommands.add_parser("compare", help="Compare aspect-aware retrieval with whole-segment CLAP")
    compare.add_argument("--capture-id", required=True)
    compare.add_argument("--db", type=Path, default=SERVICE_ROOT / "data" / "aspect_lab.db")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.db.parent.mkdir(parents=True, exist_ok=True)
    if args.command == "analyze":
        analyze_export(args.export, args.mapping, args.db)
        print(json.dumps({"status": "complete", "database": str(args.db)}, indent=2))
    else:
        print(json.dumps(compare_capture(args.db, args.capture_id), indent=2))


if __name__ == "__main__":
    main()
