export interface PooledEventAggregates {
  detectionRate: number
  farPerHour: number
}

export function calculatePooledEventAggregates(
  detected: number,
  missed: number,
  falseAlarms: number,
  hours: number,
): PooledEventAggregates {
  if (detected < 0 || missed < 0 || falseAlarms < 0 || hours <= 0) {
    throw new Error('Event counts must be non-negative and hours must be positive')
  }
  const seizureEvents = detected + missed
  return {
    detectionRate: seizureEvents ? detected / seizureEvents : 0,
    farPerHour: falseAlarms / hours,
  }
}
