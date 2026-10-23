#!/usr/bin/env npx tsx
/**
 * Publish firestore.rules to a Firebase project using a service account (Admin SDK).
 * Used by .github/workflows/deploy-rules.yml; can also be run by hand.
 *
 * Credentials come from ONE environment variable holding the service-account JSON:
 *   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", ...}'
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=... npx tsx scripts/deploy-firestore-rules.ts --project mediflow-test-11bbe
 *   Add --dry-run to validate the credentials and the rules file without publishing.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getSecurityRules } from 'firebase-admin/security-rules'

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function main() {
  const projectId = readArg('--project')
  const dryRun = process.argv.includes('--dry-run')
  const rulesPath = resolve(readArg('--rules') ?? 'firestore.rules')
  const rawAccount = process.env.FIREBASE_SERVICE_ACCOUNT

  if (!projectId) throw new Error('--project <firebase project id> is required.')
  if (!rawAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set.')

  let account: { project_id?: string; client_email?: string; private_key?: string }
  try {
    account = JSON.parse(rawAccount)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.')
  }
  // Guard against deploying with the wrong environment's key.
  if (account.project_id !== projectId) {
    throw new Error(
      `Service account belongs to project "${account.project_id}", but --project is "${projectId}". Refusing to deploy.`
    )
  }

  const source = readFileSync(rulesPath, 'utf8')
  if (!source.includes('service cloud.firestore')) {
    throw new Error(`${rulesPath} does not look like a Firestore rules file.`)
  }

  console.log(`Project: ${projectId}`)
  console.log(`Rules:   ${rulesPath} (${source.length} bytes)`)

  const app = initializeApp({ credential: cert(account as Parameters<typeof cert>[0]), projectId })
  const rules = getSecurityRules(app)

  if (dryRun) {
    // Validates the credentials and the syntax: this creates no release.
    await rules.getFirestoreRuleset()
    console.log('Dry run OK: credentials work. Nothing was published.')
    return
  }

  const ruleset = await rules.releaseFirestoreRulesetFromSource(source)
  console.log(`Published ruleset ${ruleset.name} at ${ruleset.createTime}.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
