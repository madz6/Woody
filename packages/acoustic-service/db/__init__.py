"""Embedding storage layer.

Phase 1: sqlite-vec (zero infrastructure, single file).
Phase 2: pgvector (drop-in replacement — see WOODY_BUILD_SPEC.md Section 4.2).

This module owns:
  - schema.sql           — table definitions
  - embeddings.py        — pack/unpack + get_db + CRUD helpers
  - init_db.py           — bootstrap script (creates DB from schema)
"""
