// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventReviewWorkspace } from '../src/components/EventReviewWorkspace'
import caseJson from '../src/data/seizureCase.json'
import { buildEventReviewTooltip } from '../src/utils/eventReview'

vi.mock('../src/charts/Chart', () => ({ Chart: () => <div data-testid="mock-chart">Chart</div> }))

afterEach(cleanup)

function moveTo(relativeTime: number) {
  fireEvent.change(screen.getByRole('slider', { name: 'Review time' }), { target: { value: String(relativeTime) } })
}

describe('EventReviewWorkspace', () => {
  it('starts at annotated onset and visits only the stored two-second epochs', () => {
    render(<EventReviewWorkspace />)
    const scrubber = screen.getByRole('slider', { name: 'Review time' })

    expect(scrubber).toHaveAttribute('min', '-16')
    expect(scrubber).toHaveAttribute('max', '16')
    expect(scrubber).toHaveAttribute('step', '2')
    expect(scrubber).toHaveValue('0')
    expect(screen.getByTestId('event-epoch')).toHaveTextContent('1498')
    expect(screen.getByTestId('event-recording-time')).toHaveTextContent('2996 s')
    expect(screen.getByTestId('event-probability')).toHaveTextContent('0.597041')
    expect(screen.getByTestId('event-annotation')).toHaveTextContent('Seizure')

    expect(screen.getByText('Inspection options').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByText('Data & evaluation boundary').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByText('Inspect stored prediction values').closest('details')).not.toHaveAttribute('open')
    expect(screen.queryByRole('heading', { name: 'Annotation and retrospective decision' })).not.toBeInTheDocument()

    moveTo(-16)
    expect(screen.getByTestId('event-epoch')).toHaveTextContent('1490')
    expect(screen.getByTestId('event-recording-time')).toHaveTextContent('2980 s')
    expect(screen.getByTestId('event-probability')).toHaveTextContent('0.000000')
    expect(screen.getByTestId('event-annotation')).toHaveTextContent('Background')

    moveTo(4)
    expect(screen.getByTestId('event-relative-time')).toHaveTextContent('+4 s')
    expect(screen.getByTestId('event-epoch')).toHaveTextContent('1500')
    expect(screen.getByTestId('event-recording-time')).toHaveTextContent('3000 s')
    expect(screen.getByTestId('event-probability')).toHaveTextContent('0.760384')

    moveTo(16)
    expect(screen.getByTestId('event-epoch')).toHaveTextContent('1506')
    expect(screen.getByTestId('event-probability')).toHaveTextContent('0.826611')
  })

  it('keeps median, threshold, and persistence inspection explicitly retrospective', () => {
    render(<EventReviewWorkspace />)
    fireEvent.click(screen.getByText('Inspection options'))
    moveTo(12)
    fireEvent.click(screen.getByRole('button', { name: 'Median-5 derived' }))
    expect(screen.getByTestId('event-probability')).toHaveTextContent('0.974254')

    fireEvent.click(screen.getByRole('button', { name: 'Stored raw' }))
    moveTo(10)
    fireEvent.change(screen.getByRole('slider', { name: /Inspection threshold/i }), { target: { value: '0.990' } })
    expect(screen.getByTestId('event-threshold-state')).toHaveTextContent('Above')
    expect(screen.getByTestId('event-filter-state')).toHaveTextContent('Removed short run')

    fireEvent.click(screen.getByRole('checkbox', { name: /Apply retrospective 3-epoch run filter/i }))
    expect(screen.getByTestId('event-filter-state')).toHaveTextContent('Not applied')
    expect(screen.getByText('First retained in-event epoch')).toBeInTheDocument()
    expect(screen.getByText(/Centered median-5 is derived and non-causal/i)).toBeInTheDocument()
  })

  it('uses semantic decision values in chart tooltips', () => {
    const point = caseJson.points.find((item) => item.relativeTimeSeconds === 4)
    expect(point).toBeDefined()
    const tooltip = buildEventReviewTooltip(point!, 0.760384, 'Stored raw probability', 1)
    expect(tooltip).toContain('Decision: On')
    expect(tooltip).toContain('0.760384')
    expect(tooltip).not.toContain('0.720')
    expect(tooltip).not.toMatch(/real-time alarm/i)
  })
})
