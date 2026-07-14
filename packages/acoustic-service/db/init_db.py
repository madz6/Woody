"""Bootstrap script — creates data/woody.db with schema applied.

Run once before scripts/seed_corpus.py:
    python -m db.init_db

Idempotent: safe to re-run; existing data is preserved.
"""

from __future__ import annotations

import sys

from db.embeddings import count_embeddings, get_db, get_db_path, init_schema


def main() -> int:
    path = get_db_path()
    print(f"Initialising sqlite-vec database at {path}")
    conn = get_db()
    init_schema(conn)
    conn.commit()
    n = count_embeddings(conn)
    print(f"Schema applied. {n} embeddings currently stored.")
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
