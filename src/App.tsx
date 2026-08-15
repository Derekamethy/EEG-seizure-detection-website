import type { ReactNode } from 'react'
import metrics from './data/metrics.json'
import { FeatureImportanceChart, ModelComparisonChart } from './charts/ResultsCharts'
import { PipelineExplorer } from './components/PipelineExplorer'
import { SectionHeading } from './components/SectionHeading'
import { calculatePooledEventAggregates } from './utils/metrics'

const links = {
  portfolio: 'https://derekamethy.github.io/',
  eegGithub: 'https://github.com/Derekamethy/EEG-seizure-detection-website',
  crfid: 'https://derekamethy.github.io/CRFID-research-website/',
  crfidGithub: 'https://github.com/Derekamethy/CRFID-research-website',
}

const contribution = [
  ['Signal pipeline', 'I implemented EDF ingestion, channel reconciliation, filtering, epoch labelling, and reusable feature caches.'],
  ['Feature engineering', 'I combined multichannel spectral energy, synchrony, and short temporal history into an inspectable representation.'],
  ['Evaluation design', 'I separated fold-local feature selection, validation-side threshold choice, and held-out file testing within each subject.'],
  ['Deployment analysis', 'I profiled runtime and model size, exported C representations, and kept compact-model experiments separate from the headline result.'],
]

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}<span aria-hidden="true">↗</span></a>
}

function MetricCard({ value, label, context }: { value: string; label: string; context: string }) {
  return <article className="metric-card"><strong>{value}</strong><h3>{label}</h3><p>{context}</p></article>
}

export default function App() {
  const pooled = calculatePooledEventAggregates(
    metrics.pooledEvents.detected,
    metrics.pooledEvents.missed,
    metrics.pooledEvents.falseAlarms,
    metrics.pooledEvents.hours,
  )

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Derek Yang EEG project home">
          <span>DY</span><span>Derek Yang<br /><small>EEG engineering showcase</small></span>
        </a>
        <nav className="primary-nav" aria-label="Primary navigation">
          <a href="#overview">Overview</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#tradeoffs">Trade-offs</a>
          <a href="#feature-reduction">Feature reduction</a>
          <a href="#evaluation">Evaluation</a>
          <a href="#deployment">Deployment</a>
        </nav>
        <div className="external-nav" aria-label="External navigation">
          <ExternalLink href={links.portfolio}>Portfolio</ExternalLink>
          <ExternalLink href={links.eegGithub}>GitHub</ExternalLink>
          <ExternalLink href={links.crfid}>CRFID</ExternalLink>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">EEG signal processing · Event detection · Edge-aware design</p>
            <h1>EEG seizure detection under real engineering constraints</h1>
            <p className="hero-lede">I explored how to turn noisy, multi-channel EEG into stable seizure decisions while balancing detection quality, false alarms, feature dimensionality, model size, and embedded feasibility.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#pipeline">Explore the system</a>
              <a className="secondary-button" href="#tradeoffs">See the model decision</a>
            </div>
            <ul className="tech-list" aria-label="Project priorities">
              <li>Real sensor data</li><li>Event-level evidence</li><li>Deployment constraints</li>
            </ul>
          </div>
          <aside className="hero-evidence" aria-label="Signal-to-decision overview">
            <p className="evidence-label"><span></span> Signal → decision</p>
            <ol className="hero-flow">
              <li><span>01</span>Raw scalp EEG</li>
              <li><span>02</span>Short signal windows</li>
              <li><span>03</span>Useful signal features</li>
              <li><span>04</span>Compact selected set</li>
              <li><span>05</span>Classifier probability</li>
              <li><span>06</span>Temporal event logic</li>
              <li><span>07</span>Seizure event decision</li>
            </ol>
            <p>The classifier is one component. A useful detector must also control leakage, temporal instability, false alarms, and resource cost.</p>
          </aside>
          <div className="medical-note"><strong>Research prototype</strong> Public-dataset engineering study; not a medical device and not intended for diagnosis.</div>
        </section>

        <section className="section problem-section" id="overview">
          <SectionHeading eyebrow="01 · The real problem" title="A seizure detector cannot just classify windows" copy="Seizure events are rare, patient-dependent, and surrounded by hours of changing physiological signal. A practical pipeline has to turn uncertain window scores into stable events without firing constantly." />
          <div className="question-line" aria-label="Project framing">
            <span>Engineering question</span>
            <p>How can multi-channel EEG become an inspectable, patient-specific event detector while keeping false alarms and deployment cost visible?</p>
          </div>
          <div className="challenge-grid">
            <article><span>01</span><h3>Noisy, changing input</h3><p>Channel naming, polarity, recording boundaries, and long background periods have to be handled before fitting a model.</p></article>
            <article><span>02</span><h3>Rare events, asymmetric errors</h3><p>A high window-level accuracy can hide missed seizures or frequent false alarms; the unit of interest is the event.</p></article>
            <article><span>03</span><h3>A constrained destination</h3><p>Model choice also affects memory, latency, interpretability, and whether a research pipeline can move toward edge execution.</p></article>
          </div>
          <div className="scope-strip">
            <span><strong>CHB-MIT</strong> public scalp EEG</span>
            <span><strong>10</strong> subjects in the final subset</span>
            <span><strong>580.57 h</strong> evaluated recordings</span>
            <span><strong>55</strong> annotated seizure events</span>
          </div>
        </section>

        <section className="section contribution-section">
          <SectionHeading eyebrow="02 · Engineering ownership" title="The work sits around the model, not only inside it" copy="The project contribution is an integrated signal-to-event workflow with inspectable choices and explicit limitations." />
          <div className="contribution-list">
            {contribution.map(([title, copy], index) => (
              <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </section>

        <section className="section pipeline-section" id="pipeline">
          <SectionHeading eyebrow="03 · From raw EEG to a decision" title="Eight stages, one engineering system" copy="Select a stage and switch explanation level. The diagram is explanatory; every parameter and code reference comes from the final implementation." />
          <PipelineExplorer />
          <div className="pipeline-notes">
            <article><span>Input discipline</span><h3>22 bipolar channels</h3><p>Canonical channel matching also accepts reversed polarity. Files missing required channels are rejected rather than silently reshaped.</p></article>
            <article><span>Signal windows</span><h3>2 seconds, non-overlapping</h3><p>A window is positive when it overlaps an annotated seizure interval.</p></article>
            <article><span>Temporal context</span><h3>Current + three prior epochs</h3><p>Four 443-feature frames create 1,772 candidates representing up to eight seconds of context.</p></article>
          </div>
        </section>

        <section className="section decision-section" id="tradeoffs">
          <SectionHeading eyebrow="04 · Model decision" title="Why deliberately choose classical ML?" copy="I did not optimise for the most complex model. I optimised for a useful balance between event detection, false alarms, inspectability, runtime, and a credible path toward constrained deployment." />
          <div className="decision-layout">
            <div className="decision-principle">
              <p className="eyebrow">Design principle</p>
              <blockquote>Model family should follow the engineering question—not the fashion cycle.</blockquote>
              <p>The final study is patient-specific and uses engineered spectral, synchrony, and temporal information. That made classical models a direct way to test the signal representation while keeping decisions and footprint measurable.</p>
            </div>
            <div className="decision-reasons">
              <article><span>01</span><div><h3>Data regime</h3><p>A restricted retrospective cohort and within-subject protocol did not justify presenting a high-capacity network as universal.</p></div></article>
              <article><span>02</span><div><h3>Traceable inputs</h3><p>Each selected feature maps back to a channel, frequency band, and temporal lag.</p></div></article>
              <article><span>03</span><div><h3>Resource visibility</h3><p>Tree count, node count, serialized size, C export, and Python inference latency could be profiled directly.</p></div></article>
              <article><span>04</span><div><h3>Measured comparison</h3><p>SVM, Random Forest, and XGBoost were compared with the same event-level framing; Random Forest balanced capture and false-alarm rate.</p></div></article>
            </div>
          </div>
          <div className="tradeoff-table" role="region" aria-label="Model decision trade-off matrix" tabIndex={0}>
            <table>
              <thead><tr><th>Decision lens</th><th>What the project needed</th><th>How the final RF fit</th><th>Remaining cost</th></tr></thead>
              <tbody>
                <tr><td>Signal representation</td><td>Use domain-informed EEG structure</td><td>Directly consumes selected engineered features</td><td>Feature pipeline must still run</td></tr>
                <tr><td>Evaluation</td><td>Stable event decisions, not isolated windows</td><td>Probability output feeds explicit temporal logic</td><td>Thresholds remain subject/fold dependent</td></tr>
                <tr><td>Inspection</td><td>Relate decisions to interpretable inputs</td><td>Feature importance is available</td><td>Importance is not causal physiology</td></tr>
                <tr><td>Deployment</td><td>Expose memory and latency constraints</td><td>Export and profiling are straightforward</td><td>The headline forest is still too large for a strict MCU</td></tr>
              </tbody>
            </table>
          </div>
          <details className="decision-details">
            <summary>Why no deep-learning score is shown</summary>
            <p>A 1D CNN add-on exists in the working notebook, but the final report did not adopt it as a canonical benchmark. Publishing a selective score here would overstate the evidence, so the public comparison stays with the verified model table.</p>
          </details>
        </section>

        <section className="section feature-section" id="feature-reduction">
          <SectionHeading eyebrow="05 · Feature engineering & reduction" title="Compress the decision interface without hiding the trade-off" copy="The major reduction happens inside each training fold: from a multichannel temporal representation to 30 features selected without looking at the held-out test file." />
          <div className="feature-flow" aria-label="Feature dimensionality reduction">
            <article><span>Per epoch</span><strong>443</strong><p>440 spectral band energies + 3 synchrony correlations</p></article>
            <i aria-hidden="true">× 4 frames</i>
            <article><span>Candidate input</span><strong>1,772</strong><p>Current epoch + three previous epochs</p></article>
            <i aria-hidden="true">fold-local rank</i>
            <article className="selected-feature"><span>Classifier input</span><strong>30</strong><p>Selected using inner-training data only</p></article>
          </div>
          <div className="feature-evidence-grid">
            <article className="measured-panel">
              <p className="panel-label">Measured result</p>
              <h3>One more event detected, five fewer false alarms—and a longer delay</h3>
              <dl>
                <div><dt>Pooled event detection</dt><dd>52/55 → 53/55</dd></div>
                <div><dt>False-alarm events</dt><dd>183 → 178</dd></div>
                <div><dt>Pooled FAR/h</dt><dd>0.3152 → 0.3066</dd></div>
                <div><dt>Mean detected-event delay</dt><dd>6.69 s → 9.09 s</dd></div>
              </dl>
            </article>
            <article className="motivation-panel">
              <p className="panel-label">Engineering motivation</p>
              <h3>Fewer classifier inputs make constraints easier to manage</h3>
              <ul><li>Smaller model input interface</li><li>Clearer feature attribution</li><li>Less opportunity for irrelevant inputs to dominate</li><li>A path to selected-feature-only extraction</li></ul>
              <p>These are design motivations. The measured cohort result is reported separately at left.</p>
            </article>
          </div>
          <article className="result-card feature-chart-card">
            <div className="card-heading"><p className="eyebrow">Representative subject</p><h3>Selected features stay traceable</h3><p>Importance concentrated in low-frequency bands and short temporal lags for one anonymised model. This is attribution for that model—not a universal physiological rule.</p></div>
            <FeatureImportanceChart />
          </article>
        </section>

        <section className="section model-section">
          <SectionHeading eyebrow="06 · Model & system pipeline" title="An interpretable classifier inside a controlled evaluation loop" copy="The final primary classifier was a 500-tree Random Forest. Feature selection and threshold choice were nested inside each outer held-out-file evaluation." />
          <div className="architecture-flow" aria-label="Model architecture">
            <div><span>Candidate input</span><strong>1,772</strong><p>spectral-spatial-temporal features</p></div><i>→</i>
            <div><span>Inner training</span><strong>Top 30</strong><p>fold-local RF importance</p></div><i>→</i>
            <div><span>Classifier</span><strong>500 trees</strong><p>maximum depth 12</p></div><i>→</i>
            <div><span>Held-out output</span><strong>p(event)</strong><p>then temporal post-processing</p></div>
          </div>
          <div className="engineering-grid">
            <article><h3>Outer test</h3><p>One seizure-containing file plus a background block is held out within a subject.</p></article>
            <article><h3>Inner split</h3><p>Training and validation data select features and the operating threshold without using the outer test.</p></article>
            <article><h3>Patient-specific scope</h3><p>A separate model is evaluated per subject. This is not leave-one-subject-out or cold-start generalisation.</p></article>
          </div>
        </section>

        <section className="section event-section" id="event-logic">
          <SectionHeading eyebrow="07 · Event-level decision logic" title="A useful alarm has to persist" copy="The system does not treat every positive two-second window as a seizure event. Post-processing turns noisy probabilities into sustained decisions, then evaluates events and false alarms per hour." />
          <div className="event-flow" aria-label="Event decision logic">
            <div><span>01</span><strong>Window probability</strong><p>One score per 2 s epoch</p></div><i>→</i>
            <div><span>02</span><strong>Median smoothing</strong><p>5 epochs / 10 s</p></div><i>→</i>
            <div><span>03</span><strong>Threshold</strong><p>Chosen on inner validation</p></div><i>→</i>
            <div><span>04</span><strong>Persistence</strong><p>At least 3 epochs / 6 s</p></div><i>→</i>
            <div className="event-output"><span>05</span><strong>Event decision</strong><p>Capture, false alarms, delay</p></div>
          </div>
          <div className="event-callout"><strong>System implication</strong><p>A detector that fires throughout normal recording time is not useful even if its window-level accuracy appears high. That is why the headline evidence uses event sensitivity, false alarms per hour, and detection delay.</p></div>
        </section>

        <section className="section results-section" id="evaluation">
          <SectionHeading eyebrow="08 · Verified evaluation" title="Report the aggregation—and the denominator" copy="The final benchmark covers a 10-subject CHB-MIT subset using within-subject, file-level leave-one-seizure-out evaluation. Macro, median-subject, and pooled summaries are deliberately labelled separately." />
          <div className="metric-grid">
            <MetricCard value="0.98" label="Macro event sensitivity" context="Arithmetic mean of 10 subject-level event sensitivities." />
            <MetricCard value="0.2455/h" label="Median subject FAR" context="Median of 10 subject-level false-alarm-event rates per hour." />
            <MetricCard value="10.64 s" label="Mean detected-event delay" context="Mean across detected events only; missed events are excluded." />
            <MetricCard value={'53 / 55 (' + (pooled.detectionRate * 100).toFixed(2) + '%)'} label="Pooled event detection" context="Event count pooled across subjects; not the 0.98 macro average." />
          </div>
          <div className="evidence-callout">
            <strong>Pooled event view</strong><span>53 detected + 2 missed = 55 events</span><span>178 false-alarm events / 580.57 h</span><span>≈ {pooled.farPerHour.toFixed(4)} pooled FAR/h</span>
          </div>
          <div className="chart-grid single-chart-grid">
            <article className="result-card">
              <div className="card-heading"><p className="eyebrow">Canonical model benchmark</p><h3>Random Forest balanced capture and false alarms</h3><p>It matched the SVM's macro event sensitivity with substantially fewer median subject false alarms. XGBoost showed shorter detected-event delay but lower macro sensitivity.</p></div>
              <ModelComparisonChart />
              <details><summary>Read exact chart values</summary>
                <div className="table-scroll"><table><thead><tr><th>Model</th><th>Macro sensitivity</th><th>Median FAR/h</th><th>Mean detected-event delay</th></tr></thead><tbody>{metrics.modelComparison.map((item) => <tr key={item.model}><td>{item.model}</td><td>{item.sensitivity}</td><td>{item.farPerHour}</td><td>{item.meanDelaySeconds} s</td></tr>)}</tbody></table></div>
              </details>
            </article>
            <aside className="evaluation-guardrails">
              <p className="eyebrow">Evaluation guardrails</p>
              <h3>What was controlled</h3>
              <ul><li>File-level outer holdout within each subject</li><li>Feature selection on inner-training data</li><li>Threshold selection on inner validation</li><li>Event-level capture, FAR/h, and delay</li></ul>
              <h3>What was not tested</h3>
              <ul><li>Unseen-subject generalisation</li><li>External or prospective data</li><li>Clinical workflow performance</li></ul>
            </aside>
          </div>
        </section>

        <section className="section deployment-section" id="deployment">
          <SectionHeading eyebrow="09 · Embedded & deployment path" title="Separate the best research result from footprint experiments" copy="The final forest was profiled and exported, but it was not demonstrated on target hardware. Smaller results belong to separate experiments and are labelled accordingly." />
          <div className="deployment-ladder">
            <article>
              <div className="deployment-index">01</div>
              <div><p className="panel-label">Headline research classifier</p><h3>500-tree Random Forest · 30 inputs</h3><p>Representative serialized model: 2.99 MB. Direct C header: about 3.4 MB. Python inference profiling: 80.99 ms mean, 131.05 ms P95.</p></div>
              <span className="status-badge constrained">Profiled · too large for a strict MCU</span>
            </article>
            <article>
              <div className="deployment-index">02</div>
              <div><p className="panel-label">Separate compact-forest branch</p><h3>120 trees · top 50 features</h3><p>Mean footprint fell from 3,642.3 KB to 719.2 KB versus its 300-tree reference, an 80.3% reduction, with worse macro sensitivity and FAR.</p></div>
              <span className="status-badge experiment">Compression experiment</span>
            </article>
            <article>
              <div className="deployment-index">03</div>
              <div><p className="panel-label">Representation proof</p><h3>Single-subject 20.67 KB payload</h3><p>A 100-tree, 30-input patient model produced a 21,164-byte C representation. It was not revalidated across the 10-subject cohort.</p></div>
              <span className="status-badge proof">Proof of concept · not final model</span>
            </article>
          </div>
          <div className="deployment-boundary"><strong>Deployment boundary</strong><p>No target-hardware latency, streaming memory, power, or clinical validation was demonstrated. The evaluated zero-phase filter and centred five-epoch median smoother are retrospective and non-causal; a streaming implementation would need causal preprocessing and post-processing equivalents, followed by renewed validation. The honest outcome is embedded feasibility analysis—not an embedded product.</p></div>
        </section>

        <section className="section takeaway-section">
          <SectionHeading eyebrow="10 · Engineering takeaways" title="What I would carry into another detection system" copy="The transferable work is a way of thinking about sensor data, evaluation, and deployment together." />
          <div className="takeaway-grid">
            <article><span>01</span><h3>Make the decision unit explicit</h3><p>Window scores only become useful after temporal and event logic.</p></article>
            <article><span>02</span><h3>Put leakage controls inside the design</h3><p>Feature and threshold selection belong inside the fold that owns them.</p></article>
            <article><span>03</span><h3>Treat efficiency as evidence</h3><p>Measure size and latency; do not infer deployment from model family alone.</p></article>
            <article><span>04</span><h3>Keep trade-offs visible</h3><p>Compression can improve one metric and worsen another. Show both.</p></article>
          </div>
        </section>

        <section className="section cross-project-section" id="cross-project-link">
          <div className="cross-project-copy">
            <p className="eyebrow">11 · Different problem, different model</p>
            <h2>Classical ML here was a design decision—not a capability limit</h2>
            <p>For EEG, an engineered and inspectable representation supported the resource-aware question. In my CRFID research, deep learning and domain-generalisation methods were appropriate because the question centred on learned representations under physical domain shift.</p>
            <p className="cross-principle">I choose the model family to match the data, evidence, and destination.</p>
          </div>
          <div className="cross-project-actions">
            <ExternalLink href={links.crfid}>Explore the CRFID research case study</ExternalLink>
            <ExternalLink href={links.crfidGithub}>View the CRFID source repository</ExternalLink>
          </div>
        </section>

        <section className="section limitations-section" id="limitations">
          <SectionHeading eyebrow="12 · Boundaries" title="What the evidence does—and does not—show" copy="Strong engineering evidence is not clinical validation." />
          <div className="limitations-layout">
            <div className="limitations-list">
              <article><span>01</span><div><h3>Patient-specific, not unseen-subject</h3><p>Each evaluation uses a person's historical data. Cold-start generalisation was not tested.</p></div></article>
              <article><span>02</span><div><h3>Restricted retrospective cohort</h3><p>The final benchmark covers 10 CHB-MIT subjects and no external or prospective stream.</p></div></article>
              <article><span>03</span><div><h3>Recording-boundary risk remains</h3><p>Feature history resets per EDF, but smoothing, persistence, and event counting do not explicitly reset across concatenated file boundaries.</p></div></article>
              <article><span>04</span><div><h3>Deployment-oriented, not embedded-ready</h3><p>The headline forest remains too large for a strict MCU, and no target-hardware measurements were reported.</p></div></article>
            </div>
            <aside><h3>Next evidence to build</h3><ol><li>Test unseen-subject and larger-cohort protocols.</li><li>Reset post-processing at every recording boundary.</li><li>Validate on external data and calibrate probabilities.</li><li>Review false positives and false negatives by artefact type.</li><li>Measure streaming latency and memory on target hardware.</li></ol></aside>
          </div>
        </section>

        <section className="closing-disclaimer">
          <p className="eyebrow">Project links</p>
          <h2>Continue through the wider engineering portfolio</h2>
          <div className="closing-links">
            <ExternalLink href={links.portfolio}>Personal portfolio</ExternalLink>
            <ExternalLink href={links.eegGithub}>EEG GitHub</ExternalLink>
            <ExternalLink href={links.crfid}>CRFID research case study</ExternalLink>
            <ExternalLink href={links.crfidGithub}>CRFID GitHub</ExternalLink>
          </div>
          <p>This page explains an academic engineering prototype using a public EEG dataset. It is not a medical device, is not intended for diagnosis, and does not claim clinical or production readiness.</p>
        </section>
      </main>

      <footer><span>EE6019 EEG engineering showcase · Derek Yang</span><span>Evidence checked against the final report and executed notebook outputs</span></footer>
    </>
  )
}
