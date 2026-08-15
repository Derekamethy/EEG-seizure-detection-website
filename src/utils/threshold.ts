import type { BinMetrics } from '../types/project'

export interface Interval {
  start: number
  end: number
}

export function valuesToIntervals(
  times: number[],
  values: number[],
  threshold: number,
  minRun = 1,
): Interval[] {
  const intervals: Interval[] = []
  let startIndex: number | null = null

  for (let index = 0; index <= values.length; index += 1) {
    const active = index < values.length && values[index] >= threshold
    if (active && startIndex === null) startIndex = index
    if (!active && startIndex !== null) {
      if (index - startIndex >= minRun) {
        const last = Math.max(startIndex, index - 1)
        intervals.push({ start: times[startIndex], end: times[last] + 1 })
      }
      startIndex = null
    }
  }
  return intervals
}

export function calculateBinMetrics(labels: number[], scores: number[], threshold: number): BinMetrics {
  if (labels.length !== scores.length) throw new Error('labels and scores must have equal length')
  let tp = 0
  let fp = 0
  let fn = 0
  let tn = 0
  labels.forEach((label, index) => {
    const predicted = scores[index] >= threshold ? 1 : 0
    if (label === 1 && predicted === 1) tp += 1
    else if (label === 0 && predicted === 1) fp += 1
    else if (label === 1) fn += 1
    else tn += 1
  })
  return {
    tp,
    fp,
    fn,
    tn,
    precision: tp + fp ? tp / (tp + fp) : 0,
    sensitivity: tp + fn ? tp / (tp + fn) : 0,
  }
}

export function labelsFromIntervals(times: number[], intervals: Interval[]): number[] {
  return times.map((time) => (intervals.some(({ start, end }) => time >= start && time < end) ? 1 : 0))
}
