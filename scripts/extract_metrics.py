"""Export manually verified aggregate project evidence to browser-safe JSON."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data"


def write_json(name: str, payload: object) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    write_json(
        "metrics.json",
        {
            "headline": {
                "macroEventSensitivity": 0.98,
                "medianSubjectFarPerHour": 0.2455,
                "meanDetectionDelaySeconds": 10.64,
                "medianDetectionDelaySeconds": 5.0,
                "hours": 580.57,
                "seizures": 55,
                "subjects": 10,
                "aggregation": {
                    "macroEventSensitivity": "Arithmetic mean of the 10 subject-level event sensitivities.",
                    "medianSubjectFarPerHour": "Median of the 10 subject-level false-alarm-event rates per hour.",
                    "meanDetectionDelaySeconds": "Mean across detected seizure events only; missed seizures are excluded.",
                },
                "delayDefinition": {
                    "denominator": "Detected seizure events with at least one valid alarm inside the labelled event.",
                    "start": "First positive 2-second annotation-overlap epoch, which approximates annotated onset at epoch resolution.",
                    "end": "First valid predicted epoch within the event.",
                    "postProcessing": "Probabilities are median-filtered over 5 epochs, thresholded, then runs shorter than 3 epochs are removed before delay is measured.",
                },
            },
            "pooledEvents": {
                "detected": 53,
                "missed": 2,
                "falseAlarms": 178,
                "hours": 580.57,
                "detectionRate": 0.9636363636363636,
                "farPerHour": 0.3065952426050261,
                "aggregation": "Pooled event counts: 53/(53+2) and 178/580.57 h; not the macro sensitivity or median subject FAR.",
            },
            "modelComparison": [
                {"model": "SVM-RBF", "sensitivity": 0.955, "farPerHour": 1.1788, "meanDelaySeconds": 8.35},
                {"model": "Random Forest", "sensitivity": 0.955, "farPerHour": 0.2767, "meanDelaySeconds": 7.36},
                {"model": "XGBoost", "sensitivity": 0.93, "farPerHour": 0.3419, "meanDelaySeconds": 4.53},
            ],
            "featureReduction": [
                {"variant": "Full 1,772 features", "detected": 52, "missed": 3, "falseAlarms": 183, "sensitivity": 0.9455, "farPerHour": 0.3152, "delaySeconds": 6.69},
                {"variant": "Selected top 30", "detected": 53, "missed": 2, "falseAlarms": 178, "sensitivity": 0.9636, "farPerHour": 0.3066, "delaySeconds": 9.09},
            ],
            "provenance": {
                "source": "Final report Tables 5-7 and executed main notebook outputs",
                "evaluation": "Within-subject, file-level leave-one-seizure-out evaluation on a 10-subject CHB-MIT subset; one patient-specific model per subject; no unseen-subject generalisation test",
                "status": "Reported from saved outputs; not recomputed because EDF/cache/model artifacts are absent",
            },
        },
    )

    feature_names = [
        "F4-C4 [4-6Hz] @ t", "FT9-FT10 [4-6Hz] @ t", "F3-C3 [4-6Hz] @ t", "C4-P4 [2-4Hz] @ t",
        "FT9-FT10 [4-6Hz] @ t-1", "F4-C4 [4-6Hz] @ t-1", "FT9-FT10 [8-10Hz] @ t-1",
        "FZ-CZ [4-6Hz] @ t", "T7-P7 [2-4Hz] @ t", "F4-C4 [2-4Hz] @ t", "T7-P7 [4-6Hz] @ t",
        "FT9-FT10 [8-10Hz] @ t-2", "P7-O1 [2-4Hz] @ t", "FT9-FT10 [2-4Hz] @ t",
        "F4-C4 [4-6Hz] @ t-2", "C4-P4 [4-6Hz] @ t", "P4-O2 [2-4Hz] @ t", "FZ-CZ [4-6Hz] @ t-2",
        "F8-T8 [4-6Hz] @ t-1", "C4-P4 [4-6Hz] @ t-1",
    ]
    values = [0.127547, 0.109800, 0.105735, 0.059639, 0.058509, 0.058472, 0.054753, 0.051788, 0.051087, 0.034099, 0.033139, 0.031321, 0.029211, 0.026389, 0.023013, 0.020794, 0.019100, 0.015342, 0.011791, 0.011695]
    write_json(
        "featureImportance.json",
        {
            "items": [{"feature": name, "importance": value} for name, value in zip(feature_names, values)],
            "provenance": "Executed main notebook, representative anonymised subject; Gini impurity importance",
        },
    )

    write_json(
        "pipeline.json",
        [
            {"id": "recording", "label": "EEG recording", "overview": "Load scalp EEG and seizure annotations for one study subject.", "technical": "EDF + summary text; normalise names and align 22 bipolar channels.", "shape": "22 x samples", "implementation": "parse_summary_to_dict / align_channels"},
            {"id": "preprocess", "label": "Preprocess", "overview": "Remove out-of-band activity while preserving the waveform timing.", "technical": "Zero-phase 4th-order Butterworth SOS band-pass, 0.5-50 Hz.", "shape": "22 x samples", "implementation": "bandpass_filter_multich"},
            {"id": "window", "label": "Segment + label", "overview": "Divide the recording into short windows and mark seizure overlap.", "technical": "Non-overlapping 2 s epochs; any annotation overlap gives label 1.", "shape": "epochs x 22 x samples", "implementation": "extract_base_features_for_file / build_epoch_labels"},
            {"id": "features", "label": "Build features", "overview": "Describe frequency content, left-right relationships, and recent change.", "technical": "440 FFT band-power sums + 3 correlations = 443; stack current + 3 prior epochs = 1,772.", "shape": "epochs x 1772", "implementation": "extract_base_features_for_file / temporal_stack_features"},
            {"id": "selection", "label": "Select 30", "overview": "Keep the most useful training-side features for each validation fold.", "technical": "Fold-local RF impurity selection on inner-train data only.", "shape": "epochs x 30", "implementation": "select_top_k_features_tree"},
            {"id": "classifier", "label": "Random Forest", "overview": "Estimate seizure probability with a patient-specific ensemble.", "technical": "500 trees, max depth 12, min leaf 1, sqrt features, balanced subsampling.", "shape": "probability per epoch", "implementation": "make_model('random_forest')"},
            {"id": "decision", "label": "Form alarms", "overview": "Smooth probabilities, apply a subject-specific threshold, and reject very short alarms.", "technical": "Median kernel 5 epochs; threshold selected on inner validation; minimum run 3 epochs.", "shape": "binary alarm timeline", "implementation": "medfilt / choose_threshold_from_validation / apply_duration_constraint"},
            {"id": "evaluate", "label": "Evaluate events", "overview": "Measure whether seizures were caught, how often false alarms occurred, and detection delay.", "technical": "Within-subject, file-level leave-one-seizure-out evaluation; one patient-specific model per subject; no unseen-subject generalisation test.", "shape": "event metrics", "implementation": "evaluation orchestration / compute_event_metrics"},
        ],
    )


if __name__ == "__main__":
    main()
