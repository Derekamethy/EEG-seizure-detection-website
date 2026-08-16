// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', 'https://derekamethy.github.io/')
    expect(screen.getAllByRole('link').some((link) => /^https:\/\/github\.com\/Derekamethy\/(EEG-seizure-detection-website|CRFID-research-website)\/?$/.test(link.getAttribute('href') || ''))).toBe(false)
    expect(screen.getByText(/zero-phase filter and centred five-epoch median smoother are retrospective and non-causal/i)).toBeInTheDocument()
    expect(screen.getByTestId('verified-seizure-explorer')).toBeInTheDocument()
    expect(screen.getByText(/Raw RF predict_proba in saved output/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Open figure:/i })).toHaveLength(6)
    expect(screen.getByRole('link', { name: /Explore the CRFID research case study/i })).toHaveAttribute('href', 'https://derekamethy.github.io/CRFID-research-website/')
  })

  it('opens and closes the shared evidence lightbox with the keyboard', () => {
    render(<App />)
    const trigger = screen.getAllByRole('button', { name: /^Open figure:/i })[0]
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
