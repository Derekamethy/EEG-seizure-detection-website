"""Create deterministic synthetic EEG-like display data; never used for study metrics."""

from __future__ import annotations

import json
import math
import random
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "eegDemo.json"
FS = 32
DURATION = 120


def dft_band_energy(values: list[float], fs: int) -> list[float]:
    n = len(values)
    centered = [v - sum(values) / n for v in values]
    powers: list[float] = []
    for k in range(n // 2 + 1):
        re = sum(v * math.cos(2 * math.pi * k * i / n) for i, v in enumerate(centered))
        im = -sum(v * math.sin(2 * math.pi * k * i / n) for i, v in enumerate(centered))
        powers.append(re * re + im * im)
    bins = []
    for low in range(0, 40, 2):
        total = 0.0
        for k, power in enumerate(powers):
            freq = k * fs / n
            if low <= freq < low + 2:
                total += power
        bins.append(total)
    maximum = max(bins) or 1.0
    return [round(v / maximum, 5) for v in bins]


def main() -> None:
    rng = random.Random(6019)
    channels = {"F4-C4": [], "F3-C3": [], "FT9-FT10": []}
    points = FS * DURATION
    for i in range(points):
        t = i / FS
        ictal = math.exp(-((t - 62) / 10.5) ** 6)
        transient = math.exp(-((t - 24) / 1.4) ** 2)
        for index, name in enumerate(channels):
            phase = index * 0.7
            background = 18 * math.sin(2 * math.pi * (3.2 + index * 0.35) * t + phase)
            alpha = 7 * math.sin(2 * math.pi * (8.5 + index * 0.2) * t)
            seizure = ictal * (48 * math.sin(2 * math.pi * (4.5 + index * 0.15) * t + phase) + 12 * math.sin(2 * math.pi * 2.2 * t))
            artifact = transient * (35 - index * 6) * math.sin(2 * math.pi * 5.8 * t)
            noise = rng.gauss(0, 4.0)
            channels[name].append(round(background + alpha + seizure + artifact + noise, 3))

    times = [round(i / FS, 3) for i in range(points)]
    probability = []
    for second in range(DURATION + 1):
        seizure_peak = 0.94 * math.exp(-((second - 63) / 10) ** 6)
        false_peak = 0.62 * math.exp(-((second - 24) / 2.2) ** 2)
        baseline = 0.035 + 0.018 * (1 + math.sin(second * 0.31))
        probability.append(round(min(0.995, baseline + seizure_peak + false_peak), 4))

    regions = {"nonSeizure": (8, 20), "transient": (20, 30), "seizure": (52, 76)}
    band_energy = {}
    first = channels["F4-C4"]
    for name, (start, end) in regions.items():
        segment = first[start * FS : end * FS]
        band_energy[name] = dft_band_energy(segment, FS)

    payload = {
        "metadata": {
            "kind": "synthetic",
            "notice": "Illustrative synthetic EEG signal - not a patient recording and not used to calculate the reported model results.",
            "samplingRate": FS,
            "durationSeconds": DURATION,
            "channels": list(channels),
            "methodNote": "Band energy uses DFT power summed into the project's twenty 2 Hz bins from 0-40 Hz.",
        },
        "time": times,
        "signals": channels,
        "probabilityTime": list(range(DURATION + 1)),
        "probability": probability,
        "groundTruth": [{"start": 52, "end": 76}],
        "examples": {"nonSeizure": [8, 20], "falsePositive": [20, 30], "truePositive": [52, 68], "falseNegative": [68, 76]},
        "bandLabels": [f"{low}-{low + 2}" for low in range(0, 40, 2)],
        "bandEnergy": band_energy,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")


if __name__ == "__main__":
    main()
