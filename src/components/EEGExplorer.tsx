import { useMemo, useState } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import demoJson from '../data/eegDemo.json'
import type { DemoData } from '../types/project'
import { calculateBinMetrics, labelsFromIntervals, valuesToIntervals } from '../utils/threshold'
import { Chart } from '../charts/Chart'

const demo = demoJson as unknown as DemoData
type View = 'waveform' | 'frequency'

const exampleLabels: Record<string, { label: string; text: string }> = {
  nonSeizure: { label: 'Non-seizure', text: 'A stable synthetic background segment with low illustrative seizure probability.' },
  falsePositive: { label: 'False positive', text: 'A synthetic high-amplitude transient can cross a permissive threshold despite a non-seizure annotation.' },
  truePositive: { label: 'True positive', text: 'The illustrative probability rises within the synthetic seizure annotation.' },
  falseNegative: { label: 'False negative', text: 'Raise the threshold to expose annotated time bins that the illustrative score no longer detects.' },
}

function normalise(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  const std = Math.sqrt(variance) || 1
  return values.map((value) => (value - mean) / std)
}

export default function EEGExplorer() {
  const [channel, setChannel] = useState(demo.metadata.channels[0])
  const [threshold, setThreshold] = useState(0.5)
  const [normalised, setNormalised] = useState(false)
  const [view, setView] = useState<View>('waveform')
  const [range, setRange] = useState<[number, number]>([0, demo.metadata.durationSeconds])
  const [cursor, setCursor] = useState(60)
  const [example, setExample] = useState('truePositive')
  const [energyRegion, setEnergyRegion] = useState('seizure')

  const predicted = useMemo(
    () => valuesToIntervals(demo.probabilityTime, demo.probability, threshold, 3),
    [threshold],
  )
  const labels = useMemo(
    () => labelsFromIntervals(demo.probabilityTime, demo.groundTruth),
    [],
  )
  const binMetrics = useMemo(
    () => calculateBinMetrics(labels, demo.probability, threshold),
    [labels, threshold],
  )
  const signal = normalised ? normalise(demo.signals[channel]) : demo.signals[channel]

  const waveformOption: EChartsCoreOption = useMemo(() => ({
    animation: false,
    grid: [
      { left: 58, right: 24, top: 28, height: '45%' },
      { left: 58, right: 24, top: '62%', height: '17%' },
    ],
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, valueFormatter: (value: unknown) => Number(value).toFixed(3) },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    xAxis: [
      { type: 'value', min: 0, max: demo.metadata.durationSeconds, gridIndex: 0, axisLabel: { show: false } },
      { type: 'value', min: 0, max: demo.metadata.durationSeconds, gridIndex: 1, name: 'Time (s)', nameLocation: 'middle', nameGap: 30 },
    ],
    yAxis: [
      { type: 'value', gridIndex: 0, name: normalised ? 'z-score' : 'Amplitude (a.u.)', scale: true, splitLine: { lineStyle: { color: '#e8efef' } } },
      { type: 'value', gridIndex: 1, name: 'Probability', min: 0, max: 1, splitNumber: 2 },
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], startValue: range[0], endValue: range[1], zoomOnMouseWheel: true, moveOnMouseMove: true },
      { type: 'slider', xAxisIndex: [0, 1], startValue: range[0], endValue: range[1], bottom: 4, height: 20, brushSelect: true },
    ],
    series: [
      {
        name: channel,
        type: 'line',
        data: demo.time.map((time, index) => [time, signal[index]]),
        showSymbol: false,
        sampling: 'lttb',
        lineStyle: { width: 1, color: '#173a52' },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(25, 135, 123, 0.12)' },
          label: { color: '#11665e', formatter: 'Ground truth' },
          data: demo.groundTruth.map(({ start, end }) => [{ xAxis: start }, { xAxis: end }]),
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#8f4d33', type: 'dashed', width: 1 },
          label: { formatter: 'cursor {c}s' },
          data: [{ xAxis: cursor }],
        },
      },
      {
        name: 'Predicted region',
        type: 'line',
        data: [],
        xAxisIndex: 0,
        yAxisIndex: 0,
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(195, 107, 71, 0.13)' },
          label: { show: false },
          data: predicted.map(({ start, end }) => [{ xAxis: start }, { xAxis: end }]),
        },
      },
      {
        name: 'Illustrative probability',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: demo.probabilityTime.map((time, index) => [time, demo.probability[index]]),
        showSymbol: false,
        lineStyle: { color: '#c36b47', width: 2 },
        areaStyle: { color: 'rgba(195,107,71,.08)' },
        markLine: {
          symbol: 'none',
          lineStyle: { color: '#74351f', type: 'dashed' },
          label: { formatter: `Threshold ${threshold.toFixed(2)}` },
          data: [{ yAxis: threshold }],
        },
      },
    ],
  }), [channel, cursor, normalised, predicted, range, signal, threshold])

  const frequencyOption: EChartsCoreOption = {
    color: ['#315d78'],
    tooltip: { trigger: 'axis' },
    grid: { left: 56, right: 18, top: 22, bottom: 48 },
    xAxis: { type: 'category', data: demo.bandLabels, name: 'Frequency band (Hz)', nameLocation: 'middle', nameGap: 34, axisLabel: { interval: 1, rotate: 35 } },
    yAxis: { type: 'value', name: 'Relative energy', min: 0, max: 1 },
    series: [{ type: 'bar', data: demo.bandEnergy[energyRegion], barMaxWidth: 28 }],
  }

  const jump = (key: string) => {
    const target = demo.examples[key]
    setExample(key)
    setRange(target)
    setCursor(Math.round((target[0] + target[1]) / 2))
  }

  return (
    <div className="explorer-shell">
      <div className="synthetic-banner" role="note">
        <strong>Synthetic demonstration - not a patient recording</strong>
        <span>Signals, annotations, and probabilities are illustrative and are not used to calculate the formal experimental results.</span>
      </div>
      <div className="explorer-toolbar">
        <div className="segmented-control" aria-label="Explorer view">
          <button type="button" className={view === 'waveform' ? 'active' : ''} onClick={() => setView('waveform')}>Waveform</button>
          <button type="button" className={view === 'frequency' ? 'active' : ''} onClick={() => setView('frequency')}>Frequency features</button>
        </div>
        <label>Channel
          <select value={channel} onChange={(event) => setChannel(event.target.value)}>
            {demo.metadata.channels.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="check-control">
          <input type="checkbox" checked={normalised} onChange={(event) => setNormalised(event.target.checked)} />
          Normalise signal
        </label>
        <button type="button" className="text-button" onClick={() => setRange([0, demo.metadata.durationSeconds])}>Reset range</button>
      </div>

      {view === 'waveform' ? (
        <div className="chart-frame" data-testid="waveform-chart">
          <Chart
            option={waveformOption}
            style={{ height: 490 }}
            onEvents={{ click: (params: { value?: [number, number] }) => params.value && setCursor(Math.round(params.value[0])) }}
          />
        </div>
      ) : (
        <div className="frequency-layout">
          <div className="chart-frame"><Chart option={frequencyOption} style={{ height: 390 }} /></div>
          <aside>
            <label>Compare synthetic region
              <select value={energyRegion} onChange={(event) => setEnergyRegion(event.target.value)}>
                <option value="nonSeizure">Non-seizure background</option>
                <option value="transient">Non-seizure transient</option>
                <option value="seizure">Seizure-like region</option>
              </select>
            </label>
            <p>{demo.metadata.methodNote}</p>
            <p>This mirrors the project's fixed 2 Hz FFT-power binning, but the values are calculated from the synthetic signal above.</p>
          </aside>
        </div>
      )}

      <div className="threshold-panel">
        <div>
          <label htmlFor="threshold">Classification threshold <output data-testid="threshold-value">{threshold.toFixed(2)}</output></label>
          <input id="threshold" type="range" min="0.1" max="0.9" step="0.01" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
          <p>Changing this value reclassifies the synthetic scores only; it does not retrain the model. The TP/FP/FN values are calculated only from this synthetic timeline and are not formal experimental results.</p>
        </div>
        <dl className="mini-metrics" aria-label="Illustrative one-second bin summary">
          <div><dt>True positive</dt><dd>{binMetrics.tp}s</dd></div>
          <div><dt>False positive</dt><dd>{binMetrics.fp}s</dd></div>
          <div><dt>False negative</dt><dd>{binMetrics.fn}s</dd></div>
          <div><dt>Precision</dt><dd>{Math.round(binMetrics.precision * 100)}%</dd></div>
        </dl>
      </div>

      <div className="example-inspector">
        <div className="example-buttons" aria-label="Jump to example">
          {Object.entries(exampleLabels).map(([key, item]) => (
            <button key={key} type="button" className={example === key ? 'active' : ''} onClick={() => jump(key)}>{item.label}</button>
          ))}
        </div>
        <p><strong>{exampleLabels[example].label}:</strong> {exampleLabels[example].text} This is a signal-processing illustration, not a physiological interpretation.</p>
      </div>

      <details className="chart-transcript">
        <summary>Text description of the interactive chart</summary>
        <p>The synthetic ground-truth interval runs from 52 to 76 seconds. A non-seizure transient near 24 seconds produces a smaller probability peak. The selected threshold is {threshold.toFixed(2)}, creating {predicted.length} predicted interval{predicted.length === 1 ? '' : 's'}.</p>
      </details>
    </div>
  )
}
