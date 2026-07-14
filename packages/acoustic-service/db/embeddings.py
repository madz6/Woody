"""Embedding storage helpers (sqlite-vec).

Pack/unpack semantics:
  pack_embedding(vec)   -> bytes (little-endian float32, length 512*4 = 2048 bytes)
  unpack_embedding(blob)-> np.ndarray shape (512,)

The vec_tracks virtual table holds embeddings indexed for cosine kNN. The
companion track_embeddings table holds the same vector as BLOB plus all the
auxiliary fields (5D coords, Spotify features). Inserts touch both tables.
"""

from __future__ import annotations

import os
import sqlite3
import struct
from pathlib import Path
from typing import Optional

import numpy as np
import sqlite_vec

from services.clap_service import EMBEDDING_DIM

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "woody.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def get_db_path() -> Path:
    override = os.environ.get("WOODY_DB_PATH")
    return Path(override) if override else DEFAULT_DB_PATH


def get_db(*, readonly: bool = False) -> sqlite3.Connection:
    """Return a SQLite connection with sqlite-vec loaded."""
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    uri = f"file:{path}?mode=ro" if readonly else f"file:{path}"
    conn = sqlite3.connect(uri, uri=True)
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    conn.row_factory = sqlite3.Row
    return conn


def pack_embedding(vec: np.ndarray) -> bytes:
    if vec.shape != (EMBEDDING_DIM,):
        raise ValueError(f"pack_embedding: expected shape ({EMBEDDING_DIM},), got {vec.shape}")
    return struct.pack(f"{EMBEDDING_DIM}f", *vec.astype(np.float32))


def unpack_embedding(blob: bytes) -> np.ndarray:
    n = len(blob) // 4
    if n != EMBEDDING_DIM:
        raise ValueError(f"unpack_embedding: expected {EMBEDDING_DIM} floats, got {n}")
    return np.array(struct.unpack(f"{n}f", blob), dtype=np.float32)


def init_schema(conn: sqlite3.Connection) -> None:
    """Apply schema.sql + create the sqlite-vec virtual table."""
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    conn.executescript(schema_sql)
    # The vec0 virtual table cannot be created via executescript() reliably
    # because sqlite_vec requires single-statement executes.
    conn.execute(
        f"CREATE VIRTUAL TABLE IF NOT EXISTS vec_tracks USING vec0("
        f"track_id TEXT PRIMARY KEY, clap_vec FLOAT[{EMBEDDING_DIM}])"
    )
    conn.commit()


# ─── CRUD helpers ────────────────────────────────────────────────────────────


def upsert_track(
    conn: sqlite3.Connection,
    *,
    track_id: str,
    name: str,
    artist: str,
    album: Optional[str] = None,
    spotify_uri: Optional[str] = None,
    preview_url: Optional[str] = None,
    audio_url_used: Optional[str] = None,
    audio_source: Optional[str] = None,
    duration_ms: Optional[int] = None,
    seed_query: Optional[str] = None,
) -> None:
    conn.execute(
        """INSERT INTO tracks
              (id, name, artist, album, spotify_uri, preview_url,
               audio_url_used, audio_source, duration_ms, seed_query)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              artist = excluded.artist,
              album = excluded.album,
              spotify_uri = excluded.spotify_uri,
              preview_url = excluded.preview_url,
              audio_url_used = COALESCE(excluded.audio_url_used, tracks.audio_url_used),
              audio_source = COALESCE(excluded.audio_source, tracks.audio_source),
              duration_ms = excluded.duration_ms,
              seed_query = COALESCE(excluded.seed_query, tracks.seed_query),
              updated_at = unixepoch()
        """,
        (
            track_id, name, artist, album, spotify_uri, preview_url,
            audio_url_used, audio_source, duration_ms, seed_query,
        ),
    )


def store_embedding(
    conn: sqlite3.Connection,
    *,
    track_id: str,
    embedding: np.ndarray,
    spotify_features: Optional[dict] = None,
    coords_5d: Optional[dict] = None,
) -> None:
    blob = pack_embedding(embedding)
    sf = spotify_features or {}
    c5 = coords_5d or {}
    conn.execute(
        """INSERT INTO track_embeddings
              (track_id, clap_vec,
               spotify_energy, spotify_valence, spotify_acousticness,
               spotify_instrumentalness, spotify_loudness, spotify_tempo,
               energy_5d, warmth_5d, density_5d, organicity_5d, sacred_5d)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(track_id) DO UPDATE SET
              clap_vec = excluded.clap_vec,
              spotify_energy = COALESCE(excluded.spotify_energy, track_embeddings.spotify_energy),
              spotify_valence = COALESCE(excluded.spotify_valence, track_embeddings.spotify_valence),
              spotify_acousticness = COALESCE(excluded.spotify_acousticness, track_embeddings.spotify_acousticness),
              spotify_instrumentalness = COALESCE(excluded.spotify_instrumentalness, track_embeddings.spotify_instrumentalness),
              spotify_loudness = COALESCE(excluded.spotify_loudness, track_embeddings.spotify_loudness),
              spotify_tempo = COALESCE(excluded.spotify_tempo, track_embeddings.spotify_tempo),
              energy_5d = COALESCE(excluded.energy_5d, track_embeddings.energy_5d),
              warmth_5d = COALESCE(excluded.warmth_5d, track_embeddings.warmth_5d),
              density_5d = COALESCE(excluded.density_5d, track_embeddings.density_5d),
              organicity_5d = COALESCE(excluded.organicity_5d, track_embeddings.organicity_5d),
              sacred_5d = COALESCE(excluded.sacred_5d, track_embeddings.sacred_5d),
              embedded_at = unixepoch()
        """,
        (
            track_id, blob,
            sf.get("energy"), sf.get("valence"), sf.get("acousticness"),
            sf.get("instrumentalness"), sf.get("loudness"), sf.get("tempo"),
            c5.get("energy"), c5.get("warmth"), c5.get("density"),
            c5.get("organicity"), c5.get("sacred"),
        ),
    )
    conn.execute(
        "INSERT OR REPLACE INTO vec_tracks (track_id, clap_vec) VALUES (?, ?)",
        (track_id, blob),
    )


def is_embedded(conn: sqlite3.Connection, track_id: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM track_embeddings WHERE track_id = ? LIMIT 1", (track_id,)
    ).fetchone()
    return row is not None


def count_embeddings(conn: sqlite3.Connection) -> int:
    row = conn.execute("SELECT COUNT(*) FROM track_embeddings").fetchone()
    return int(row[0]) if row else 0


def find_nearest(
    conn: sqlite3.Connection,
    query_embedding: np.ndarray,
    k: int = 50,
    exclude_ids: Optional[list[str]] = None,
) -> list[dict]:
    """k-NN cosine search. Returns [{track_id, distance, ...metadata}] sorted ascending."""
    exclude = set(exclude_ids or [])
    blob = pack_embedding(query_embedding)
    # Over-fetch so excludes can be filtered in-Python without missing the true top-k
    fetch_k = k + len(exclude)
    rows = conn.execute(
        """SELECT v.track_id, v.distance, t.name, t.artist, t.album, t.spotify_uri,
                  t.audio_url_used, t.audio_source
             FROM vec_tracks v
             LEFT JOIN tracks t ON t.id = v.track_id
            WHERE v.clap_vec MATCH ? AND k = ?
         ORDER BY v.distance""",
        (blob, fetch_k),
    ).fetchall()
    results = []
    for r in rows:
        if r["track_id"] in exclude:
            continue
        results.append({
            "track_id": r["track_id"],
            "distance": float(r["distance"]),
            "name": r["name"],
            "artist": r["artist"],
            "album": r["album"],
            "spotify_uri": r["spotify_uri"],
            "audio_url_used": r["audio_url_used"],
            "audio_source": r["audio_source"],
        })
        if len(results) >= k:
            break
    return results


def load_embedding(conn: sqlite3.Connection, track_id: str) -> Optional[np.ndarray]:
    row = conn.execute(
        "SELECT clap_vec FROM track_embeddings WHERE track_id = ?", (track_id,)
    ).fetchone()
    if not row:
        return None
    return unpack_embedding(row["clap_vec"])
