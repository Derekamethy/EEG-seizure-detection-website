import { useMemo, useState } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import { Chart } from '../charts/Chart'
import caseJson from '../data/seizureCase.json'
import { applyMinimumRun, centeredMedianFive } from '../utils/postprocessing'

type ProbabilityView = 'raw' | 'median'

const metadata = caseJson.metadata
const points = caseJson.points
const rawProbabilities = points.map((point) => point.rawProbability)

export function SeizureProbabilityExplorer() {
  const [view, setView] = useState<ProbabilityView>('raw')
  const [threshold, setThreshold] = useState(metadata.storedThreshold)
  const [persistence, setPersistence] = useState(true)

  const probabilities = useMemo(
    () => view === 'raw' ? rawProbabilities : centeredMedianFive(rawProbabilities),
    [view],
  )
  const alarms = useMemo(() => {
    const thresholded = probabilities.map((value) => Number(value >= threshold))
    return persistence ? applyMinimumRun(thresholded, 3) : thresholded
  }, [persistence, probabilities, threshold])

  const firstAlarm = points.find((point, index) => alarms[index] === 1 && point.annotation === 1)
  const activeEpochs = alarms.reduce((sum, alarm) => sum + alarm, 0)

  const option: EChartsCoreOption = useMemo(() => ({
    animation: false,
    color: ['#19877b', '#173a52', '#c36b47'],
    grid: [
      { left: 58, right: 82, top: 38, height: '48%' },
      { left: 58, right: 82, top: '67%', height: '16%' },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: unknown) => {
        const items = params as Array<{ axisValue: number; marker: string; seriesName: string; value: [number, number] }>
        if (!Array.isArray(items) || items.length === 0) return ''
        const point = points.find((item) => item.relativeTimeSeconds === Number(items[0].axisValue))
        return [
          `<strong>${items[0].axisValue}s from onset</strong>`,
          `Epoch ${point?.epochIndex ?? '—'} · recording time ${point?.absoluteTimeSeconds ?? '—'}s`,
          ...items.map((item) => `${item.marker}${item.seriesName}: ${Number(item.value[1]).toFixed(3)}`),
        ].join('<br>')
      },
    },
    xAxis: [
      { type: 'value', min: -16, max: 16, interval: 4, gridIndex: 0, axisLabel: { show: false } },
      { type: 'value', min: -16, max: 16, interval: 4, gridIndex: 1, name: 'Seconds relative to annotated onset', nameLocation: 'middle', nameGap: 30 },
    ],
    yAxis: [
      { type: 'value', min: 0, max: 1, interval: 0.25, gridIndex: 0, name: 'Probability', splitLine: { lineStyle: { color: '#e5ecea' } } },
      { type: 'value', min: 0, max: 1, interval: 1, gridIndex: 1, name: 'State', axisLabel: { formatter: (value: number) => value === 1 ? 'On' : 'Off' } },
    ],
    series: [
      {
        name: view === 'raw' ? 'Stored raw probability' : 'Derived median-5 probability',
        type: 'line',
        step: 'end',
        symbol: 'circle',
        symbolSize: 7,
        data: points.map((point, index) => [point.relativeTimeSeconds, probabilities[index]]),
        lineStyle: { width: 2.5, color: '#19877b' },
        itemStyle: { color: '#19877b' },
        markLine: {
          symbol: 'none',
          lineStyle: { color: '#9b4f32', type: 'dashed' },
          label: { formatter: `Threshold ${threshold.toFixed(3)}`, position: 'insideEndTop' },
          data: [{ yAxis: threshold }, { xAxis: 0, label: { formatter: 'Annotated onset', position: 'insideStartTop' }, lineStyle: { color: '#173a52', type: 'dashed' } }],
        },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(25,135,123,.10)' },
          data: [[{ xAxis: 0 }, { xAxis: 16 }]],
        },
      },
      {
        name: 'Annotated seizure',
        type: 'line',
        step: 'end',
        xAxisIndex: 1,
        yAxisIndex: 1,
        symbol: 'none',
        data: points.map((point) => [point.relativeTimeSeconds, point.annotation]),
        lineStyle: { width: 3, color: '#173a52' },
      },
      {
        name: persistence ? 'Persistence-qualified alarm' : 'Threshold crossing',
        type: 'line',
        step: 'end',
        xAxisIndex: 1,
        yAxisIndex: 1,
        symbol: 'none',
        data: points.map((point, index) => [point.relativeTimeSeconds, alarms[index] * 0.72]),
        lineStyle: { width: 3, color: '#c36b47' },
      },
    ],
  }), [alarms, probabilities, threshold, view, persistence])

  return (
    <div className="verified-explorer" data-testid="verified-seizure-explorer">
      <div className="verified-banner" role="note">
        <strong>Verified stored series</strong>
        <span>{metadata.patient} · {metadata.recording} · first annotated seizure · 2-second epochs</span>
      </div>
      <div className="verified-toolbar">
        <div className="segmented-control" aria-label="Probability series">
          <button type="button" className={view === 'raw' ? 'active' : ''} aria-pressed={view === 'raw'} onClick={() => setView('raw')}>Stored raw</button>
          <button type="button" className={view === 'median' ? 'active' : ''} aria-pressed={view === 'median'} onClick={() => setView('median')}>Median-5 derived</button>
        </div>
        <label className="check-control">
          <input type="checkbox" checked={persistence} onChange={(event) => setPersistence(event.target.checked)} />
          Require 3-epoch run
        </label>
        <button type="button" className="text-button" onClick={() => { setView('raw'); setThreshold(metadata.storedThreshold); setPersistence(true) }}>Reset verified operating point</button>
      </div>
      <div className="verified-chart"><Chart option={option} style={{ height: 470 }} /></div>
      <div className="verified-controls">
        <div>
          <label htmlFor="case-threshold">Inspection threshold <output data-testid="case-threshold-value">{threshold.toFixed(3)}</output></label>
          <input id="case-threshold" type="range" min="0.1" max="0.9" step="0.001" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
          <p>The saved operating point is 0.499. Moving this control reclassifies the stored scores for inspection only; it does not retrain or recalibrate the model.</p>
        </div>
        <dl className="case-summary">
          <div><dt>First in-event alarm</dt><dd>{firstAlarm ? `${firstAlarm.relativeTimeSeconds}s` : 'None'}</dd></div>
          <div><dt>Alarm-positive epochs</dt><dd>{activeEpochs} / {points.length}</dd></div>
          <div><dt>Displayed series</dt><dd>{view === 'raw' ? 'Stored raw' : 'Derived median-5'}</dd></div>
        </dl>
      </div>
      <div className="provenance-grid" aria-label="Seizure explorer provenance">
        <div><span>Patient / recording</span><strong>{metadata.patient} / {metadata.recording}</strong></div>
        <div><span>Event / timing</span><strong>Onset epoch {metadata.onsetEpoch} at {metadata.onsetTimeSeconds}s</strong></div>
        <div><span>Resolution</span><strong>2 s epochs; −16 s to +16 s</strong></div>
        <div><span>Probability</span><strong>Raw RF predict_proba in saved output</strong></div>
        <div><span>Smoothing</span><strong>Optional centered 5-epoch median; derived, non-causal</strong></div>
        <div><span>Persistence</span><strong>Optional 3 consecutive epochs; retrospective run filter</strong></div>
        <div><span>Annotation</span><strong>Epoch overlap with annotated seizure interval</strong></div>
        <div><span>Interpolation</span><strong>None; points remain at 2-second granularity</strong></div>
      </div>
      <details className="chart-transcript">
        <summary>Read the 17 stored probability points</summary>
        <div className="table-scroll"><table><thead><tr><th>Relative time</th><th>Epoch</th><th>Annotation</th><th>Raw probability</th><th>Saved threshold alarm</th></tr></thead><tbody>{points.map((point) => <tr key={point.epochIndex}><td>{point.relativeTimeSeconds}s</td><td>{point.epochIndex}</td><td>{point.annotation ? 'Seizure' : 'Background'}</td><td>{point.rawProbability.toFixed(6)}</td><td>{point.recordedAlarm ? 'On' : 'Off'}</td></tr>)}</tbody></table></div>
      </details>
    </div>
  )
}
