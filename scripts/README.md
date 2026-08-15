# Data preparation scripts

Run from the showcase root:

```bash
python scripts/extract_metrics.py
python scripts/prepare_eeg_demo.py
```

`extract_metrics.py` exports only manually verified aggregate values from the final report and executed notebook. It does not parse or publish local absolute paths.

`prepare_eeg_demo.py` creates a deterministic synthetic signal and method-mirroring band-energy data. It contains no patient recording and is never used to calculate the study metrics.
