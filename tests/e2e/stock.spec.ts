import { test, expect, type Page, type Locator } from '@playwright/test'
import fs from 'node:fs'

/**
 * Stock journey against the TEST Firebase project. Self-contained: it creates its own vault
 * medicine (unique name), runs the whole flow, then deletes the stock item and the medicine
 * even when a step fails. Movement history is append-only by design and is left behind.
 *
 * Expired-batch behaviour cannot be exercised from the browser (the service refuses to receive
 * expired stock), so it is covered by unit-level checks / manual seeding instead.
 */

test.skip(!process.env.TEST_USER_EMAIL, 'needs TEST_USER_EMAIL / TEST_USER_PASSWORD (test project)')

const STATE_FILE = 'tests/.auth/state.json'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const RUN_ID = Date.now().toString(36)
const MEDICINE = `E2E Stock ${RUN_ID}`
const POTENCY = '30C'

function isoIn(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const dialog = (page: Page) => page.getByRole('dialog').last()
const ledgerRow = (page: Page) => page.locator('table tbody tr').filter({ hasText: MEDICINE })
const toast = (page: Page, text: RegExp | string) =>
  page.locator('[data-sonner-toast]').filter({ hasText: text }).first()

async function openInventory(page: Page) {
  await page.goto('/inventory')
  await expect(page.locator('main h1:visible')).toHaveCount(1, { timeout: 30_000 })
}

async function chooseOption(page: Page, trigger: Locator, option: string | RegExp) {
  await trigger.click()
  await page.getByRole('option', { name: option }).first().click()
}

async function adjust(
  page: Page,
  opts: { type: string; direction?: 'add' | 'remove'; qty: number; batch?: RegExp }
) {
  await ledgerRow(page).getByRole('button', { name: /Adjust stock/ }).click()
  const dlg = dialog(page)
  await chooseOption(page, dlg.locator('#adjust-type'), opts.type)
  if (opts.direction) {
    await dlg
      .getByRole('radio', {
        name: opts.direction === 'add' ? 'Count correction: add stock' : 'Count correction: remove stock',
      })
      .click()
  }
  if (opts.batch) await chooseOption(page, dlg.locator('#adjust-batch'), opts.batch)
  await dlg.locator('#adjust-qty').fill(String(opts.qty))
  await dlg.getByRole('button', { name: 'Confirm adjustment' }).click()
  await expect(toast(page, /Stock adjusted/)).toBeVisible()
}

async function receive(page: Page, opts: { qty: number; batch: string; expiry: string; cost?: number }) {
  await ledgerRow(page).getByRole('button', { name: /Receive stock/ }).click()
  const dlg = dialog(page)
  await dlg.locator('#receive-qty').fill(String(opts.qty))
  await dlg.locator('#receive-cost').fill(String(opts.cost ?? 5))
  await dlg.locator('#receive-batch').fill(opts.batch)
  await dlg.locator('#receive-expiry').fill(opts.expiry)
  await dlg.getByRole('button', { name: 'Receive stock' }).click()
  await expect(toast(page, /Stock received/)).toBeVisible()
}

test.describe.serial('stock management', () => {
  test.afterAll(async ({ browser }) => {
    test.setTimeout(120_000)
    // Best-effort cleanup that must not mask the real test result.
    if (!fs.existsSync(STATE_FILE)) return
    const context = await browser.newContext({ storageState: STATE_FILE, baseURL: BASE_URL })
    const page = await context.newPage()
    try {
      await openInventory(page)
      const row = ledgerRow(page)
      if (await row.count()) {
        const sellable = await row.first().innerText()
        if (!/\b0 bottles/.test(sellable)) {
          // Drain whatever is left (all batches) with a count correction.
          await row.getByRole('button', { name: /View details/ }).click()
          const text = await dialog(page).innerText()
          const match = text.match(/\/\s*(\d+)\s*bottles/)
          await page.keyboard.press('Escape')
          if (match && Number(match[1]) > 0) {
            await adjust(page, { type: 'Adjustment', direction: 'remove', qty: Number(match[1]) })
          }
        }
        await row.getByRole('button', { name: /More actions/ }).click()
        await page.getByRole('menuitem', { name: 'Delete item' }).click()
        await page.getByRole('alertdialog').getByRole('button', { name: 'Delete item' }).click()
        await expect(toast(page, /Stock item deleted/)).toBeVisible()
      }
    } catch (error) {
      console.warn('stock item cleanup failed:', (error as Error).message)
    }
    try {
      await page.goto('/vault/medicine')
      await page.getByPlaceholder(/search/i).first().fill(MEDICINE)
      await page.keyboard.press('Enter')
      const del = page.getByRole('button', { name: `Delete ${MEDICINE}` }).first()
      await del.waitFor({ timeout: 15_000 })
      await del.click()
      await page.getByRole('button', { name: 'Delete medicine' }).click()
      await expect(page.getByRole('button', { name: `Delete ${MEDICINE}` })).toHaveCount(0, { timeout: 15_000 })
    } catch (error) {
      console.warn('medicine cleanup failed:', (error as Error).message)
    }
    await context.close()
  })

  test('full stock journey', async ({ page }) => {
    test.setTimeout(240_000)

    await test.step('create a vault medicine', async () => {
      await page.goto('/vault/medicine/new')
      await page.getByPlaceholder('e.g. Arnica Montana').fill(MEDICINE)
      await page.getByRole('button', { name: /Save medicine|Add Medicine/ }).first().click()
      await page.getByRole('button', { name: 'Confirm & save' }).click()
      await page.waitForURL((url) => !url.pathname.endsWith('/new'), { timeout: 30_000 })
    })

    await openInventory(page)

    await test.step('add stock item (validation, then create)', async () => {
      await page.getByRole('button', { name: 'Add stock item' }).first().click()
      const dlg = dialog(page)
      await dlg.getByRole('button', { name: 'Create item' }).click()
      await expect(dlg.getByText('Select a medicine from the vault').first()).toBeVisible()
      await expect(dlg.getByText('Storage location is required')).toBeVisible()

      await dlg.getByPlaceholder(/Search the medicine vault/).fill(MEDICINE)
      await page.getByRole('option', { name: new RegExp(MEDICINE) }).click()
      await dlg.locator('#stock-potency').fill(POTENCY)
      await dlg.locator('#stock-location').fill('Shelf E2E')
      await dlg.locator('#stock-reorder-level').fill('10')
      await dlg.locator('#stock-reorder-qty').fill('20')
      await dlg.getByRole('button', { name: 'Create item' }).click()
      await expect(toast(page, 'Stock item created')).toBeVisible()
      await expect(ledgerRow(page)).toBeVisible()
    })

    await test.step('duplicate item shows the real error', async () => {
      await page.getByRole('button', { name: 'Add stock item' }).first().click()
      const dlg = dialog(page)
      await dlg.getByPlaceholder(/Search the medicine vault/).fill(MEDICINE)
      await page.getByRole('option', { name: new RegExp(MEDICINE) }).click()
      await dlg.locator('#stock-potency').fill(POTENCY)
      await dlg.locator('#stock-location').fill('Shelf Dup')
      await dlg.getByRole('button', { name: 'Create item' }).click()
      await expect(toast(page, /already tracked/)).toBeVisible()
      await expect(dlg.getByText(/already tracked/).first()).toBeVisible()
      await dlg.getByRole('button', { name: 'Cancel' }).click()
    })

    await test.step('receive validation, two batches and a top-up', async () => {
      await ledgerRow(page).getByRole('button', { name: /Receive stock/ }).click()
      const dlg = dialog(page)
      await dlg.locator('#receive-qty').fill('0')
      await dlg.locator('#receive-batch').fill('A1')
      await dlg.locator('#receive-expiry').fill(isoIn(-3))
      await dlg.getByRole('button', { name: 'Receive stock' }).click()
      await expect(dlg.getByText('Expiry date cannot be in the past')).toBeVisible()
      await expect(dlg.getByText(/whole number greater than zero/)).toBeVisible()
      await dlg.getByRole('button', { name: 'Cancel' }).click()

      await receive(page, { qty: 20, batch: 'A1', expiry: isoIn(90) })
      await expect(ledgerRow(page)).toContainText('20 bottles')

      await ledgerRow(page).getByRole('button', { name: /Receive stock/ }).click()
      const topUp = dialog(page)
      await topUp.locator('#receive-qty').fill('5')
      await topUp.locator('#receive-batch').fill('A1')
      await topUp.locator('#receive-expiry').fill(isoIn(90))
      await expect(topUp.getByText(/already exists, so 5 bottles will be added/)).toBeVisible()
      await topUp.getByRole('button', { name: 'Receive stock' }).click()
      await expect(toast(page, /Stock received/)).toBeVisible()
      await expect(ledgerRow(page)).toContainText('25 bottles')

      await receive(page, { qty: 10, batch: 'B1', expiry: isoIn(20) })
      await expect(ledgerRow(page)).toContainText('35 bottles')
    })

    await test.step('insufficient stock is blocked inline', async () => {
      await ledgerRow(page).getByRole('button', { name: /Adjust stock/ }).click()
      const dlg = dialog(page)
      await dlg.locator('#adjust-qty').fill('999')
      await expect(dlg.getByText(/Only 35 bottles available/)).toBeVisible()
      await dlg.locator('#adjust-qty').fill('1.5')
      await expect(dlg.getByText(/whole number/)).toBeVisible()
      await dlg.getByRole('button', { name: 'Cancel' }).click()
    })

    await test.step('dispense takes the earliest-expiry batch first', async () => {
      await adjust(page, { type: 'Dispense', qty: 4 })
      await expect(ledgerRow(page)).toContainText('31 bottles')
      await ledgerRow(page).getByRole('button', { name: /View details/ }).click()
      const sheet = dialog(page)
      await expect(sheet.getByText(/B1/).first()).toBeVisible()
      expect(await sheet.innerText()).toMatch(/B1[\s\S]*?6 bottles/)
      await page.keyboard.press('Escape')
    })

    await test.step('count corrections and return need a batch when adding', async () => {
      await ledgerRow(page).getByRole('button', { name: /Adjust stock/ }).click()
      const dlg = dialog(page)
      await chooseOption(page, dlg.locator('#adjust-type'), 'Adjustment')
      await dlg.getByRole('radio', { name: 'Count correction: add stock' }).click()
      await dlg.locator('#adjust-qty').fill('2')
      await dlg.getByRole('button', { name: 'Confirm adjustment' }).click()
      await expect(dlg.getByText('Select a batch')).toBeVisible()
      await chooseOption(page, dlg.locator('#adjust-batch'), /A1/)
      await expect(dlg.getByText('Resulting balance: 33 bottles')).toBeVisible()
      await dlg.getByRole('button', { name: 'Confirm adjustment' }).click()
      await expect(toast(page, /Stock adjusted/)).toBeVisible()
      await expect(ledgerRow(page)).toContainText('33 bottles')

      await adjust(page, { type: 'Adjustment', direction: 'remove', qty: 3 })
      await expect(ledgerRow(page)).toContainText('30 bottles')

      await adjust(page, { type: 'Return', qty: 1, batch: /B1/ })
      await expect(ledgerRow(page)).toContainText('31 bottles')
    })

    await test.step('expired removal is blocked when nothing has expired', async () => {
      await ledgerRow(page).getByRole('button', { name: /Adjust stock/ }).click()
      const dlg = dialog(page)
      await chooseOption(page, dlg.locator('#adjust-type'), 'Expired removal')
      await dlg.locator('#adjust-qty').fill('1')
      await expect(dlg.getByText(/Only 0 bottles available|No sellable stock/).first()).toBeVisible()
      await dlg.getByRole('button', { name: 'Cancel' }).click()
    })

    await test.step('movements tab lists entries with the user', async () => {
      await page.getByRole('tab', { name: /Movements/ }).click()
      await expect(page.getByText(/Showing all \d+ movements|Showing latest 300 movements/)).toBeVisible()
      const articles = page.locator('article').filter({ hasText: MEDICINE })
      await expect(articles.first()).toBeVisible()
      expect(await articles.count()).toBeGreaterThanOrEqual(7)
      await expect(articles.first()).toContainText(/By\s+\S+/)
      await page.getByRole('button', { name: 'Movement type' }).click()
      await page.getByRole('menuitemcheckbox', { name: 'Dispense' }).click()
      await page.keyboard.press('Escape')
      await expect(page.getByText(/Showing \d+ of the latest 300 movements/)).toBeVisible()
      await page.getByRole('tab', { name: /Stock ledger/ }).click()
    })

    await test.step('ledger CSV download', async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export' }).click(),
      ])
      expect(download.suggestedFilename()).toMatch(/^stock-ledger-\d{4}-\d{2}-\d{2}\.csv$/)
      const path = await download.path()
      const csv = fs.readFileSync(path, 'utf8')
      expect(csv).toContain('Sellable quantity')
      expect(csv).toContain(MEDICINE)
    })

    await test.step('delete is blocked while stock remains', async () => {
      await ledgerRow(page).getByRole('button', { name: /More actions/ }).click()
      await page.getByRole('menuitem', { name: 'Delete item' }).click()
      const ad = page.getByRole('alertdialog')
      await expect(ad.getByText(/Only items with no stock left can be deleted/)).toBeVisible()
      await expect(ad.getByRole('button', { name: 'Delete item' })).toBeDisabled()
      await ad.getByRole('button', { name: 'Cancel' }).click()
    })

    await test.step('data persists across a reload', async () => {
      await page.reload()
      await expect(ledgerRow(page)).toContainText('31 bottles', { timeout: 30_000 })
    })
  })

  test.describe('mobile layout', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('ledger shows cards without horizontal overflow', async ({ page }) => {
      await openInventory(page)
      const cards = page.locator('[data-testid=stock-cards]')
      await expect(cards).toBeVisible({ timeout: 30_000 })
      await expect(cards.locator('article').filter({ hasText: MEDICINE })).toBeVisible()
      await expect(page.locator('table:visible')).toHaveCount(0)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      )
      expect(overflow, 'horizontal overflow').toBe(false)
      await cards.getByRole('button', { name: /Receive stock/ }).first().click()
      await expect(dialog(page)).toBeVisible()
    })
  })

  test('delete is allowed once stock is zero', async ({ page }) => {
    await openInventory(page)
    await adjust(page, { type: 'Adjustment', direction: 'remove', qty: 31 })
    await expect(ledgerRow(page)).toContainText('Out of stock')
    await ledgerRow(page).getByRole('button', { name: /More actions/ }).click()
    await page.getByRole('menuitem', { name: 'Delete item' }).click()
    const ad = page.getByRole('alertdialog')
    await expect(ad.getByRole('button', { name: 'Delete item' })).toBeEnabled()
    await ad.getByRole('button', { name: 'Delete item' }).click()
    await expect(toast(page, 'Stock item deleted')).toBeVisible()
    await expect(ledgerRow(page)).toHaveCount(0)
  })
})
