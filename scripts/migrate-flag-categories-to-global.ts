#!/usr/bin/env npx tsx
/**
 * Migrate flag config from business-scoped paths to the global collection.
 *
 * Old: businesses/{businessId}/flagCategories/{categoryId}/flags/{flagId}
 * New: flagCategories/{categoryId}/flags/{flagId}
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/migrate-flag-categories-to-global.ts
 *   npx tsx --env-file=.env.local scripts/migrate-flag-categories-to-global.ts --apply
 *   npx tsx --env-file=.env.local scripts/migrate-flag-categories-to-global.ts --business-id YOUR_BUSINESS_ID --apply
 */

import { adminDb } from '../src/lib/firebase/admin'

type CliOptions = {
  apply: boolean
  businessId?: string
  force: boolean
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { apply: false, force: false }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--apply') options.apply = true
    else if (arg === '--force') options.force = true
    else if (arg === '--business-id') options.businessId = argv[++i]
    else if (arg === '--help' || arg === '-h') {
      console.log(`\
Migrate flagCategories from businesses/* to root flagCategories.

Options:
  --apply                 Write to Firestore (default is dry-run)
  --business-id <id>      Migrate only one business document
  --force                 Overwrite existing global categories/flags
  --help                  Show this help
`)
      process.exit(0)
    }
  }

  return options
}

async function listBusinessIds(): Promise<string[]> {
  const snap = await adminDb.collection('businesses').get()
  return snap.docs.map((doc: { id: string }) => doc.id)
}

async function migrateBusiness(
  businessId: string,
  options: CliOptions
): Promise<{ categories: number; flags: number; skippedCategories: number; skippedFlags: number }> {
  const sourceRoot = adminDb.collection(`businesses/${businessId}/flagCategories`)
  const categoriesSnap = await sourceRoot.get()

  let categories = 0
  let flags = 0
  let skippedCategories = 0
  let skippedFlags = 0

  for (const categoryDoc of categoriesSnap.docs) {
    const categoryId = categoryDoc.id
    const categoryData = categoryDoc.data()
    const globalCategoryRef = adminDb.collection('flagCategories').doc(categoryId)
    const existingCategory = await globalCategoryRef.get()

    if (existingCategory.exists && !options.force) {
      console.log(`  [skip category] ${categoryId} (already exists globally)`)
      skippedCategories += 1
    } else {
      console.log(
        `  [category] ${categoryId} "${String(categoryData.name ?? '')}"${options.apply ? '' : ' (dry-run)'}`
      )
      if (options.apply) {
        await globalCategoryRef.set(categoryData, { merge: !options.force })
      }
      categories += 1
    }

    const flagsSnap = await sourceRoot.doc(categoryId).collection('flags').get()
    for (const flagDoc of flagsSnap.docs) {
      const flagId = flagDoc.id
      const flagData = flagDoc.data()
      const globalFlagRef = globalCategoryRef.collection('flags').doc(flagId)
      const existingFlag = await globalFlagRef.get()

      if (existingFlag.exists && !options.force) {
        console.log(`    [skip flag] ${flagId}`)
        skippedFlags += 1
        continue
      }

      console.log(`    [flag] ${flagId} "${String(flagData.label ?? '')}"${options.apply ? '' : ' (dry-run)'}`)
      if (options.apply) {
        await globalFlagRef.set(flagData, { merge: !options.force })
      }
      flags += 1
    }
  }

  return { categories, flags, skippedCategories, skippedFlags }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const businessIds = options.businessId ? [options.businessId] : await listBusinessIds()

  if (businessIds.length === 0) {
    console.log('No business documents found under businesses/.')
    return
  }

  console.log(options.apply ? 'APPLY mode — writing to Firestore' : 'DRY-RUN — no writes (pass --apply to migrate)')
  console.log(`Businesses to scan: ${businessIds.join(', ')}\n`)

  let totalCategories = 0
  let totalFlags = 0
  let totalSkippedCategories = 0
  let totalSkippedFlags = 0

  for (const businessId of businessIds) {
    console.log(`Business: ${businessId}`)
    const result = await migrateBusiness(businessId, options)
    totalCategories += result.categories
    totalFlags += result.flags
    totalSkippedCategories += result.skippedCategories
    totalSkippedFlags += result.skippedFlags
    console.log('')
  }

  console.log('Summary')
  console.log(`  Categories to migrate: ${totalCategories}`)
  console.log(`  Flags to migrate: ${totalFlags}`)
  console.log(`  Skipped categories: ${totalSkippedCategories}`)
  console.log(`  Skipped flags: ${totalSkippedFlags}`)

  if (!options.apply) {
    console.log('\nRun again with --apply to perform the migration.')
  } else {
    console.log('\nDone. Verify in Firebase Console: root collection "flagCategories".')
    console.log('After verification, you may delete businesses/*/flagCategories manually.')
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
