-- Woody embedding storage — Phase 1 (sqlite-vec)
-- See WOODY_BUILD_SPEC.md Section 4.1 for the canonical schema.

-- ─── Track metadata ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tracks (
    id              TEXT PRIMARY KEY,           -- Spotify track ID
    name            TEXT NOT NULL,
    artist          TEXT NOT NULL,
    album           TEXT,
    spotify_uri     TEXT,                       -- spotify:track:<id>
    preview_url     TEXT,                       -- Spotify CDN; may be NULL post-2024
    audio_url_used  TEXT,                       -- actual URL fetched (Spotify or iTunes)
    audio_source    TEXT,                       -- "preview_url" | "itunes" | NULL
    duration_ms     INTEGER,
    seed_query      TEXT,                       -- Spotify search query that surfaced this track
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

-- ─── CLAP embedding + 5D display projection ────────────────────────────────

CREATE TABLE IF NOT EXISTS track_embeddings (
    track_id                 TEXT PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
    clap_vec                 BLOB NOT NULL,     -- 512 × float32, little-endian packed
    -- Raw Spotify features stored alongside for legacy callers and 5D heuristic.
    -- For new app registrations these are typically NULL (audio-features API 403'd).
    spotify_energy           REAL,
    spotify_valence          REAL,
    spotify_acousticness     REAL,
    spotify_instrumentalness REAL,
    spotify_loudness         REAL,
    spotify_tempo            REAL,
    -- 5D display projection (display only, never used for navigation)
    energy_5d                REAL,
    warmth_5d                REAL,
    density_5d               REAL,
    organicity_5d            REAL,
    sacred_5d                REAL,
    embedded_at              INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_seed   ON tracks(seed_query);

-- ─── sqlite-vec virtual table for k-NN cosine search ───────────────────────
-- Created from Python (vec0 syntax must be invoked after sqlite_vec.load).
-- See db/embeddings.py:init_schema.
