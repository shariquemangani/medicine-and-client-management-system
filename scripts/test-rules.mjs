// Runs the Firestore rules tests inside the emulator and makes sure no emulator is left behind.
// On Windows, `firebase emulators:exec` can leave the Java emulator process running, which makes
// the next run fail with "Could not start Firestore Emulator, port taken".
import { spawnSync, execSync } from 'node:child_process'

const PORT = 8085 // keep in sync with firebase.json

function listeningPids(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' })
      return [
        ...new Set(
          out
            .split(/\r?\n/)
            .filter((l) => l.includes('LISTENING') && new RegExp(`[:.]${port}\\s`).test(l))
            .map((l) => l.trim().split(/\s+/).pop())
        ),
      ]
    }
    return execSync(`lsof -ti tcp:${port} -sTCP:LISTEN || true`, { encoding: 'utf8', shell: '/bin/sh' })
      .split(/\s+/)
      .filter(Boolean)
  } catch {
    return []
  }
}

function killEmulator() {
  for (const pid of listeningPids(PORT)) {
    try {
      process.kill(Number(pid), 'SIGKILL')
    } catch {
      // already gone
    }
  }
}

killEmulator() // clear a leftover emulator from a previous run

const result = spawnSync(
  'npx',
  [
    'firebase',
    'emulators:exec',
    '--only',
    'firestore',
    '--project',
    'demo-mediflow',
    '"node tests/rules/firestore.rules.test.mjs"',
  ],
  { stdio: 'inherit', shell: true }
)

killEmulator()
process.exit(result.status ?? 1)
