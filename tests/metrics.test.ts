import { describe, expect, it } from 'vitest'
import { calculatePooledEventAggregates } from '../src/utils/metrics'

describe('formal pooled event aggregation', () => {
  it('recomputes pooled detection and FAR without using macro or median values', () => {
    const result = calculatePooledEventAggregates(53, 2, 178, 580.57)
    expect(result.detectionRate).toBeCloseTo(0.963636, 6)
    expect(result.farPerHour).toBeCloseTo(0.306595, 6)
  })

  it('rejects invalid denominators', () => {
    expect(() => calculatePooledEventAggregates(53, 2, 178, 0)).toThrow(/hours must be positive/i)
  })
})
