import { expect, test } from '@playwright/test'

const viewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]

const deploymentPath = '/EEG-seizure-detection-website/'

test('navigation, interactions, resources, and responsive layout', async ({ page }) => {
  const consoleErrors: string[] = []
  const consoleWarnings: string[] = []
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  const badResponses: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
    if (message.type() === 'warning') consoleWarnings.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => failedRequests.push(request.url()))
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push(response.status() + ' ' + response.url())
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize(viewports[0])
  await page.goto(deploymentPath)
  await expect(page.getByRole('heading', { name: /EEG seizure detection under real engineering constraints/i })).toBeVisible()

  const internalSections = ['#overview', '#pipeline', '#tradeoffs', '#feature-reduction', '#evaluation', '#deployment']
  for (const href of internalSections) {
    await page.locator('.primary-nav a[href="' + href + '"]').click()
    await expect(page.locator(href)).toBeInViewport()
  }

  await page.getByRole('link', { name: 'Derek Yang EEG project home' }).click()
  await expect(page.locator('#top')).toBeInViewport()
  await page.getByRole('link', { name: 'Explore the system' }).click()
  await expect(page.locator('#pipeline')).toBeInViewport()
  await page.getByRole('link', { name: 'See the model decision' }).click()
  await expect(page.locator('#tradeoffs')).toBeInViewport()

  await page.getByRole('button', { name: 'Technical details' }).click()
  const stageButtons = page.locator('.pipeline-step')
  await expect(stageButtons).toHaveCount(8)
  for (let index = 0; index < await stageButtons.count(); index += 1) {
    const button = stageButtons.nth(index)
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  }
  await expect(page.getByText(/compute_event_metrics/)).toBeVisible()
  await page.getByRole('button', { name: 'Overview' }).click()

  const evidenceTriggers = page.getByRole('button', { name: /^Open figure:/ })
  await expect(evidenceTriggers).toHaveCount(7)
  await evidenceTriggers.first().focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await evidenceTriggers.nth(1).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.locator('.lightbox').click({ position: { x: 4, y: 4 } })
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.locator('#event-logic').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('event-review-workspace')).toBeVisible()
  const scrubber = page.getByRole('slider', { name: 'Review time' })
  await expect(scrubber).toHaveValue('0')
  await scrubber.fill('-16')
  await expect(page.getByTestId('event-epoch')).toHaveText('1490')
  await expect(page.getByTestId('event-recording-time')).toHaveText('2980 s')
  await expect(page.getByTestId('event-probability')).toHaveText('0.000000')
  await expect(page.getByTestId('event-annotation')).toHaveText('Background')
  await scrubber.fill('0')
  await expect(page.getByTestId('event-epoch')).toHaveText('1498')
  await expect(page.getByTestId('event-recording-time')).toHaveText('2996 s')
  await expect(page.getByTestId('event-probability')).toHaveText('0.597041')
  await scrubber.fill('4')
  await expect(page.getByTestId('event-epoch')).toHaveText('1500')
  await expect(page.getByTestId('event-recording-time')).toHaveText('3000 s')
  await expect(page.getByTestId('event-probability')).toHaveText('0.760384')
  await expect(page.getByTestId('event-annotation')).toHaveText('Seizure')
  await scrubber.fill('16')
  await expect(page.getByTestId('event-epoch')).toHaveText('1506')
  await expect(page.getByTestId('event-probability')).toHaveText('0.826611')
  await page.getByRole('button', { name: 'Median-5 derived' }).click()
  await expect(page.getByRole('button', { name: 'Median-5 derived' })).toHaveAttribute('aria-pressed', 'true')
  await page.locator('#case-threshold').fill('0.8')
  await expect(page.getByTestId('case-threshold-value')).toHaveText('0.800')
  await page.getByRole('button', { name: 'Reset verified operating point' }).click()
  await expect(page.getByTestId('case-threshold-value')).toHaveText('0.499')
  await expect(scrubber).toHaveValue('0')
  await page.getByRole('checkbox', { name: /Apply retrospective 3-epoch run filter/i }).uncheck()
  await expect(page.getByTestId('event-filter-state')).toHaveText('Not applied')

  const summaries = page.locator('summary')
  for (let index = 0; index < await summaries.count(); index += 1) {
    const summary = summaries.nth(index)
    await summary.click()
    await expect(summary.locator('..')).toHaveAttribute('open', '')
  }

  const expectedExternalLinks = [
    'https://derekamethy.github.io/',
    'https://derekamethy.github.io/CRFID-research-website/',
  ]
  for (const href of expectedExternalLinks) {
    const links = page.locator('a[href="' + href + '"]')
    expect(await links.count()).toBeGreaterThan(0)
    for (let index = 0; index < await links.count(); index += 1) {
      await expect(links.nth(index)).toHaveAttribute('target', '_blank')
      await expect(links.nth(index)).toHaveAttribute('rel', 'noreferrer')
    }
  }

  await expect(page.locator('a[href*="github.com/Derekamethy/EEG-seizure-detection-website"]')).toHaveCount(0)
  await expect(page.locator('a[href*="github.com/Derekamethy/CRFID-research-website"]')).toHaveCount(0)

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derekamethy.github.io/EEG-seizure-detection-website/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://derekamethy.github.io/EEG-seizure-detection-website/og.png')
  const socialImageResponse = await page.request.get(deploymentPath + 'og.png')
  expect(socialImageResponse.ok()).toBe(true)

  const measurements: Array<Record<string, number | boolean>> = []
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto(deploymentPath)
    const measurement = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }))
    measurements.push(measurement)
    expect(measurement.innerWidth).toBe(viewport.width)
    expect(measurement.innerHeight).toBe(viewport.height)
    expect(measurement.horizontalOverflow).toBe(false)
    await expect(page.locator('img')).toHaveCount(7)
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded()
      await expect(image).toBeVisible()
      expect(await image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
    }
  }

  await page.getByRole('slider', { name: 'Review time' }).fill('4')
  await expect(page.getByTestId('event-epoch')).toHaveText('1500')
  await expect(page.getByTestId('event-probability')).toHaveText('0.760384')

  process.stdout.write('VIEWPORT_METRICS ' + JSON.stringify(measurements) + '\n')
  expect(consoleErrors).toEqual([])
  expect(consoleWarnings).toEqual([])
  expect(pageErrors).toEqual([])
  expect(failedRequests).toEqual([])
  expect(badResponses).toEqual([])
})
