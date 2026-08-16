interface ReviewPoint {
  epochIndex: number
  absoluteTimeSeconds: number
  relativeTimeSeconds: number
  annotation: number
}

export function formatRelativeTime(seconds: number) {
  if (seconds === 0) return '0 s'
  return `${seconds > 0 ? '+' : '−'}${Math.abs(seconds)} s`
}

export function buildEventReviewTooltip(point: ReviewPoint, probability: number, probabilityLabel: string, decision: number) {
  return [
    `<strong>${formatRelativeTime(point.relativeTimeSeconds)} from onset</strong>`,
    `Epoch ${point.epochIndex} · recording time ${point.absoluteTimeSeconds} s`,
    `${probabilityLabel}: ${probability.toFixed(6)}`,
    `Annotation: ${point.annotation ? 'Seizure' : 'Background'}`,
    `Decision: ${decision ? 'On' : 'Off'}`,
  ].join('<br>')
}
