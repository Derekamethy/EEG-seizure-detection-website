// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App'

vi.mock('../src/charts/Chart', () => ({ Chart: () => <div data-testid="mock-chart">Chart</div> }))

describe('App', () => {
  it('renders the engineering narrative, verified scope, and boundaries', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /EEG seizure detection under real engineering constraints/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Why deliberately choose classical ML/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Compress the decision interface/i })).toBeInTheDocument()
    expect(screen.getByText('52/55 → 53/55')).toBeInTheDocument()
    expect(screen.getByText(/Classical ML here was a design decision/i)).toBeInTheDocument()
    expect(screen.getAllByText(/not a medical device/i)).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: /GitHub/i }).some((link) => link.getAttribute('href') === 'https://github.com/Derekamethy/EEG-seizure-detection-website')).toBe(true)
    expect(screen.getByText(/zero-phase filter and centred five-epoch median smoother are retrospective and non-causal/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore the CRFID research case study/i })).toHaveAttribute('href', 'https://derekamethy.github.io/CRFID-research-website/')
  })
})
