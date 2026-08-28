import sys
import unittest
from pathlib import Path

import numpy as np

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from scripts.aspect_lab import fixed_sequence, mean_percentile_rank, percentile_ranks  # noqa: E402


class AspectLabUnitTests(unittest.TestCase):
    def test_fixed_sequence_has_stable_shape(self):
        self.assertEqual(fixed_sequence(np.array([0.0, 1.0]), 8).shape, (8,))
        self.assertTrue(np.allclose(fixed_sequence(np.array([]), 4), np.zeros(4)))

    def test_percentile_rank_is_deterministic(self):
        values = {"far": 0.8, "near": 0.1, "middle": 0.4}
        self.assertEqual(percentile_ranks(values), {"near": 0.0, "middle": 0.5, "far": 1.0})

    def test_channel_combination_uses_mean_rank(self):
        first = {"a": 0.1, "b": 0.9}
        second = {"a": 0.8, "b": 0.2}
        self.assertEqual(mean_percentile_rank([first, second]), {"a": 0.5, "b": 0.5})


if __name__ == "__main__":
    unittest.main()
