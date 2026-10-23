import { test, expect } from '@playwright/test'

const PROTECTED = [
  '/dashboard',
  '/patients',
  '/patients/new',
  '/vault/medicine',
  '/vault/medicine/new',
  '/vault/diseases',
  '/vault/diseases/new',
  '/vault/flag-configurations',
  '/inventory',
  '/billing',
  '/settings',
]

test.describe('public pages', () => {
  test('login page renders and validates input', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('input[type=email]:visible').first()).toBeVisible()
    await page.locator('button[type=submit]:visible').first().click()
    await expect(page.getByText('Email is required').first()).toBeVisible()
    await page.locator('input[type=email]:visible').first().fill('not-an-email')
    await page.locator('button[type=submit]:visible').first().click()
    await expect(page.getByText('Enter a valid email address').first()).toBeVisible()
  })

  for (const route of PROTECTED) {
    test(`unauthenticated ${route} redirects to login with ?redirect=`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(`\\?redirect=${encodeURIComponent(route)}$`))
    })
  }

  test('legacy /medicines redirects into the vault', async ({ page }) => {
    await page.goto('/medicines')
    await expect(page).toHaveURL(/redirect=%2Fvault%2Fmedicine/)
  })

  test('unknown route shows the 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
  })

  test('API rejects unauthenticated requests', async ({ request }) => {
    for (const url of ['/api/v1/patients/list', '/api/v1/medicines/list', '/api/v1/diseases', '/api/v1/flags']) {
      const res = await request.get(url)
      expect(res.status(), url).toBe(401)
    }
    expect((await request.post('/api/v1/diseases', { data: { name: 'x' } })).status()).toBe(401)
    expect((await request.delete('/api/v1/patients/abc')).status()).toBe(401)
  })

  test('security headers are present', async ({ request }) => {
    const res = await request.get('/')
    const headers = res.headers()
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  })

  test('dev-only pages are hidden in production', async ({ request }) => {
    test.skip(!process.env.E2E_PROD, 'only meaningful against a production build (E2E_PROD=1)')
    expect((await request.get('/test-shadcn')).status()).toBe(404)
    expect((await request.get('/test-tailwind')).status()).toBe(404)
  })
})
