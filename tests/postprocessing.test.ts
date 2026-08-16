import { describe, expect, it } from 'vitest'
import { applyMinimumRun, centeredMedianFive } from '../src/utils/postprocessing'

describe('retrospective post-processing', () => {
  it('matches a centered five-point median with zero-padded edges', () => {
    expect(centeredMedianFive([0, 0.2, 0.9, 0.8, 0.1])).toEqual([0, 0.2, 0.2, 0.2, 0.1])
  })

  it('removes positive runs shorter than three epochs without shifting valid runs', () => {
    expect(applyMinimumRun([0, 1, 1, 0, 1, 1, 1, 0], 3)).toEqual([0, 0, 0, 0, 1, 1, 1, 0])
  })
})
