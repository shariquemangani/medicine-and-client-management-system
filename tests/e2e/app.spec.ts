import { test, expect } from '@playwright/test'

const PAGES = [
  '/dashboard',
  '/patients',
  '/patients/new',
  '/vault/medicine',
  '/vault/medicine/new',
  '/vault/diseases',
  '/vault/diseases/new',
  '/vault/flag-configurations',
  '/inventory',
  '/prescriptions',
  '/billing',
  '/settings',
]

test.skip(!process.env.TEST_USER_EMAIL, 'needs TEST_USER_EMAIL / TEST_USER_PASSWORD (test project)')

for (const route of PAGES) {
  test(`page ${route} loads cleanly`, async ({ page }) => {
    const errors: string[] = []
    const failed: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
    page.on('response', (res) => {
      if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`)
    })

    await page.goto(route)
    await expect(page.locator('main h1:visible')).toHaveCount(1, { timeout: 30_000 })
    await page.waitForTimeout(500)

    expect(errors, 'console errors').toEqual([])
    expect(failed, 'failed requests').toEqual([])

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(overflow, 'horizontal overflow').toBe(false)

    const unnamed = await page.evaluate(
      () =>
        [...document.querySelectorAll('button')].filter(
          (b) => b.offsetParent && !(b.innerText || b.getAttribute('aria-label') || b.title || '').trim()
        ).length
    )
    expect(unnamed, 'buttons without an accessible name').toBe(0)

    const rawKeys = await page.evaluate(
      () =>
        document.body.innerText.match(
          /\b(settings|billing|patients|fees|prescriptions|inventory|medicines|diseases)\.[a-zA-Z]+\b/g
        ) ?? []
    )
    expect(rawKeys, 'raw label keys on screen').toEqual([])
  })
}
