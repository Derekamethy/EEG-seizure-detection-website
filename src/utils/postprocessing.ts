export function centeredMedianFive(values: number[]): number[] {
  const padded = [0, 0, ...values, 0, 0]
  return values.map((_, index) => {
    const window = padded.slice(index, index + 5).sort((a, b) => a - b)
    return window[2]
  })
}

export function applyMinimumRun(binary: number[], minimumEpochs = 3): number[] {
  const cleaned = binary.map((value) => (value ? 1 : 0))
  let start = 0

  while (start < cleaned.length) {
    if (cleaned[start] === 0) {
      start += 1
      continue
    }

    let end = start + 1
    while (end < cleaned.length && cleaned[end] === 1) end += 1
    if (end - start < minimumEpochs) {
      for (let index = start; index < end; index += 1) cleaned[index] = 0
    }
    start = end
  }

  return cleaned
}
