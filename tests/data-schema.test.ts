import { describe, expect, it } from 'vitest'
import demo from '../src/data/eegDemo.json'
import metrics from '../src/data/metrics.json'
import pipeline from '../src/data/pipeline.json'

describe('browser data schemas', () => {
  it('keeps signal arrays aligned', () => {
    expect(demo.metadata.kind).toBe('synthetic')
    expect(demo.time.length).toBeGreaterThan(1000)
    for (const channel of demo.metadata.channels) expect(demo.signals[channel]).toHaveLength(demo.time.length)
    expect(demo.probability).toHaveLength(demo.probabilityTime.length)
  })

  it('contains provenance and plausible canonical values', () => {
    expect(metrics.headline.macroEventSensitivity).toBeCloseTo(0.98)
    expect(metrics.pooledEvents.detected + metrics.pooledEvents.missed).toBe(metrics.headline.seizures)
    expect(metrics.pooledEvents.detectionRate).toBeCloseTo(53 / 55)
    expect(metrics.pooledEvents.farPerHour).toBeCloseTo(178 / 580.57)
    expect(metrics.pooledEvents.detectionRate).not.toBe(metrics.headline.macroEventSensitivity)
    expect(metrics.pooledEvents.farPerHour).not.toBe(metrics.headline.medianSubjectFarPerHour)
    expect(metrics.provenance.source).toContain('Final report')
  })

  it('provides complete pipeline stages', () => {
    expect(pipeline.length).toBe(8)
    pipeline.forEach((stage) => expect(Object.keys(stage)).toEqual(expect.arrayContaining(['id', 'label', 'overview', 'technical', 'shape', 'implementation'])))
  })
})
