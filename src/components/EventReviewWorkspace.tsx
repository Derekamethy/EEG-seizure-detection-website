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

  const reset = () => {
    setView('raw')
    setThreshold(metadata.storedThreshold)
    setPersistence(true)
    setSelectedIndex(onsetIndex)
  }

  const option: EChartsCoreOption = useMemo(() => ({
    animation: false,
    grid: { left: 48, right: 22, top: 18, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: unknown) => {
        const items = params as Array<{ axisValue: number }>
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
      axisLabel: { color: '#c6d8da', formatter: (value: number) => value > 0 ? `+${value}` : `${value}` },
      axisLine: { lineStyle: { color: '#9bb7bb' } },
      axisTick: { lineStyle: { color: '#9bb7bb' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      interval: 0.25,
      splitLine: { lineStyle: { color: 'rgba(205,225,224,.18)' } },
      axisLine: { lineStyle: { color: '#9bb7bb' } },
      axisLabel: { color: '#c6d8da' },
    },
    series: [{
      name: view === 'raw' ? 'Stored raw probability' : 'Derived median-5 probability',
      type: 'line',
      step: 'end',
      data: points.map((point, index) => ({
        value: [point.relativeTimeSeconds, probabilities[index]],
        symbolSize: index === selectedIndex ? 13 : 6,
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
            lineStyle: { color: '#d7e5e5', type: 'dashed' },
            label: { formatter: 'Onset', color: '#d7e5e5', position: 'insideStartTop' },
          },
          {
            xAxis: selectedPoint.relativeTimeSeconds,
            lineStyle: { color: '#f0a36f', width: 2 },
            label: { formatter: formatRelativeTime(selectedPoint.relativeTimeSeconds), color: '#f0b291', position: 'insideEndBottom' },
          },
        ],
      },
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(53,183,167,.12)' },
        label: { show: true, formatter: 'Annotated seizure', color: '#9ed8d0', position: 'insideTop' },
        data: [[{ xAxis: 0 }, { xAxis: 16 }]],
      },
    }],
  }), [decisions, probabilities, selectedIndex, selectedPoint.relativeTimeSeconds, threshold, view])

  return (
    <section className="event-review-workspace" data-testid="event-review-workspace" aria-labelledby="event-review-title">
      <header className="compact-review-header">
        <div>
          <h3 id="event-review-title">Replay a verified seizure event</h3>
          <p>{metadata.patient} · {metadata.recording} · 2 s prediction epochs</p>
        </div>
        <span>Retrospective example</span>
      </header>

      <div className="compact-event-visual">
        <section className="compact-probability-panel" data-testid="probability-panel" aria-labelledby="probability-heading">
          <div className="compact-panel-label">
            <h4 id="probability-heading">Predicted probability</h4>
            <span>{view === 'raw' ? 'Stored raw RF' : 'Derived median-5'}</span>
          </div>
          <Chart
            option={option}
            style={{ height: 205 }}
            onEvents={{ click: (params) => {
              if (Array.isArray(params.value)) selectRelativeTime(Number(params.value[0]))
            } }}
          />
          <div className="compact-decision-row">
            <strong>Decision</strong>
            <div className="compact-decision-track" aria-label="Retrospective decision state at each stored epoch">
              {points.map((point, index) => <span key={point.epochIndex} className={`${decisions[index] ? 'on' : 'off'} ${index === selectedIndex ? 'current' : ''}`} title={`${formatRelativeTime(point.relativeTimeSeconds)}: ${decisions[index] ? 'On' : 'Off'}`} />)}
            </div>
          </div>
        </section>

        <section className="compact-eeg-panel" data-testid="eeg-panel" aria-labelledby="eeg-heading">
          <div className="compact-panel-label">
            <h4 id="eeg-heading">Verified filtered EEG</h4>
            <span>Static evidence crop · fixed onset guide</span>
          </div>
          <div className="compact-eeg-scroll">
            <EvidenceFigure
              className="compact-eeg-evidence"
              src="evidence/chb01-event-eeg-context.png"
              alt="Pixel-preserving crop of four filtered EEG channels from the verified chb01_03 Block 26 event figure"
              caption="Four filtered EEG channels around the same annotated onset."
              credit="Pixel-preserving crop from chb01 / chb01_03.edf verified project evidence"
              width={1239}
              height={430}
            />
          </div>
        </section>
      </div>

      <div className="compact-event-scrubber" data-testid="event-scrubber">
        <button type="button" onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))} disabled={selectedIndex === 0} aria-label="Previous stored epoch">←</button>
        <div>
          <label htmlFor="event-time-scrubber">Selected epoch <output>{formatRelativeTime(selectedPoint.relativeTimeSeconds)}</output></label>
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
          <div className="compact-scrubber-ticks" aria-hidden="true"><span>−16</span><span>−8</span><span>0</span><span>+8</span><span>+16 s</span></div>
        </div>
        <button type="button" onClick={() => setSelectedIndex((index) => Math.min(points.length - 1, index + 1))} disabled={selectedIndex === points.length - 1} aria-label="Next stored epoch">→</button>
      </div>

      <div className="compact-event-readout" data-testid="compact-event-readout" aria-live="polite">
        <div>
          <strong data-testid="event-relative-time">{formatRelativeTime(selectedPoint.relativeTimeSeconds)}</strong>
          <span>Epoch <b data-testid="event-epoch">{selectedPoint.epochIndex}</b></span>
          <span>{view === 'raw' ? 'RF' : 'Median-5'} <b data-testid="event-probability">{selectedProbability.toFixed(6)}</b></span>
        </div>
        <div>
          <span><b data-testid="event-recording-time">{selectedPoint.absoluteTimeSeconds} s</b> recording</span>
          <span data-testid="event-annotation">{selectedPoint.annotation ? 'Seizure' : 'Background'}</span>
          <span>Threshold <b>{threshold.toFixed(3)}</b>: <b data-testid="event-threshold-state">{thresholded[selectedIndex] ? 'Above' : 'Below'}</b></span>
          <span>Filter: <b data-testid="event-filter-state">{filterState}</b></span>
        </div>
      </div>

      <div className="compact-review-disclosures">
        <details>
          <summary>Inspection options</summary>
          <div className="inspection-options-body">
            <div className="segmented-control" aria-label="Probability series">
              <button type="button" className={view === 'raw' ? 'active' : ''} aria-pressed={view === 'raw'} onClick={() => setView('raw')}>Stored raw</button>
              <button type="button" className={view === 'median' ? 'active' : ''} aria-pressed={view === 'median'} onClick={() => setView('median')}>Median-5 derived</button>
            </div>
            <label className="check-control">
              <input type="checkbox" checked={persistence} onChange={(event) => setPersistence(event.target.checked)} />
              Apply retrospective 3-epoch run filter
            </label>
            <label htmlFor="case-threshold">Inspection threshold <output data-testid="case-threshold-value">{threshold.toFixed(3)}</output></label>
            <input id="case-threshold" type="range" min="0.1" max="1" step="0.001" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
            <button type="button" className="text-button" onClick={reset}>Reset verified operating point</button>
            <p>Centered median-5 is derived and non-causal. Threshold changes reclassify stored scores for inspection only.</p>
            <dl className="compact-analysis-summary">
              <div><dt>First retained in-event epoch</dt><dd>{firstRetained ? `${formatRelativeTime(firstRetained.relativeTimeSeconds)} · ${firstRetained.epochIndex}` : 'None'}</dd></div>
              <div><dt>Decision-positive epochs</dt><dd>{retainedEpochs} / {points.length}</dd></div>
            </dl>
          </div>
        </details>

        <details>
          <summary>Data &amp; evaluation boundary</summary>
          <dl className="compact-boundary-grid">
            <div><dt>Verified event</dt><dd>{metadata.patient} / {metadata.recording}; onset epoch {metadata.onsetEpoch} at {metadata.onsetTimeSeconds} s</dd></div>
            <div><dt>Predictions</dt><dd>17 stored RF points at 2 s resolution; no interpolation</dd></div>
            <div><dt>EEG evidence</dt><dd>Pixel-preserving static crop; numeric EEG samples are not published</dd></div>
            <div><dt>Post-processing</dt><dd>Centered median is non-causal; persistence is a retrospective short-run filter</dd></div>
          </dl>
        </details>

        <details className="compact-transcript">
          <summary>Inspect stored prediction values</summary>
          <div className="table-scroll"><table><thead><tr><th>Relative time</th><th>Epoch</th><th>Annotation</th><th>Raw probability</th><th>Saved threshold state</th></tr></thead><tbody>{points.map((point) => <tr key={point.epochIndex}><td>{formatRelativeTime(point.relativeTimeSeconds)}</td><td>{point.epochIndex}</td><td>{point.annotation ? 'Seizure' : 'Background'}</td><td>{point.rawProbability.toFixed(6)}</td><td>{point.recordedAlarm ? 'On' : 'Off'}</td></tr>)}</tbody></table></div>
        </details>
      </div>
    </section>
  )
}
