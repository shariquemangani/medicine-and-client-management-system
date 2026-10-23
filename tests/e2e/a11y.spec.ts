import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

const PAGES = [
  '/dashboard',
  '/patients',
  '/patients/new',
  '/vault/medicine',
  '/vault/diseases',
  '/vault/flag-configurations',
  '/inventory',
  '/billing',
  '/settings',
]

test.skip(!process.env.TEST_USER_EMAIL, 'needs TEST_USER_EMAIL / TEST_USER_PASSWORD (test project)')

// WCAG 2.1 A/AA rules; only serious and critical findings fail the run.
for (const route of PAGES) {
  test(`accessibility ${route}`, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('main h1:visible')).toHaveCount(1, { timeout: 30_000 })
    await expect.poll(() => page.locator('[aria-busy="true"]').count(), { timeout: 30_000 }).toBe(0)

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) e.g. ${v.nodes[0]?.target.join(' ')}`)
    ).toEqual([])
  })
}
