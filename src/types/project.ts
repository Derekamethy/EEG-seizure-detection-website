export interface PipelineStage {
  id: string
  label: string
  overview: string
  technical: string
  shape: string
  implementation: string
}

export interface DemoData {
  metadata: {
    kind: 'synthetic'
    notice: string
    samplingRate: number
    durationSeconds: number
    channels: string[]
    methodNote: string
  }
  time: number[]
  signals: Record<string, number[]>
  probabilityTime: number[]
  probability: number[]
  groundTruth: Array<{ start: number; end: number }>
  examples: Record<string, [number, number]>
  bandLabels: string[]
  bandEnergy: Record<string, number[]>
}

export interface BinMetrics {
  tp: number
  fp: number
  fn: number
  tn: number
  precision: number
  sensitivity: number
}
