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
    _cached_text_embedding,
    _candidate_exclusions,
    _decision_score,
    _effective_skip_weight,
    _select_with_relaxation,
    _stable_jitter,
    ensure_anchor,
    journey_next,
)


class FakeConnection:
    def close(self):
        pass


class FakeClap:
    def embed_text(self, _text):
        vector = np.zeros(512, dtype=np.float32)
        vector[1] = 1.0
        return vector


def request(**overrides):
    values = {
        "session_id": "session",
        "decision_index": 0,
        "current_track_id": "current",
        "current_track_artist": "Current Artist",
        "start_track_id": "start",
        "direction": "steady confidence",
    }
    values.update(overrides)
    return JourneyNextRequest(**values)


class SelectorUnitTests(unittest.TestCase):
    def tearDown(self):
        _cached_text_embedding.cache_clear()

    def test_exclusions_always_include_current_track(self):
        self.assertEqual(_candidate_exclusions("current", ["played"]), {"current", "played"})

    def test_deterministic_tie_breaking(self):
        first = _stable_jitter("session", 4, "track")
        self.assertEqual(first, _stable_jitter("session", 4, "track"))
        self.assertNotEqual(first, _stable_jitter("session", 5, "track"))

    def test_default_score_uses_transition_and_target_only(self):
        score = _decision_score(transition_distance=0.1, target_distance=0.5, skip_penalty=0)
        self.assertAlmostEqual(score, 0.188)

    def test_closer_mode_prioritizes_transition_and_uses_target_as_tie_break(self):
        close = _decision_score(transition_distance=0.1, target_distance=0.9, skip_penalty=0, closer_to_current=True)
        farther = _decision_score(transition_distance=0.2, target_distance=0.0, skip_penalty=0, closer_to_current=True)
        self.assertLess(close, farther)

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

    def test_missing_current_is_rejected_instead_of_target_only_fallback(self):
        connection = FakeConnection()
        with patch("routers.journey.get_db", return_value=connection), patch("routers.journey.load_embedding", return_value=None):
            with self.assertRaises(HTTPException) as unsupported:
                asyncio.run(journey_next(request()))
        self.assertEqual(unsupported.exception.status_code, 409)
        self.assertEqual(unsupported.exception.detail, "unsupported_current_track")

    def test_supported_current_returns_coherent_decision(self):
        connection = FakeConnection()
        current = np.zeros(512, dtype=np.float32)
        current[0] = 1.0
        start = current.copy()
        candidate = np.zeros(512, dtype=np.float32)
        candidate[0] = 0.9
        candidate[1] = 0.1
        candidate /= np.linalg.norm(candidate)
        row = {"track_id": "next", "name": "Next", "artist": "Other", "album": None, "spotify_uri": "spotify:track:next"}
        load_values = {"current": current, "start": start, "next": candidate}
        with (
            patch("routers.journey.get_db", return_value=connection),
            patch("routers.journey.load_embedding", side_effect=lambda _connection, track_id: load_values.get(track_id)),
            patch("routers.journey.find_nearest", return_value=[row]),
            patch("routers.journey.get_clap", return_value=FakeClap()),
        ):
            result = asyncio.run(journey_next(request()))
        self.assertEqual(result.selection_mode, "coherent")
        self.assertTrue(result.current_embedding_available)
        self.assertIsInstance(result.transition_distance, float)

    def test_anchor_endpoint_is_lookup_only(self):
        connection = FakeConnection()
        anchor_request = EnsureTrackRequest(track_id="anchor", name="Track", artist="Artist")
        with patch("routers.journey.get_db", return_value=connection), patch("routers.journey.load_embedding", return_value=None):
            result = asyncio.run(ensure_anchor(anchor_request))
        self.assertFalse(result.embedded)
        self.assertFalse(result.created)


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
