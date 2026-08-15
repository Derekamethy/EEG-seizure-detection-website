import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { CSSProperties } from 'react'
import type { EChartsCoreOption } from 'echarts/core'

echarts.use([
  BarChart,
  LineChart,
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer,
])

interface Props {
  option: EChartsCoreOption
  style?: CSSProperties
  onEvents?: Record<string, (params: { value?: [number, number] }) => void>
}

export function Chart({ option, style, onEvents }: Props) {
  return <ReactEChartsCore echarts={echarts} option={option} style={style} opts={{ renderer: 'canvas' }} onEvents={onEvents} />
}
