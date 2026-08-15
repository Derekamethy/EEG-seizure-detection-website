import { describe, expect, it } from 'vitest'
import { calculateBinMetrics, labelsFromIntervals, valuesToIntervals } from '../src/utils/threshold'

describe('threshold utilities', () => {
  it('creates intervals and enforces minimum run length', () => {
    expect(valuesToIntervals([0, 1, 2, 3, 4], [0.1, 0.7, 0.8, 0.2, 0.9], 0.5, 2)).toEqual([{ start: 1, end: 3 }])
  })

  it('classifies bins and calculates metrics', () => {
    expect(calculateBinMetrics([0, 1, 1, 0], [0.7, 0.8, 0.2, 0.1], 0.5)).toEqual({ tp: 1, fp: 1, fn: 1, tn: 1, precision: 0.5, sensitivity: 0.5 })
  })

  it('constructs labels from half-open intervals', () => {
    expect(labelsFromIntervals([0, 1, 2, 3], [{ start: 1, end: 3 }])).toEqual([0, 1, 1, 0])
  })
})
