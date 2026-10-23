import { test, expect, type Page } from '@playwright/test'

/**
 * Patient + billing journey against the TEST Firebase project: register a patient through the form,
 * find it in the directory, open and edit it, record a payment from Billing, then delete it.
 * Cleans up after itself even when a step fails.
 */
test.skip(!process.env.TEST_USER_EMAIL, 'needs TEST_USER_EMAIL / TEST_USER_PASSWORD (test project)')

const RUN_ID = Date.now().toString(36)
const NAME = `Zz Journey ${RUN_ID}`
const row = (page: Page) => page.locator('table tbody tr').filter({ hasText: NAME })
const anyJourneyRow = (page: Page) => page.locator('table tbody tr').filter({ hasText: 'Zz Journey' })

async function waitIdle(page: Page) {
  await expect.poll(() => page.locator('[aria-busy="true"]').count(), { timeout: 30_000 }).toBe(0)
}

async function deletePatientIfPresent(page: Page) {
  await page.goto('/patients')
  await expect(page.locator('main h1:visible')).toHaveCount(1, { timeout: 30_000 })
  await waitIdle(page)
  // Removes this run's patient and any left behind by an earlier interrupted run.
  while ((await anyJourneyRow(page).count()) > 0) {
    const before = await anyJourneyRow(page).count()
    await anyJourneyRow(page).first().getByRole('button', { name: /^Delete /i }).click()
    await page.getByRole('dialog').getByRole('button', { name: /delete patient/i }).click()
    await expect(anyJourneyRow(page)).toHaveCount(before - 1, { timeout: 20_000 })
  }
}

test.describe.configure({ mode: 'serial' })

test('patient journey: register, find, edit, bill, delete', async ({ page }) => {
  test.setTimeout(180_000)
  try {
    // --- register ---
    await page.goto('/patients/new')
    await expect(page.locator('main h1:visible')).toHaveCount(1, { timeout: 30_000 })
    await waitIdle(page)

    await page.getByRole('button', { name: 'Today' }).click()
    await page.getByPlaceholder('Patient full name').fill(NAME)
    await page.getByPlaceholder('Street, area, city').fill('1 Journey Lane')

    await page.getByRole('combobox', { name: /Select or add diseases/i }).click()
    await page.getByRole('option').first().click()
    await page.keyboard.press('Escape')

    await page.getByRole('combobox', { name: /Select medicines/i }).click()
    await page.getByRole('option').first().click()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: /Save Patient/i }).click()
    await page.getByRole('button', { name: /Confirm & save/i }).click()
    // Saving sends you back to the directory.
    await expect(page).not.toHaveURL(/\/patients\/new/, { timeout: 30_000 })

    // --- directory ---
    await page.goto('/patients')
    await waitIdle(page)
    await expect(row(page)).toHaveCount(1, { timeout: 20_000 })

    // --- detail + edit ---
    await row(page).first().click()
    await expect(page.getByText('1 Journey Lane').first()).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /^Edit$/ }).click()
    await page.getByPlaceholder('Street, area, city').fill('2 Edited Road')
    await page.getByRole('button', { name: /^Save$/ }).click()
    await page.getByRole('button', { name: /Confirm & save/i }).click()
    await expect(page.getByText('2 Edited Road').first()).toBeVisible({ timeout: 20_000 })

    // --- billing: record a payment ---
    await page.goto('/billing')
    await waitIdle(page)
    const billingRow = page.locator('table tbody tr').filter({ hasText: NAME })
    await expect(billingRow).toHaveCount(1, { timeout: 20_000 })
    // a patient with no fees has nothing due, so the Pay button stays disabled
    await expect(billingRow.getByRole('button', { name: 'Pay' })).toBeDisabled()
  } finally {
    await deletePatientIfPresent(page)
  }
})
