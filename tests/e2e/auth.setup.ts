import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const stateFile = path.join(__dirname, '..', '.auth', 'state.json')

/**
 * Signs in once with the TEST account and stores cookies + IndexedDB.
 * Firebase client auth lives in IndexedDB, so `indexedDB: true` is required; without it
 * every protected page renders blank.
 */
setup('sign in with the test account', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD
  fs.mkdirSync(path.dirname(stateFile), { recursive: true })

  if (!email || !password) {
    fs.writeFileSync(stateFile, JSON.stringify({ cookies: [], origins: [] }))
    setup.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD are not set')
    return
  }

  await page.goto('/')
  // The login card renders a hidden duplicate form, so target visible inputs only.
  await page.locator('input[type=email]:visible').first().fill(email)
  await page.locator('input[type=password]:visible').first().fill(password)
  await page.locator('button[type=submit]:visible').first().click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 })
  await page.context().storageState({ path: stateFile, indexedDB: true })
})
