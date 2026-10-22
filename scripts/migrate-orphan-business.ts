#!/usr/bin/env npx tsx
/**
 * Copy medicines / diseases from an orphaned business to a live business.
 *
 * Why: records written before the multi-tenant rules live under businesses/{oldId}/..., but no
 * signed-in user has businessId == oldId any more, so the strict rules make them unreachable.
 * This copies them under the business that is in use (businesses/{newId}).
 *
 * Safety:
 *  - Dry-run by default; nothing is written without --apply.
 *  - Copy only: the source documents are never modified or deleted.
 *  - Existing target documents are skipped unless --force.
 *  - --apply also needs --confirm-project <id> matching FIREBASE_ADMIN_PROJECT_ID, so a wrong
 *    .env file cannot write to the wrong Firebase project.
 *  - The target must be an existing owner: users/{newId} must exist with businessId == newId.
 *
 * Usage (PowerShell: use npx.cmd):
 *   npx tsx --env-file=<env file> scripts/migrate-orphan-business.ts --from OLD_ID --to NEW_ID
 *   npx tsx --env-file=<env file> scripts/migrate-orphan-business.ts --from OLD_ID --to NEW_ID --apply --confirm-project mediflow-prod-cc377
 *   Optional: --collections medicines,diseases   --force
 */

import { adminDb } from '../src/lib/firebase/admin'

const DEFAULT_COLLECTIONS = ['medicines', 'diseases']
const BATCH_SIZE = 400

type CliOptions = {
  from?: string
  to?: string
  collections: string[]
  apply: boolean
  force: boolean
  confirmProject?: string
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { collections: DEFAULT_COLLECTIONS, apply: false, force: false }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--from') options.from = argv[++i]
    else if (arg === '--to') options.to = argv[++i]
    else if (arg === '--collections') options.collections = (argv[++i] ?? '').split(',').filter(Boolean)
    else if (arg === '--confirm-project') options.confirmProject = argv[++i]
    else if (arg === '--apply') options.apply = true
    else if (arg === '--force') options.force = true
    else if (arg === '--help' || arg === '-h') {
      console.log(`\
Copy collections from businesses/{from} to businesses/{to}.

Options:
  --from <id>                 Orphaned business id (source)
  --to <id>                   Live business id (target, must be an owner's businessId)
  --collections a,b           Default: ${DEFAULT_COLLECTIONS.join(',')}
  --apply                     Write to Firestore (default is dry-run)
  --confirm-project <id>      Required with --apply; must equal FIREBASE_ADMIN_PROJECT_ID
  --force                     Overwrite documents that already exist in the target
  --help                      Show this help
`)
      process.exit(0)
    }
  }

  return options
}

async function assertTargetIsLiveOwner(to: string): Promise<void> {
  const profile = await adminDb.collection('users').doc(to).get()
  const data = profile.data()
  if (!profile.exists || data?.businessId !== to || data?.role !== 'super_admin') {
    throw new Error(
      `Refusing to continue: users/${to} must exist with role "super_admin" and businessId "${to}". ` +
        'Pass the owner uid shown in Firebase Authentication as --to.'
    )
  }
}

async function copyCollection(
  from: string,
  to: string,
  name: string,
  options: CliOptions
): Promise<{ copied: number; skipped: number; rewritten: number }> {
  const sourceSnap = await adminDb.collection(`businesses/${from}/${name}`).get()
  const targetSnap = await adminDb.collection(`businesses/${to}/${name}`).get()
  const existing = new Set(targetSnap.docs.map((d: { id: string }) => d.id))

  let copied = 0
  let skipped = 0
  let rewritten = 0
  let batch = adminDb.batch()
  let inBatch = 0

  for (const doc of sourceSnap.docs) {
    if (existing.has(doc.id) && !options.force) {
      skipped += 1
      continue
    }

    const data = { ...doc.data() } as Record<string, unknown>
    // A stored tenant id would point the copy back at the orphan; repoint it.
    if (data.businessId === from) {
      data.businessId = to
      rewritten += 1
    }

    if (options.apply) {
      batch.set(adminDb.doc(`businesses/${to}/${name}/${doc.id}`), data)
      inBatch += 1
      if (inBatch >= BATCH_SIZE) {
        await batch.commit()
        batch = adminDb.batch()
        inBatch = 0
      }
    }
    copied += 1
  }

  if (options.apply && inBatch > 0) await batch.commit()
  return { copied, skipped, rewritten }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const { from, to } = options
  if (!from || !to) throw new Error('Both --from and --to are required (see --help).')
  if (from === to) throw new Error('--from and --to must be different.')

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  console.log(`Firebase project: ${projectId ?? '(not set)'}`)
  console.log(options.apply ? 'APPLY mode: writing to Firestore' : 'DRY-RUN: no writes (pass --apply to migrate)')

  if (options.apply && options.confirmProject !== projectId) {
    throw new Error(
      `--apply requires --confirm-project ${projectId ?? '<project id>'} to match FIREBASE_ADMIN_PROJECT_ID.`
    )
  }

  await assertTargetIsLiveOwner(to)
  console.log(`Target owner OK: users/${to}\n`)

  for (const name of options.collections) {
    const { copied, skipped, rewritten } = await copyCollection(from, to, name, options)
    console.log(
      `${name}: ${copied} ${options.apply ? 'copied' : 'to copy'}, ${skipped} already in target (skipped)` +
        (rewritten ? `, ${rewritten} businessId field(s) repointed` : '')
    )
  }

  if (!options.apply) {
    console.log('\nRun again with --apply --confirm-project <project id> to perform the copy.')
  } else {
    console.log(`\nDone. Verify in Firebase Console under businesses/${to}. The source was not changed.`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
