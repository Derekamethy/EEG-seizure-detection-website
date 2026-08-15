import { expect, test } from '@playwright/test'

const viewports = [
  { width: 1440, height: 900 },
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

  const summaries = page.locator('summary')
  for (let index = 0; index < await summaries.count(); index += 1) {
    const summary = summaries.nth(index)
    await summary.click()
    await expect(summary.locator('..')).toHaveAttribute('open', '')
  }

  const expectedExternalLinks = [
    'https://derekamethy.github.io/',
    'https://github.com/Derekamethy/EEG-seizure-detection-website',
    'https://derekamethy.github.io/CRFID-research-website/',
    'https://github.com/Derekamethy/CRFID-research-website',
  ]
  for (const href of expectedExternalLinks) {
    const links = page.locator('a[href="' + href + '"]')
    expect(await links.count()).toBeGreaterThan(0)
    for (let index = 0; index < await links.count(); index += 1) {
      await expect(links.nth(index)).toHaveAttribute('target', '_blank')
      await expect(links.nth(index)).toHaveAttribute('rel', 'noreferrer')
    }
  }

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
    await expect(page.locator('img')).toHaveCount(0)
  }

  process.stdout.write('VIEWPORT_METRICS ' + JSON.stringify(measurements) + '\n')
  expect(consoleErrors).toEqual([])
  expect(consoleWarnings).toEqual([])
  expect(pageErrors).toEqual([])
  expect(failedRequests).toEqual([])
  expect(badResponses).toEqual([])
})
