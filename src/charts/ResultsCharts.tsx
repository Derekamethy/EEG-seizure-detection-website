import type { EChartsCoreOption } from 'echarts/core'
import metricsData from '../data/metrics.json'
import importanceData from '../data/featureImportance.json'
import { Chart } from './Chart'

const palette = ['#315d78', '#19877b', '#c36b47']

export function ModelComparisonChart() {
  const models = metricsData.modelComparison
  const option: EChartsCoreOption = {
    color: palette,
    animationDuration: 450,
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 54, right: 20, top: 26, bottom: 64 },
    xAxis: { type: 'category', data: models.map((item) => item.model), axisLabel: { interval: 0 } },
    yAxis: { type: 'value', name: 'Rate', min: 0, max: 1.25 },
    series: [
      { name: 'Macro event sensitivity (mean subjects)', type: 'bar', data: models.map((item) => item.sensitivity), barMaxWidth: 34 },
      { name: 'Median subject FAR / hour', type: 'bar', data: models.map((item) => item.farPerHour), barMaxWidth: 34 },
    ],
  }
  return <Chart option={option} style={{ height: 360 }} />
}

export function FeatureImportanceChart() {
  const items = importanceData.items.slice(0, 12).reverse()
  const option: EChartsCoreOption = {
    color: ['#19877b'],
    animationDuration: 450,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 185, right: 30, top: 16, bottom: 42 },
    xAxis: { type: 'value', name: 'Gini importance', nameLocation: 'middle', nameGap: 28 },
    yAxis: { type: 'category', data: items.map((item) => item.feature), axisLabel: { fontSize: 11 } },
    series: [{ type: 'bar', data: items.map((item) => item.importance), barMaxWidth: 18 }],
  }
  return <Chart option={option} style={{ height: 420 }} />
}
