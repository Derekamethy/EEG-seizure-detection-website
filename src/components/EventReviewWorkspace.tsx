import { useMemo, useState } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import { Chart } from '../charts/Chart'
import caseJson from '../data/seizureCase.json'
import { buildEventReviewTooltip, formatRelativeTime } from '../utils/eventReview'
import { applyMinimumRun, centeredMedianFive } from '../utils/postprocessing'
import { EvidenceFigure } from './EvidenceFigure'

type ProbabilityView = 'raw' | 'median'

const metadata = caseJson.metadata
const points = caseJson.points
const rawProbabilities = points.map((point) => point.rawProbability)
const onsetIndex = points.findIndex((point) => point.relativeTimeSeconds === 0)

export function EventReviewWorkspace() {
  const [view, setView] = useState<ProbabilityView>('raw')
  const [threshold, setThreshold] = useState(metadata.storedThreshold)
  const [persistence, setPersistence] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(onsetIndex)

  const probabilities = useMemo(
    () => view === 'raw' ? rawProbabilities : centeredMedianFive(rawProbabilities),
    [view],
  )
  const thresholded = useMemo(
    () => probabilities.map((value) => Number(value >= threshold)),
    [probabilities, threshold],
  )
  const decisions = useMemo(
    () => persistence ? applyMinimumRun(thresholded, 3) : thresholded,
    [persistence, thresholded],
  )

  const selectedPoint = points[selectedIndex]
  const selectedProbability = probabilities[selectedIndex]
  const firstRetained = points.find((point, index) => decisions[index] === 1 && point.annotation === 1)
  const retainedEpochs = decisions.reduce((sum, decision) => sum + decision, 0)
  const filterState = !persistence
    ? 'Not applied'
    : decisions[selectedIndex] === 1
      ? 'Retained'
      : thresholded[selectedIndex] === 1
        ? 'Removed short run'
        : 'Not above threshold'

  const selectRelativeTime = (relativeTime: number) => {
    const index = points.findIndex((point) => point.relativeTimeSeconds === relativeTime)
    if (index >= 0) setSelectedIndex(index)
  }

  const option: EChartsCoreOption = useMemo(() => ({
    animation: false,
    color: ['#35b7a7'],
    grid: { left: 52, right: 28, top: 34, bottom: 54 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: unknown) => {
        const items = params as Array<{ axisValue: number; value: [number, number] }>
        if (!Array.isArray(items) || items.length === 0) return ''
        const index = points.findIndex((point) => point.relativeTimeSeconds === Number(items[0].axisValue))
        if (index < 0) return ''
        return buildEventReviewTooltip(
          points[index],
          probabilities[index],
          view === 'raw' ? 'Stored raw probability' : 'Derived median-5 probability',
          decisions[index],
        )
      },
    },
    xAxis: {
      type: 'value',
      min: -16,
      max: 16,
      interval: 8,
      name: 'Seconds relative to annotated onset',
      nameLocation: 'middle',
      nameGap: 34,
      axisLabel: { color: '#c6d8da', formatter: (value: number) => value > 0 ? `+${value}` : `${value}` },
      axisLine: { lineStyle: { color: '#9bb7bb' } },
      axisTick: { lineStyle: { color: '#9bb7bb' } },
      nameTextStyle: { color: '#c6d8da' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      interval: 0.25,
      name: 'Probability',
      splitLine: { lineStyle: { color: 'rgba(205,225,224,.18)' } },
      axisLine: { lineStyle: { color: '#9bb7bb' } },
      axisLabel: { color: '#c6d8da' },
      nameTextStyle: { color: '#c6d8da' },
    },
    series: [{
      name: view === 'raw' ? 'Stored raw probability' : 'Derived median-5 probability',
      type: 'line',
      step: 'end',
      data: points.map((point, index) => ({
        value: [point.relativeTimeSeconds, probabilities[index]],
        symbolSize: index === selectedIndex ? 13 : 7,
        itemStyle: index === selectedIndex
          ? { color: '#f0a36f', borderColor: '#ffffff', borderWidth: 2 }
          : { color: '#35b7a7' },
      })),
      lineStyle: { width: 2.5, color: '#35b7a7' },
      markLine: {
        symbol: 'none',
        data: [
          {
            yAxis: threshold,
            lineStyle: { color: '#e38b5f', type: 'dashed' },
            label: { formatter: `Threshold ${threshold.toFixed(3)}`, color: '#f0b291', position: 'insideEndTop' },
          },
          {
            xAxis: 0,
            lineStyle: { color: '#9bb7bb', type: 'dashed' },
            label: { formatter: 'Annotated onset', color: '#d7e5e5', position: 'insideStartTop' },
          },
          {
            xAxis: selectedPoint.relativeTimeSeconds,
            lineStyle: { color: '#f0a36f', width: 2 },
            label: { formatter: `Cursor ${formatRelativeTime(selectedPoint.relativeTimeSeconds)}`, color: '#f0b291', position: 'insideEndBottom' },
          },
        ],
      },
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(53,183,167,.10)' },
        data: [[{ xAxis: 0 }, { xAxis: 16 }]],
      },
    }],
  }), [decisions, probabilities, selectedIndex, selectedPoint.relativeTimeSeconds, threshold, view])

  return (
    <section className="event-review-workspace" data-testid="event-review-workspace" aria-labelledby="event-review-title">
      <header className="review-header">
        <div>
          <p className="eyebrow">Representative event review</p>
          <h3 id="event-review-title">{metadata.patient} · {metadata.recording}</h3>
          <p>First annotated seizure · retrospective research example</p>
        </div>
        <div className="review-status" role="note">
          <strong>Verified source</strong>
          <span>17 stored RF outputs · 2 s resolution · no interpolation</span>
        </div>
      </header>

      <div className="review-toolbar">
        <div className="segmented-control" aria-label="Probability series">
          <button type="button" className={view === 'raw' ? 'active' : ''} aria-pressed={view === 'raw'} onClick={() => setView('raw')}>Stored raw</button>
          <button type="button" className={view === 'median' ? 'active' : ''} aria-pressed={view === 'median'} onClick={() => setView('median')}>Median-5 derived</button>
        </div>
        <label className="check-control">
          <input type="checkbox" checked={persistence} onChange={(event) => setPersistence(event.target.checked)} />
          Apply retrospective 3-epoch run filter
        </label>
        <button type="button" className="text-button" onClick={() => {
          setView('raw')
          setThreshold(metadata.storedThreshold)
          setPersistence(true)
          setSelectedIndex(onsetIndex)
        }}>Reset verified operating point</button>
      </div>

      <div className="review-canvas">
        <section className="review-panel eeg-evidence-panel" aria-labelledby="eeg-evidence-heading">
          <div className="review-panel-heading">
            <div><span>EEG evidence</span><h4 id="eeg-evidence-heading">Verified filtered waveform context</h4></div>
            <small>Static source figure</small>
          </div>
          <EvidenceFigure
            className="event-eeg-evidence"
            src="evidence/chb01-clinical-case.png"
            alt="Verified chb01_03 event figure with stored seizure probabilities and four bandpass-filtered EEG channels around annotated onset"
            caption="The published project figure provides the waveform evidence for this event."
            credit="chb01 / chb01_03.edf · verified project evidence · click to inspect"
            width={1239}
            height={700}
          />
          <p className="evidence-boundary">The source figure remains static because the public project does not release numeric EEG samples. The exact epoch cursor is synchronized to the verified model timeline below; no sample-level waveform position is implied.</p>
        </section>

        <section className="review-panel probability-panel" aria-labelledby="probability-heading">
          <div className="review-panel-heading">
            <div><span>Model score</span><h4 id="probability-heading">Random Forest probability</h4></div>
            <output data-testid="review-current-score">{selectedProbability.toFixed(6)}</output>
          </div>
          <Chart
            option={option}
            style={{ height: 310 }}
            onEvents={{ click: (params) => {
              if (Array.isArray(params.value)) selectRelativeTime(Number(params.value[0]))
            } }}
          />
        </section>

        <section className="review-panel state-panel" aria-labelledby="state-heading">
          <div className="review-panel-heading">
            <div><span>Event state</span><h4 id="state-heading">Annotation and retrospective decision</h4></div>
          </div>
          <div className="state-row">
            <strong>Annotation</strong>
            <div className="state-track" aria-label="Background before onset and annotated seizure from onset">
              {points.map((point, index) => <span key={point.epochIndex} className={`${point.annotation ? 'seizure' : 'background'} ${index === selectedIndex ? 'current' : ''}`} title={`${formatRelativeTime(point.relativeTimeSeconds)}: ${point.annotation ? 'Seizure' : 'Background'}`} />)}
            </div>
          </div>
          <div className="state-row">
            <strong>Decision</strong>
            <div className="state-track" aria-label="Retrospective decision state at each stored epoch">
              {points.map((point, index) => <span key={point.epochIndex} className={`${decisions[index] ? 'decision-on' : 'decision-off'} ${index === selectedIndex ? 'current' : ''}`} title={`${formatRelativeTime(point.relativeTimeSeconds)}: ${decisions[index] ? 'On' : 'Off'}`} />)}
            </div>
          </div>
          <div className="review-axis" aria-hidden="true"><span>−16</span><span>−8</span><span className="onset-tick">0<small>annotated onset</small></span><span>+8</span><span>+16 s</span></div>
        </section>
      </div>

      <div className="event-scrubber">
        <button type="button" onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))} disabled={selectedIndex === 0} aria-label="Previous stored epoch">← <span>Previous</span></button>
        <div>
          <label htmlFor="event-time-scrubber">Review time <output>{formatRelativeTime(selectedPoint.relativeTimeSeconds)}</output></label>
          <input
            id="event-time-scrubber"
            aria-label="Review time"
            aria-valuetext={`${formatRelativeTime(selectedPoint.relativeTimeSeconds)} from annotated onset, epoch ${selectedPoint.epochIndex}`}
            type="range"
            min={points[0].relativeTimeSeconds}
            max={points[points.length - 1].relativeTimeSeconds}
            step={metadata.epochSeconds}
            value={selectedPoint.relativeTimeSeconds}
            onChange={(event) => selectRelativeTime(Number(event.target.value))}
          />
          <p>Drag, click, or use the arrow keys. The cursor visits only stored two-second prediction epochs.</p>
        </div>
        <button type="button" onClick={() => setSelectedIndex((index) => Math.min(points.length - 1, index + 1))} disabled={selectedIndex === points.length - 1} aria-label="Next stored epoch"><span>Next</span> →</button>
      </div>

      <div className="review-readout-layout">
        <section className="current-epoch" aria-labelledby="current-epoch-heading" aria-live="polite">
          <div className="readout-heading"><span>Current epoch</span><strong id="current-epoch-heading">{formatRelativeTime(selectedPoint.relativeTimeSeconds)} from onset</strong></div>
          <dl>
            <div><dt>Relative time</dt><dd data-testid="event-relative-time">{formatRelativeTime(selectedPoint.relativeTimeSeconds)}</dd></div>
            <div><dt>Recording time</dt><dd data-testid="event-recording-time">{selectedPoint.absoluteTimeSeconds} s</dd></div>
            <div><dt>Epoch</dt><dd data-testid="event-epoch">{selectedPoint.epochIndex}</dd></div>
            <div><dt>{view === 'raw' ? 'Raw RF probability' : 'Median-5 probability'}</dt><dd data-testid="event-probability">{selectedProbability.toFixed(6)}</dd></div>
            <div><dt>Inspection threshold</dt><dd>{threshold.toFixed(3)}</dd></div>
            <div><dt>Threshold state</dt><dd data-testid="event-threshold-state">{thresholded[selectedIndex] ? 'Above' : 'Below'}</dd></div>
            <div><dt>Annotation</dt><dd data-testid="event-annotation">{selectedPoint.annotation ? 'Seizure' : 'Background'}</dd></div>
            <div><dt>Retrospective run filter</dt><dd data-testid="event-filter-state">{filterState}</dd></div>
          </dl>
        </section>

        <aside className="inspection-controls" aria-label="Inspection controls and summary">
          <label htmlFor="case-threshold">Inspection threshold <output data-testid="case-threshold-value">{threshold.toFixed(3)}</output></label>
          <input id="case-threshold" type="range" min="0.1" max="1" step="0.001" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
          <p>The saved operating point is 0.499. Moving this control reclassifies stored scores for inspection only; it does not retrain or recalibrate the model.</p>
          <dl className="case-summary">
            <div><dt>First retained in-event epoch</dt><dd>{firstRetained ? `${formatRelativeTime(firstRetained.relativeTimeSeconds)} · ${firstRetained.epochIndex}` : 'None'}</dd></div>
            <div><dt>Decision-positive epochs</dt><dd>{retainedEpochs} / {points.length}</dd></div>
            <div><dt>Displayed series</dt><dd>{view === 'raw' ? 'Stored raw' : 'Derived median-5'}</dd></div>
          </dl>
        </aside>
      </div>

      <div className="provenance-grid" aria-label="Event review provenance">
        <div><span>Patient / recording</span><strong>{metadata.patient} / {metadata.recording}</strong></div>
        <div><span>Event / timing</span><strong>Onset epoch {metadata.onsetEpoch} at {metadata.onsetTimeSeconds} s</strong></div>
        <div><span>Resolution</span><strong>2 s epochs; −16 s to +16 s</strong></div>
        <div><span>Probability</span><strong>Raw RF predict_proba in saved output</strong></div>
        <div><span>EEG evidence</span><strong>Verified static project figure; numeric samples not published</strong></div>
        <div><span>Smoothing</span><strong>Optional centered 5-epoch median; derived, non-causal</strong></div>
        <div><span>Persistence</span><strong>Optional 3 consecutive epochs; retrospective short-run filter</strong></div>
        <div><span>Interpolation</span><strong>None; cursor snaps to 17 stored points</strong></div>
      </div>

      <details className="chart-transcript">
        <summary>Read the 17 stored probability points</summary>
        <div className="table-scroll"><table><thead><tr><th>Relative time</th><th>Epoch</th><th>Annotation</th><th>Raw probability</th><th>Saved threshold state</th></tr></thead><tbody>{points.map((point) => <tr key={point.epochIndex}><td>{formatRelativeTime(point.relativeTimeSeconds)}</td><td>{point.epochIndex}</td><td>{point.annotation ? 'Seizure' : 'Background'}</td><td>{point.rawProbability.toFixed(6)}</td><td>{point.recordedAlarm ? 'On' : 'Off'}</td></tr>)}</tbody></table></div>
      </details>
    </section>
  )
}
