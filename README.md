# EEG Seizure Detection — Engineering Showcase

A public engineering case study by Derek Yang on turning multichannel scalp EEG into patient-specific seizure-event decisions while keeping false alarms, temporal logic, model size, and deployment constraints visible.

This repository contains the source for the public interactive case-study website. It includes browser-safe summary data and visualisation code, not the canonical machine-learning research implementation, raw EEG data, or a complete research-code release.

## Online demo

https://derekamethy.github.io/EEG-seizure-detection-website/

## Engineering problem

EEG seizure detection is not only a window-classification task. A useful system has to reconcile channels, handle noisy physiological signals, preserve evaluation boundaries, control false alarms, form persistent event decisions, and expose the cost of moving a research model toward constrained hardware.

The project therefore prioritises an inspectable signal-to-event pipeline over maximum model complexity.

## Verified pipeline

The study pipeline presented by the website:

1. Loads CHB-MIT EDF recordings and annotation summaries.
2. Aligns 22 bipolar channels, including reversed-polarity matching.
3. Applies zero-phase fourth-order Butterworth SOS filtering from 0.5–50 Hz.
4. Creates non-overlapping 2-second epochs labelled by seizure overlap.
5. Extracts 440 spectral-band features and 3 synchrony features per epoch.
6. Stacks the current and three previous epochs into 1,772 candidates.
7. Selects 30 features inside each training fold.
8. Uses a patient-specific 500-tree Random Forest.
9. Applies median smoothing, a validation-selected threshold, and a minimum-duration rule before event-level evaluation.

## Evaluation scope

The final study subset contains subjects chb01–chb10 from the public retrospective CHB-MIT dataset: 580.57 hours and 55 annotated seizure events.

Evaluation is within-subject and file-level leave-one-seizure-out. A separate model is evaluated for each subject. This is not leave-one-subject-out evaluation and does not demonstrate unseen-subject generalisation.

Headline summaries:

- Macro event sensitivity: 0.98
- Median subject false-alarm rate: 0.2455 events/hour
- Mean delay among detected events: 10.64 seconds
- Pooled detection: 53/55 events

Macro, median-subject, and pooled quantities have different denominators and are labelled separately in the website.

## Deployment evidence

The deployment work is feasibility-oriented and contains three distinct results:

- Headline research classifier: 500 trees, 30 inputs, 2.99 MB representative joblib footprint, and approximately 3.4 MB as a direct C header.
- Separate compact branch: 120 trees and 50 inputs, averaging 719.2 KB versus 3,642.3 KB for its 300-tree reference, with a measurable sensitivity/FAR trade-off.
- Separate representation proof: one 100-tree, 30-input patient model produced a 21,164-byte (20.67 KB) C payload. It was not revalidated across the cohort and is not the headline model.

Latency was measured in the Python notebook environment, not on target hardware. The evaluated zero-phase filter and centred median smoother are retrospective and non-causal; a streaming version would require causal equivalents and renewed validation.

## Technology stack

- React 19 and TypeScript
- Vite
- Apache ECharts
- Vitest and Testing Library
- Playwright
- pnpm
- GitHub Actions and GitHub Pages

The website contains reviewed, browser-safe summary data only. It does not include raw EDF recordings, trained model binaries, private patient material, or the original research workspace.

## Local development

Requirements: Node.js 24 and pnpm 11.7.0 or compatible versions.

    pnpm install
    pnpm dev

The Vite project uses the GitHub Pages repository base path:

    /EEG-seizure-detection-website/

## Quality checks

    pnpm lint
    pnpm test
    pnpm build
    pnpm test:e2e

The browser test validates navigation, the Pipeline Explorer, disclosure elements, external links, social-preview metadata, production asset loading, and responsive layout at 1440×900, 768×1024, and 390×844.

## Scientific and medical boundaries

This is an academic engineering prototype based on a public retrospective dataset.

- It is not a medical device.
- It is not clinical validation.
- It does not establish diagnostic reliability or patient benefit.
- It does not demonstrate unseen-subject generalisation.
- It was not validated on target embedded hardware.
- Embedded results represent feasibility analysis, not a production deployment.
