import asyncio
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from fastapi import HTTPException

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from routers.journey import (  # noqa: E402
    EnsureTrackRequest,
    JourneyNextRequest,
    _candidate_exclusions,
    _decision_score,
    _effective_skip_weight,
    _knownness,
    _select_with_relaxation,
    _stable_jitter,
    ensure_anchor,
    journey_next,
)


class FakeConnection:
    def close(self):
        pass

    def execute(self, *_args, **_kwargs):
        return self

    def fetchone(self):
        return None

    def commit(self):
        pass


class FakeClap:
    def embed_text(self, _text):
        vector = np.zeros(512, dtype=np.float32)
        vector[1] = 1.0
        return vector

    def embed_audio_from_bytes(self, _audio):
        vector = np.zeros(512, dtype=np.float32)
        vector[2] = 1.0
        return vector


def request(**overrides):
    values = {
        "session_id": "session",
        "decision_index": 0,
        "current_track_id": "current",
        "current_track_artist": "Current Artist",
        "anchor_track_ids": [],
        "anchor_signals": [{"field": "anchor.note", "text": "steady tension", "source": "user_text"}],
        "phase": "sustain",
        "phase_description": "steady movement",
    }
    values.update(overrides)
    return JourneyNextRequest(**values)


class SelectorUnitTests(unittest.TestCase):
    def test_exclusions_always_include_current_track(self):
        self.assertEqual(_candidate_exclusions("current", ["played"]), {"current", "played"})

    def test_deterministic_tie_breaking(self):
        first = _stable_jitter("session", 4, "track")
        self.assertEqual(first, _stable_jitter("session", 4, "track"))
        self.assertNotEqual(first, _stable_jitter("session", 5, "track"))

    def test_phase_weighting_changes_priority(self):
        sustain = _decision_score(phase="sustain", transition_distance=0.1, target_distance=0.5, familiarity_fit=0, skip_penalty=0)
        impact = _decision_score(phase="impact", transition_distance=0.1, target_distance=0.5, familiarity_fit=0, skip_penalty=0)
        self.assertLess(sustain, impact)

    def test_target_only_scoring_omits_transition_weight(self):
        score = _decision_score(phase="impact", transition_distance=None, target_distance=0.25, familiarity_fit=0.5, skip_penalty=0)
        self.assertAlmostEqual(score, 0.3)

    def test_knownness_balance(self):
        self.assertEqual(_knownness("known", "new", {"known"}, set()), "known_track")
        self.assertEqual(_knownness("new", "Artist", set(), {"artist"}), "known_artist")
        self.assertEqual(_knownness("new", "Other", set(), set()), "unseen")

    def test_skip_penalty_decays_for_three_decisions(self):
        self.assertEqual(_effective_skip_weight(0.9, 3), 0.9)
        self.assertAlmostEqual(_effective_skip_weight(0.9, 2), 0.6)
        self.assertAlmostEqual(_effective_skip_weight(0.9, 1), 0.3)

    def test_coherence_relaxation_and_same_artist_fallback(self):
        candidates = [
            {"track_id": "same", "score": 0.01, "transition_distance": 0.2, "same_artist": True},
            {"track_id": "other", "score": 0.2, "transition_distance": 0.6, "same_artist": False},
        ]
        selected, level = _select_with_relaxation(candidates)
        self.assertEqual(selected["track_id"], "other")
        self.assertEqual(level, 2)

    def test_missing_current_uses_target_only_and_empty_corpus_fails_visibly(self):
        connection = FakeConnection()
        candidate = np.zeros(512, dtype=np.float32)
        candidate[1] = 1.0
        candidate_row = {"track_id": "next", "name": "Next", "artist": "Other", "album": None, "spotify_uri": "spotify:track:next"}
        with (
            patch("routers.journey.get_db", return_value=connection),
            patch("routers.journey.load_embedding", side_effect=[None, candidate]),
            patch("routers.journey.find_nearest", return_value=[candidate_row]),
            patch("routers.journey.get_clap", return_value=FakeClap()),
        ):
            result = asyncio.run(journey_next(request()))
        self.assertEqual(result.selection_mode, "target_only")
        self.assertFalse(result.current_embedding_available)
        self.assertIsNone(result.transition_distance)
        self.assertLessEqual(result.confidence, 0.65)

        current = np.zeros(512, dtype=np.float32)
        current[0] = 1.0
        with patch("routers.journey.get_db", return_value=connection), patch("routers.journey.load_embedding", return_value=current), patch("routers.journey.find_nearest", return_value=[]), patch("routers.journey.get_clap", return_value=FakeClap()):
            with self.assertRaises(HTTPException) as empty_corpus:
                asyncio.run(journey_next(request()))
            self.assertEqual(empty_corpus.exception.detail, "empty_candidate_pool")

    def test_anchor_endpoint_is_lookup_only(self):
        connection = FakeConnection()
        request = EnsureTrackRequest(
            track_id="anchor",
            name="Track",
            artist="Artist",
            preview_url="https://p.scdn.co/preview.mp3",
        )
        with (
            patch("routers.journey.get_db", return_value=connection),
            patch("routers.journey.load_embedding", return_value=None),
        ):
            result = asyncio.run(ensure_anchor(request))

        self.assertFalse(result.embedded)
        self.assertFalse(result.created)
        self.assertIsNone(result.audio_source)


class ServiceAuthenticationTests(unittest.TestCase):
    def test_non_health_endpoint_rejects_missing_token(self):
        os.environ["WOODY_SERVICE_TOKEN"] = "test-secret"
        from fastapi.testclient import TestClient
        import main

        previous_token = main.SERVICE_TOKEN
        previous_allow = main.ALLOW_UNAUTHENTICATED
        main.SERVICE_TOKEN = "test-secret"
        main.ALLOW_UNAUTHENTICATED = False
        try:
            client = TestClient(main.app)
            self.assertEqual(client.get("/health").status_code, 200)
            self.assertEqual(client.get("/openapi.json").status_code, 401)
            self.assertEqual(client.get("/openapi.json", headers={"Authorization": "Bearer test-secret"}).status_code, 200)
        finally:
            main.SERVICE_TOKEN = previous_token
            main.ALLOW_UNAUTHENTICATED = previous_allow


if __name__ == "__main__":
    unittest.main()
